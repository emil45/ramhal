# TASK-38 — A book's language is `bookLanguage`, never a category

> Filed as TASK-36 in the brief; renumbered — TASK-36 (שו״ת page) and TASK-37 (press coverage)
> were already shipped by the time this task started.

## What was built

- `src/lib/cover.ts`: `coverRuleColour` now takes a book's language and category together instead
  of a category slug alone. `siddurim-machzorim` still gives `--gold-ink`; otherwise `he`/`fr`/`en`
  give `--teal`/`--gold`/`--teal-deep`, matching the old category-keyed rule exactly. One exported
  `CoverIdentity` type, typed from `Book['bookLanguage']`, replaces the `categorySlug` prop that
  `CoverFrame`, `TypographicCover` and `CoverImage` each declared separately; all four call sites
  (`ProductCard`, the book page, the courses page, the cart page) updated.
- `src/importBooks.ts`: `CATEGORY_SLUG`/`CATEGORY_TO_LANGUAGE`/`LANGUAGE_TO_CATEGORY` replaced by
  one map (`SHELF_LANGUAGE`) from a legacy shelf breadcrumb straight to `bookLanguage`. A book's
  category now comes only from `REVIEWED_CATEGORY_SLUG` (the human-reviewed siddurim list); every
  other book is left uncategorised. Discontinued-shelf detection (`CD/DVD`) still works, checked
  directly against the raw breadcrumb rather than through a category slug.
- `src/collections/Books.ts` / `Categories.ts`: rewrote the `category` field's comment (it no
  longer justifies the field by language shelves), added Hebrew `admin.description` text on both,
  and swapped `category` for `bookLanguage` in the Books list's `defaultColumns`.
- `src/components/storefront/CatalogueClient.tsx`: the category filter now renders only when the
  catalogue's books use at least two distinct categories, built the same way `languagesPresent`
  already is. `lib/booksData.ts`'s `getCategories` had no caller left and was removed. The filter
  row's grid drops the category track and lets the search field span both columns at `sm` width
  when the control is absent, so no column sits empty.
- `src/seed.ts`: removed the three language entries from `CATEGORIES`; only `siddurim-machzorim`
  is seeded now.
- `scripts/one-off/TASK-38-remove-language-categories.mjs`: guarded, transactional removal of the
  three language categories, matching TASK-34's audit-then-abort structure. Runs against whichever
  database `DATABASE_URI` points at and refuses any host other than the audited development and
  production ones — it ran once against each, per-database expected counts hardcoded from a
  read-only audit performed first.
- `docs/DECISIONS.md` §24 and `docs/DESIGN.md` (cover anatomy item 2, "Catalogue browsing").

## What was verified and how

- `tsc --noEmit`, ESLint, all 330 Vitest tests and `next build` passed before every commit.
- `grep -rn "hebrew-books\|french-books\|english-books" src scripts --exclude-dir=out` matches
  only: the TASK-38 script itself; comments explaining the removal; `importBooks.test.ts`'s test
  name; `bookSearch.test.ts`'s fixtures (arbitrary example slugs for a filter that's generic over
  slug strings, unrelated to real categories); the older TASK-23 one-off; and
  `scripts/scrape/reconcile.mjs`'s own shelf-label canonicalisation, which is a separate concern
  (it feeds `reconciliation.json`'s raw `categories` field, which `SHELF_LANGUAGE` reads directly)
  out of this task's scope.
- Read-only audit against both Neon branches (development `br-gentle-term-b11mvbu3`, production
  `br-delicate-math-b1b1mbw7`) before writing the script: zero books whose category contradicted
  `bookLanguage`, zero books with `bookLanguage = 'unknown'`, and the expected foreign keys
  (`books.category_id` → `SET NULL`, `categories_locales`/`payload_locked_documents_rels` →
  `CASCADE`) on both. No contradiction meant nothing to stop and report.
- Ran the script against development first (`clearedCategoryOnBooks: 87`, 96 books unchanged,
  1 category remaining, 9 siddurim books unchanged), then against production
  (`clearedCategoryOnBooks: 56`, 62 books unchanged, 1 category remaining, 6 siddurim books
  unchanged). Both transactions committed cleanly; the script's own pre-write recheck is the
  primary guard, and both used it rather than a rerun.
- Browser verification against the development server: Hebrew, French and English catalogues at
  desktop and two narrower widths (700px, 400px) show no category filter, a 3-track (desktop) or
  correctly-collapsing grid with no empty cell, and the same five covers' colours unchanged from
  before the data migration (French gold, English deep teal, Hebrew teal). A siddur's book page
  still shows "קטגוריה: סידורים ומחזורים" in its `<dl>` after the migration.
- Admin verified against production directly (Emanuel signed in there so this session could
  screenshot it, since the admin panel requires Google sign-in this session doesn't have):
  the categories list showed the new Hebrew description and, after the script ran, exactly one
  row (`סידורים ומחזורים`); the Books list's default columns showed `שפת החיבור` in place of
  `קטגוריה`, both before and after the data migration (the column change is a code change, not a
  data one).
- The code for this task was deployed to production ahead of the schedule this report's commit
  order implies: a concurrent session sharing this working tree pushed `main` (which already
  contained this task's commits through the seed change) while this task was still in progress,
  and Vercel auto-deployed it — confirmed by the new Hebrew `admin.description` text already
  rendering live before this session had pushed anything itself. This happened to satisfy the
  task's own "deploy code before running the data migration" ordering by coincidence rather than
  by this session's own push, which is noted under "what felt wrong" below.
- `GET /api/diagnostics` on the live site reports `database.fingerprint: "2c951382a7f8"`, matching
  `docs/RECOVERY.md`, and `appEnv: "demo"` with the demo banner rendering, both as expected for
  this deployment.
- Not yet reverified live after the data migration: the public `/ספרים`, `/en/books` and
  `/fr/livres` pages are statically generated with `revalidate = 3600`, and a check immediately
  after the production script ran still showed the pre-migration cached HTML (stale category
  filter and category-labelled metadata, though the book count — unaffected by this task — was
  already current from TASK-34). This will resolve itself within the hour, or immediately on the
  next deploy; a final push of this task's docs commit should trigger one. A repeat live check
  after that deploy is worth doing before considering this task's live verification complete.

## What felt wrong

- This session shares its working tree and local `main` branch with a concurrent session
  (evidenced by unrelated uncommitted files appearing mid-task — `docs/reports/TASK-36.md`,
  the questions-and-answers page, a new `QuestionEmailActions.tsx` — and by `origin/main` already
  containing this task's own commits, interleaved with that session's, before this session had run
  `git push` itself). Nothing was corrupted and no work was lost, but the workflow protocol's
  "work happens directly on main, no task branches" assumes one actor at a time; two concurrent
  sessions on the same clone works by luck here (non-overlapping files) rather than by design.
- The brief numbered itself TASK-36, which was already taken (and TASK-37 with it) by that same
  concurrent session's shipped work — caught before writing anything by checking
  `docs/tasks/`/`docs/reports/`, and confirmed with Emanuel before proceeding as TASK-38.
- An untracked `.q.mjs` scratch script (an ad-hoc audit query left from earlier session context)
  sat in the working tree at the start, which technically failed the "git status is clean"
  precondition. Confirmed with Emanuel and removed before starting rather than silently ignored or
  silently committed.

## What is still open

- Re-verify the live `/ספרים`, `/en/books`, `/fr/livres` pages after their ISR cache has actually
  expired or the next deploy has replaced it (see above) — ordinary follow-through, not a new
  finding.
- Adding new genre categories (קבלה, מוסר, …) is explicitly out of scope, left for the client. The
  model already supports it and the storefront filter will appear on its own once a second
  category is in use — no code change needed.
- Bilingual books (`he-fr`, `aramaic-fr`): the language filter is an exact match, so such a book
  appears under neither the Hebrew nor the French language filter. No such book exists in the
  catalogue today; noted, not changed, per the brief.
- Redirects for legacy category-page URLs were not added; none exist on the live site.
