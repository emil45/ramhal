# TASK-07 — Storefront correctness and the front page

## What was built

**A1 — canonical URL per book.** Added `urlSlug` to `Books`: non-localized, `unique: true`
(a real `UNIQUE(url_slug)` constraint, not the per-locale one `slug` has), `required: true`,
filled by the same `generateSlugFromTitle` hook `slug` already uses (it only reads
`data.title`, so reusing it needed no new code). Went with option **(a)** from the brief: one
canonical field is the public URL everywhere, `slug` stays only as raw material for a future
legacy-redirect map. `getCatalogueBookBySlug` now looks up by `urlSlug` and **throws** if more
than one book ever matches — it used to `.find()` silently. The import (`upsertBook`) now
writes `urlSlug: ''` the same way it already did for `slug`, so a title that collides with an
existing different book's `urlSlug` makes `payload.create()` throw at the database's unique
constraint — the import refuses, as required.

Four real title collisions existed in the current 128-book catalogue (8 books, not the 2 pairs
the brief named — `la-kabbale-de-la-reparation`, a Zohar-Rashbi title, and the two named in the
brief). All eight are pre-existing `ambiguous-match`-flagged near-duplicates (TASK-08's data
worklist), not two distinct works that happen to share a title, so merging them wasn't an
option here. Migration `20260918_122803_books_url_slug` backfills every pre-existing book's
`urlSlug` from its best-available title (Hebrew → English → French, the same priority
`bestAcrossLocales` uses) and, only on a collision, appends a deterministic `-2`, `-3`, … to
the later book id — the lower id keeps the bare slug, matching which one the old buggy lookup
already resolved to, so no existing link changes. This is a **one-time exception for data that
predates the constraint**; any new collision from here on is a hard write failure, not a
suffix. Documented in the migration file itself, not just here.

Building this migration surfaced a real bug worth recording: the first version cast a raw SQL
query's result rows to a camelCase type (`row.parentId`) that didn't match the query's own
snake_case column aliases (`parent_id`). Every lookup silently missed and all 128 books got the
`book-<id>` fallback slug. Caught before this branch was ever pushed anywhere — see the
migration file's own comment — fixed, and the already-applied (wrong) data was corrected
in place with the same, now-fixed algorithm before any application code went near it.

**A2 — catalogue order.** `src/lib/availability.ts#sortCatalogue`: purchasable-in-this-currency
books first (never hidden — the unpurchasable ones just don't lead), then `publishedAt` desc
within each group, then title. A book with no `publishedAt` sorts after every dated book in its
group rather than reading as either "very old" or "brand new." Applied at the catalogue route,
not inside `getCatalogueBooks` — sorting is a pure business rule, and `booksData.ts` is the
Payload-touching layer that should stay framework glue, per AGENTS.md.

**A3.**
- Quantity selector added to `AddToCartButton`, mirroring `CartLineControls`'s existing
  pattern. `addToCart` now takes a `quantity` argument (validated server-side: must be a
  positive integer) and adds that many in one write instead of one click per copy.
- Book page: the price row is only rendered when the book is purchasable — `PriceTag` already
  prints "not available" text when it isn't, so the unavailable box below was printing the same
  sentence twice. Now it prints once.
- Layout: `sm:items-center` on the book page's grid. The empty-viewport problem was columns of
  very different heights top-aligned — a short info column (no description) left a visible gap
  below it next to the taller cover. Centering the shorter column against the cover reads as a
  deliberate composition instead of stranded text with dead space under it. Verified in-browser
  on both a book with a description and one without (below).
- `מסילת ישרים`'s description **does** repeat its own opening clause verbatim at the end —
  confirmed directly against the database, not assumed from the brief. Wrote a script (not
  committed — one-off investigation, not project infrastructure) that decodes every book's
  richText description to plain text and checks whether its first 30 characters recur later in
  the same string: **2 of the 47 books that have a description are affected** — `מסילת ישרים`
  and `תיקונים חדשים`. Both show the identical shape: an opening clause, unrelated
  sentences in between, then the opening clause again with no closing punctuation, as if the
  original page repeated a teaser line around a longer block. This is **not** the same defect
  as REVIEW-01 #8 (`parse.mjs`'s `blocksOf`/`ownText`, which *drops* prose around inline spans —
  already fixed, verified by reading `scripts/scrape/parse.mjs`'s own current code). It's the
  opposite shape (duplication, not loss), and `extractProduct`'s description path
  (`$('#longMessageMEM').text()`) doesn't go through `blocksOf` at all — it's a single `.text()`
  call, which can only duplicate if the source HTML itself contains the sentence twice. No
  scrape cache exists in this environment to inspect the raw page, so I did not guess at a
  parser fix blind against a codebase with an already-recorded instance of that exact mistake
  (REVIEW-01: "the `span` exclusion... over-corrected a double-count into content loss").
  Flagging the count and the shape here rather than shipping an unverified change; belongs
  next to TASK-08's data worklist.

**B — front page.** `/`, `/en`, `/fr` now render a real front page; the catalogue moved to
`/ספרים`, `/en/books`, `/fr/livres`, using the existing `[bookWord]` mechanism (a sibling
`[locale]/[bookWord]/page.tsx` next to the existing `.../[slug]/page.tsx`, matched against a new
`CATALOGUE_SEGMENT` map in `routes.ts`, the plural of `BOOK_SEGMENT`). **No redirect from any
locale root** — see the mid-task clarification: a redirect from `/`, `/en`, or `/fr` would make
the front page itself unreachable at those paths, and there is no other, older URL for the
TASK-06 catalogue to redirect *from*. The front page links to the catalogue prominently instead
(a button in section 1, plus a "view all books" link on the new-books section, plus a permanent
"ספרים"/"Books"/"Livres" entry in the header nav).

Five sections, all reading from existing collections/globals, nothing new added to the content
model:
1. Logo + one line of institute copy + a "browse the catalogue" button. No Payload field holds
   this line — the two existing bio pages (`/ramhal`, `/rabbi-chriqui`) are hand-written for the
   same reason (TASK-06 report: "two short, rarely-changing pages don't earn a CMS content
   model yet"), so the tagline is a fourth entry in that same hand-written `dictionary.ts`, not
   a new collection.
2. Announcements — `getActiveAnnouncements` filters on `isAnnouncementActive` (pure function,
   tested): live iff `now >= startsAt` and, when set, `now <= endsAt`. Section renders nothing
   when the list is empty (there are currently 0 rows in this database — verified against the
   real DB, not assumed).
3. New books — `selectNewBooks` (pure, tested): purchasable-in-this-currency **and** has a real
   `publishedAt`, most recent first, capped to 6. Currently renders nothing too: **0 of 128
   books have `publishedAt` set** (REVIEW-01 #12 — fabricated dates were deliberately never
   backfilled). This is correct behavior given the data, not a bug, but it means the section is
   untested in the browser with real content — see "what is still open."
4. The standing schedule — `getSchedule` reads the `schedule` global directly (already seeded,
   previously rendered nowhere). Two columns (שיעורים / תפילות), each hidden independently if
   empty; the whole section hidden if both are.
5. Upcoming events — `getUpcomingEvents` filters on `isEventUpcoming` (pure, tested): `startsAt
   > now`. Same disappear-if-empty rule; currently 0 rows.

## What was verified and how

- `npx tsc --noEmit`, `npx eslint .` — clean (only pre-existing unused-arg warnings in generated
  migration files, same pattern as the three migrations already on `main`).
- `npx vitest run` — **85 tests, 15 files, all passing** (main's actual current count is 67, not
  the 79 TASK-06's report claimed — verified directly with `git stash`; the new work adds 18:
  9 for `sortCatalogue`/`selectNewBooks`, 5 for `isAnnouncementActive`, 3 for `isEventUpcoming`,
  1 for `cataloguePath`, plus the DB-backed uniqueness test below).
- **A real integration test, not a fixture**: `src/lib/booksData.integration.test.ts` calls
  `getCatalogueBooks` against the actual dev database in all three locales and asserts no
  `urlSlug` value repeats — this is DoD #1's "proves it over the real catalogue." Wiring it up
  needed three small, narrowly-scoped additions to the test setup: a `@payload-config` alias
  (vitest doesn't know the project's `tsconfig` path alias), a `server-only` alias pointing at a
  one-line local shim (Next resolves that bare specifier through its own bundler; vitest
  doesn't), and `PAYLOAD_MIGRATING=true` in `vitest.config.ts`'s `test.env` (skips a multi-second
  dev-mode schema pull on every run — the schema already matches the committed migration).
  `vitest.setup.ts` loads `.env` via `@next/env`, which ships with `next` (already a direct
  dependency) rather than reaching for the undeclared transitive `dotenv`.
- **`next build`** — clean, 407 static pages (128 books × 3 locales, 3 catalogue pages, 3 front
  pages, 6 info pages), cart still `ƒ` (dynamic). Both previously-colliding books
  (`דברות-רמחל-חה-משיח` / `-2`, `מבא-לחכמת-הקבלה-4-dvd` / `-2`) generated as separate pages —
  confirms A1 end to end, not just in the unit test.
- **Manual, in-browser verification**, dev server against the real (now-migrated) database:
  - `/`, `/en` [not shown below, but same code path as `/fr`], `/fr` at desktop (1440px): logo +
    tagline + CTA render; announcements/new-books/events sections correctly absent (all three
    are genuinely empty in this database); schedule renders both columns with real seeded data.
  - Catalogue (`/ספרים`, `/fr/livres`) at desktop: 128 books, purchasable-in-ILS book
    (`tikoun olam`, ₪50) leads the Hebrew grid; the French grid leads with its own EUR-priced
    books. No unpurchasable card in the first several rows in either locale.
  - Book **with** a description (`מסילת ישרים`) at desktop, he and fr: balanced two-column
    layout, quantity selector present, `הוסף לעגלה`/`Ajouter au panier` works. Also visually
    confirmed the duplicate-lead-sentence description bug reported above — it's directly
    legible in the rendered paragraph.
  - Book **without** a description, purchasable (`אדיר במרום`, ₪90) at desktop: no empty gap
    below the short info column; quantity set to 3 via the selector, added in one click, cart
    updated to quantity 3 for that line, single write (confirmed by watching the pending
    "מוסיף…" state resolve, then the cart total: 10 + 1 + 3 = 14 units, correctly over the
    seeded `freeAboveUnits: 10`, shipping showed ₪0.00/free).
  - Book with **no price in the viewer's currency** (`גילוי מלכותו ר״ה`): "לא זמין לרכישה
    באזור זה" now appears exactly once (the box), not twice.
  - Cart (`/cart`, `/fr/cart`) at desktop: three lines, correct per-line links (now via
    `urlSlug`), correct subtotal/shipping/free-shipping nudge math.
  - All of the above repeated at 414px width (a fresh tab — the existing tab's window would not
    resize below its current size in this environment): header nav wraps to two rows, catalogue
    drops to 2 columns, book page stacks cover-then-content, cart stacks line-then-controls,
    front page schedule columns stack. No horizontal scroll observed at any of these.
  - `grep`ed every changed/added file for physical-direction utilities (`ml-`/`mr-`/`pl-`/`pr-`/
    `left-`/`right-`/`text-left`/`text-right`/`border-l-`/`border-r-`/`rounded-l-`/`rounded-r-`)
    — none found.

## What felt wrong

- **The cart page still shows a book's raw per-locale `title`**, not the cross-locale-resolved
  `displayTitle` `booksData.ts` already computes for the catalogue and book page. A book with no
  title row in the viewer's locale would show blank there. Pre-existing (not introduced by this
  task — TASK-06 never wired the cart's `getCartLines` through the same fallback), and touching
  it meant either duplicating `bestAcrossLocales` against `serverCart.ts`'s different data shape
  or expanding this task's scope into the cart's own data layer. Left as-is; the `urlSlug` fix
  for the *link* on that same line was in scope (a book's canonical URL never varies by locale,
  so it needed no fallback query at all), the raw title text was not.
- **New books and events sections are unverified with real content in the browser** — the
  database genuinely has none right now (0 events, 0 announcements, 0 dated books). The
  disappear-when-empty behavior is verified (and its logic is unit-tested); the populated
  rendering is not eyeballed. Whoever seeds a real announcement or a `publishedAt` date should
  give the homepage one more look.
- **The two ambiguous-match `urlSlug` collisions the disambiguation script resolved with a
  numeric suffix are a stopgap, not a fix.** They're still two separate, near-identical cards in
  the catalogue (unchanged from TASK-06 — that's the known, deliberately out-of-scope
  duplicate-merge problem), now additionally carrying a `-2` in one member's URL. TASK-08
  merging them will need to also decide what happens to that URL (redirect it, or accept it
  disappears — there's no traffic to it yet).
- **A3's description-duplication finding (2 of 47 books) has no code fix in this task** — see
  above. It needs either the original scrape cache (not present in this environment) or a
  decision to accept a manual one-off correction to just these two records, which is exactly the
  kind of hand-edit the seed/import discipline in this codebase is built to avoid doing quietly.

## What is still open

- Checkout and payment (TASK-09, unchanged from TASK-06).
- Duplicate-book merging and the French/English title gap (TASK-08, unchanged).
- The description-duplication finding above (2 books, root cause needs the scrape cache).
- Cart line title fallback (see above).
- On-demand revalidation on publish, the locale switcher's book-equivalence limitation, and the
  two hand-written info pages — all carried over unchanged from TASK-06's report.
