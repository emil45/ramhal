# TASK-22 — Book catalogue data repair

## What was built

- `src/importBooks.ts`: `localizeTitles`, a pure function that assigns a scraped title to a
  Payload locale by detecting Hebrew script rather than trusting which legacy site it was scraped
  from — the root cause of 21 production books having no Hebrew title.
- Directly on production data (via the Neon MCP tools, each step confirmed with Emanuel first):
  21 books had their real Hebrew title moved into the `he` locale and the misfiled `en`/`fr`
  copies removed; 4 pairs of duplicate book records were merged (carrying over any price the
  surviving record was missing, and every legacy redirect URL) and the duplicate deleted.

## What was verified and how

- Read the actual production rows (Neon MCP `run_sql`) before and after every change, not just
  row counts — confirmed 21 books
  went from a genuinely missing `he` locale row to a correct one, confirmed the 4 duplicate pairs
  shared a slug/title before merging, and confirmed zero `orders_lines`/`carts_items` rows
  referenced any id being deleted before deleting it.
- `tsc --noEmit`, ESLint, all 219 Vitest tests (the real-database `urlSlug` uniqueness test
  included), and `next build` all pass.
- Final production state re-queried after all changes: 96 books, every one with at least one
  price and at least one locale row, zero remaining `ambiguous-match` review flags.

## What felt wrong

- The reconciliation step (`scripts/scrape/reconcile.mjs`, run before this task) had already
  detected and flagged 3 of the 4 duplicate pairs by name in `reviewNote`
  ("possible duplicate of ... not auto-merged") — the information needed to fix this was sitting
  in the database the whole time, just never acted on.
- `title` is `required: true` in `Books.ts`'s field config, but the database allows a book to have
  no row at all for a given locale — "required" there means "required when you edit this locale,"
  not "every locale has one." That's the correct design (matches the project's explicit "absent,
  not backfilled" rule) but it means Payload's own admin list, which reads the raw current-locale
  title with no fallback, can legitimately show a blank title for a book that isn't broken. The
  public storefront was never actually affected, because `getCatalogueBooks` has its own
  locale-fallback chain the admin list doesn't use.

## What is still open

- 69 missing-description, 34 absent-from-hebrew, 11 language-uncertain, 5 zero-price,
  4 price-mismatch, and 93 books with no cover — all genuine, already-flagged content gaps for
  whoever edits the catalogue day to day, not data corruption. None were touched.
- Full task detail and reasoning: `docs/tasks/TASK-22-book-catalogue-repair.md`.
