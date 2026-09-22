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

  **Correction, added in TASK-24:** half of the claim above is wrong, and it names the deploy
  path, so it needed fixing rather than leaving as a record of a mistaken belief. `scripts/migrate.mjs`
  is **not** affected — it never loads `payload.config.ts` at all. Its own header comment says so:
  "This script sidesteps that by not loading the project's config at all. Migrations are
  self-contained SQL, so all it needs is a database adapter and Payload's own migrations table — a
  config with no collections." `scripts/import-books.mjs` **is** affected, for the reason given
  above (its line 10 does `import config from '../src/payload.config.ts'`) — reproduced directly,
  independent of this script, with:
  ```
  node --input-type=module -e "import('payload-oauth2')"
  ```
  which throws `ERR_MODULE_NOT_FOUND` on `payload-oauth2/dist/default-get-token`. TASK-24 fixed
  `import-books.mjs` (and `import-prepared-covers.mjs`, which has the same problem) by running them
  through `vite-node` instead of plain `node` — see that task's report.
- Deciding French vs. English for 9 of the 11 uncategorized titles was easy (explicit French
  articles/prepositions in the title itself); the other 2 ("MAAMAR HA-HOKHMA", "Maamar
  Ha-Gueoula") are bare transliterations with no French/English marker at all, and were placed as
  French only on the weaker evidence of having no competing English-site entry anywhere in the
  reconciliation data. Worth a second look if either surfaces as wrong later.

## What is still open

- The `scripts/import-books.mjs` Node-ESM-vs-`payload-oauth2` issue noted above (`scripts/migrate.mjs`
  was never actually affected — see the TASK-24 correction above) — not fixed here, since it wasn't
  this task's scope and no import or migration needed to run. Fixed in TASK-24.
- Full task detail and reasoning: `docs/tasks/TASK-23-book-category-mapping.md`.
