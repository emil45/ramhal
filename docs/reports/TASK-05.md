# TASK-05 — Data integrity, provisioning, and a full re-import

No brief file exists in `docs/tasks/` for this task — driven directly from chat instructions
against `docs/reviews/REVIEW-01-findings.md` and `docs/reviews/REVIEW-01-verdict.md`. Scope was
Batch A and Batch B from the verdict, then a full re-import. Batch C and D were left untouched.

## #2 — the conflicting claim, resolved first

Codex's claim is the one that's true. Verified empirically against a genuinely empty, disposable
Neon database (created via the Neon MCP tools, deleted afterward): calling `getPayload({ config })`
before `payload.db.migrate()` runs `onInit` → `seed()` → `payload.find({ collection: 'categories' })`
first, which fails with `relation "categories" does not exist` on an empty database. TASK-03's
report claim of a verified successful empty-database run does not match the code as committed.

Fixed by passing `disableOnInit: true` to `getPayload()` in the migrate route — exactly what
Payload's own CLI does (`node_modules/payload/dist/bin/migrate.js`). Re-verified against the same
empty database: `migrate` now succeeds and applies the initial migration cleanly.

## What was built

**Batch A — data integrity**

- **#3 money validation.** `validateIntegerAmount` no longer replaces Payload's field
  `validate` — it composes with it: `payload/shared`'s own `number` validator runs first (enforcing
  `min`/`required`), then the integer check. Both Books' price `amount` and ShippingSettings' tier
  `amount` now use the composed `validateMoneyAmount`. Kept the existing predicate test (still
  correct, per the verdict's correction) and added a second test against the *configured field*
  with a fully-typed `ValidateOptions<unknown, unknown, NumberField, number>` mock, covering
  negative, missing, fractional, and valid.
- **#7 language guessing.** `deriveBookLanguage` no longer falls back to `'en'` when a Latin-script
  title has no shelf category — it returns `'unknown'`, a new honest `bookLanguage` option
  (`unknown`, לא ידוע). `category` is no longer `required` for the same reason: the legacy sites'
  own categories *are* the three language shelves, so guessing one when the language is unknown
  repeats the same mistake. A new `language-uncertain` review reason flags it.
- **#8 parser content loss.** `blocksOf()` in `scripts/scrape/parse.mjs` no longer excludes a whole
  element because it has a nested block descendant. It now takes each element's *own* text (via a
  new `ownText()`/its `.contents()` walk) — text not already owned by a nested block — so a
  paragraph with an inline `<span>` keeps its own prose *and* the span is still counted once,
  separately. Added `scripts/scrape/parse.test.mjs` (new — the scraper had zero tests before this)
  with fixtures for exactly the two regressions in play: inline markup, and a nested legacy table.
- **#12 fabricated publication dates.** `publishedAt` is no longer stamped with import time — it's
  left unset (`required` removed from the field). A new hidden `importedAt` field (with a
  `defaultValue` function) now carries the actual creation timestamp, so import time and
  publication time are two different facts instead of one field pretending to be both.

**Batch B — provisioning**

- **#2** — see above.
- **#4 missing migration.** Generated and committed `20260917_172914_books_review_fields`, capturing
  `needsReview`, `reviewReasons`, `reviewNote`, `importKey` (already silently present in the dev
  database via auto-push, confirmed by inspecting its live schema) plus everything Batch A above
  added: `importedAt`, `category`/`published_at` becoming nullable, and the `unknown`/`zero-price`
  enum values.
- **#1 seed overwriting admin edits.** `upsertCategory` now only creates; it never re-updates an
  existing category's title. `seedShippingSettings`/`seedSchedule` now check for existing data
  (`zones.length > 0`, `shiurim`/`prayers` non-empty) before writing defaults, instead of writing
  unconditionally on every boot.

**Then: wipe and re-import**

- Dropped and recreated the `public` schema on the real dev database, ran both migrations from
  nothing, booted normally (seed ran), then ran the import against freshly regenerated
  `scripts/scrape/out/*.json` and `reconciliation.json` (parse.mjs and reconcile.mjs both needed
  re-running — the committed `reconciliation.json` predates the `images`/`priceZero` fields below).
- **Cover images.** `parse.mjs` now detects boilerplate *images* the same way it already detects
  boilerplate *text blocks*: an image repeated across most of a site's pages (nav icons, "other
  products" sidebar thumbnails — verified: 18–23 of them, appearing on *every* product page) is
  chrome, not that page's content. What's left, when anything is, is genuinely that page's own
  product image (spot-checked: filenames like `shod melakhim cover-2.jpg` for `שוד מלכים`). Wired
  through `reconcile.mjs` → `importBooks.ts`'s new `pickCoverImageUrl`/`attachCover`, which
  downloads the candidate to a temp file (Payload's Local API upload takes a `filePath`) and
  creates+attaches a `media` document, or returns `'fetch-failed'`/`'no-candidate'` without
  throwing — a 404 skips that one book's cover, not the run.
- **Zero prices.** `reconcile.mjs`'s `buildImportView` now sets `priceZero` when any site's real
  price field (not the already-excluded list-price field) is exactly 0, independent of
  `priceImplausible` (which only fires by comparing *across* sites and can't catch a single site's
  own zero). New `zero-price` review reason.

## What was verified and how

- **#2/#4/#1**, against a disposable Neon database created and deleted via the Neon MCP tools
  (never touching real data until explicit confirmation for the final wipe): confirmed the crash on
  empty, confirmed the fix, generated and applied both migrations from nothing, then edited a
  shipping tier directly in the database, restarted the app, and confirmed the edit survived.
  Repeated the same restart-survives-edit check against the real dev database after the re-import.
- **#3**: `npx vitest run src/lib/validateIntegerAmount.test.ts` — 7 tests, including the four new
  configured-field cases.
- **#7**: after the full re-import, `"La voix des justes"` and `"L'essence de la Torah"` (the two
  titles named in the finding) are `book_language = 'unknown'` with `language-uncertain` in their
  review reasons, not `english-books`. 21 of 128 imported books are `unknown`.
- **#8**: `npx vitest run scripts/scrape/parse.test.mjs` — 3 fixture tests (mixed inline markup,
  nested table, short-block-with-price) all pass.
- **#12**: after re-import, `select count(published_at) from books` is 0 of 128 — no fabricated
  dates. `imported_at` is set and distinct for all 128 (the audit trail is real; the publication
  date is honestly absent).
- **Zero prices**: found 8, not just the one named in the brief — a whole `דברות רמח"ל` series (5
  volumes) plus a CD, all EUR/USD 0.00 on non-Hebrew sites, all now flagged `zero-price` and
  `needsReview`.
- **Covers**: 7 of 128 books got a real cover; 121 did not (no non-chrome image existed for that
  page in the scraped data). Reported by `importBooks`' summary: `coversAttached: 7, coversMissing: 121`.
- **Money validation on real data**: `min(amount) = 0, max(amount) = 30000` across all imported
  prices; 0 negative, 0 fractional.
- Full suite after every change: `npx tsc --noEmit`, `npx vitest run` (37 tests, 6 files),
  `npx eslint src scripts` (0 errors; only the pre-existing 4 unused-parameter warnings in
  Payload's own generated migration template, present in both migration files).

## What felt wrong

- The cover-image heuristic (repeated-image-is-chrome) works and is verified against the real
  crawl, but it's still a heuristic bolted onto old, low-quality data — 121 of 128 books
  legitimately have no recoverable cover in this source at all, not because the heuristic missed
  them. That's a property of the legacy sites, not a bug, but it means "import covers" mostly
  means "import the seven that exist."
- `zero-price` catching 8 books instead of 1 is a good outcome but underscores how easy it would
  have been to miss the pattern if only the one named example had been checked by hand instead of
  the whole catalogue.
- The `unknown` bookLanguage value and the now-optional `category` field are a real, if small,
  widening of Books' schema surface — a human reviewing this collection cold needs to know
  `unknown`/blank-category is a first-class, expected state, not a data-entry error to "fix" by
  guessing. That's explained on the field (`admin.description`, comments), but it's new surface
  area to explain.

## What is still open

- Batch C (#5 port ownership, #6 partial-import recovery, #9 cluster keying, #10 silent scraper
  failures) and Batch D (#11 shared rules/generated types, #13 the README, formatter config) were
  explicitly out of scope for this task and were not touched.
- `src/payload-types.ts` is still absent (#11) — `importBooks.ts` and the migrate/import routes
  still call Payload's Local API against fallback types, not generated ones. This task's new code
  (`BookInput`, `ImportView`, `CoverResult`, etc.) is hand-typed for the same reason everything
  else here already was.
- The `~124 estimated vs. 120 resolved vs. 128 imported` discrepancy flagged as open in TASK-04 is
  unchanged by this task — the re-import is still 128 created, same as TASK-04's second stable run.
