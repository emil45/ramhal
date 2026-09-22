# TASK-23 — Map all books to their correct category

## What was built

- `src/importBooks.ts`: `REVIEWED_LANGUAGE` and `REVIEWED_CATEGORY_SLUG`, two importKey-keyed
  override maps recording 20 human-reviewed category/language decisions, checked in
  `buildBookInput` before the general derivation rules (which correctly refuse to guess French vs.
  English, or invent a Siddurim/Machzorim shelf the legacy sites never had). `buildBookInput` and
  `ImportView` exported for the new colocated unit tests.
- Directly on production data (via a temporary Vitest integration test hitting the real Neon
  database through Payload's Local API, run once and deleted): 9 books moved from hebrew-books to
  siddurim-machzorim; 11 uncategorized French books given `category: french-books`,
  `bookLanguage: 'fr'`, and the now-resolved `language-uncertain` review reason dropped.

## What was verified and how

- Queried production directly (Neon MCP `run_sql`) before and after: went from 11 books with no
  category and 0 in siddurim-machzorim to 0 uncategorized and 9 in siddurim-machzorim; totals
  (96 books, 2/24/61/9 across the four categories) reconcile exactly.
- `tsc --noEmit`, ESLint, and all 222 Vitest tests pass, including the real-database integration
  suite (`booksData.integration.test.ts`, `placeOrder.integration.test.ts`,
  `orderPayment.integration.test.ts`), run after the backfill.

## What felt wrong

- A plain `node` script (the pattern `scripts/import-books.mjs` uses) cannot boot
  `payload.config.ts` since TASK-20 added `payload-oauth2`: its compiled output re-exports sibling
  modules without a `.js` extension, which Node's native ESM resolver refuses (documented in
  `docs/DECISIONS.md` §15, previously only known to affect Vitest). This means `scripts/import-books.mjs`
  and `scripts/migrate.mjs` are likely broken the same way right now, independent of this task —
  worth a follow-up to either patch the dependency's exports or give those scripts the same
  Vite-inlining workaround `vitest.config.ts` already uses.
- Deciding French vs. English for 9 of the 11 uncategorized titles was easy (explicit French
  articles/prepositions in the title itself); the other 2 ("MAAMAR HA-HOKHMA", "Maamar
  Ha-Gueoula") are bare transliterations with no French/English marker at all, and were placed as
  French only on the weaker evidence of having no competing English-site entry anywhere in the
  reconciliation data. Worth a second look if either surfaces as wrong later.

## What is still open

- The `scripts/import-books.mjs` / `scripts/migrate.mjs` Node-ESM-vs-`payload-oauth2` issue noted
  above — not fixed here, since it wasn't this task's scope and no import or migration needed to
  run.
- Full task detail and reasoning: `docs/tasks/TASK-23-book-category-mapping.md`.
