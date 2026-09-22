# TASK-23 — Map all books to their correct category

Not from a written brief — raised directly by Emanuel in chat ("map all books categories
approparly to books, we have 4 categories"). Documented here retroactively, same as every other
task, because production data was changed and the reasoning needs to survive the conversation that
produced it.

## What was asked

Every book should carry the correct one of the catalogue's 4 categories (hebrew-books,
french-books, english-books, siddurim-machzorim).

## What was found

- 11 of 96 books had no category at all: Latin-script French titles with an empty legacy
  breadcrumb, left blank by `deriveBookLanguage`'s deliberate refusal to guess French vs. English
  from script alone (`docs/reviews/REVIEW-01-findings.md` #7, already the subject of TASK-22's "11
  with an uncertain language" — deliberately not touched there).
- 9 books were miscategorized: Siddurim and Machzorim, filed under hebrew-books. Not an import
  bug — the legacy sites never had a Siddurim/Machzorim shelf of their own; every one of these was
  genuinely breadcrumbed `ספרים בעברית` on the source site. `siddurim-machzorim` is a distinction
  this catalogue draws that the legacy data never did, so it could only be assigned by a human
  reading the title.
- The remaining 76 books' categories (2 english-books, 13 french-books, 61 hebrew-books) were
  spot-checked against their titles and are correct.

## What was fixed

- Read all 11 uncategorized titles: every one is either unambiguous French text ("La voix des
  justes", "Les Soixante Dix Arrangements"...) or a bare transliteration sourced only from
  frramhal.com with no competing English-site entry anywhere in the reconciliation data
  ("MAAMAR HA-HOKHMA", "Maamar Ha-Gueoula"). Assigned `bookLanguage: 'fr'`, `category:
  french-books`, and dropped the `language-uncertain` review reason (the other reasons on these
  rows, mainly `absent-from-hebrew`, are still true and still flagged).
- Reassigned the 9 siddurim/machzorim books from hebrew-books to `siddurim-machzorim`.
  `bookLanguage` was already correctly `he` and is untouched — category and language are
  independent facts.
- `src/importBooks.ts`: added `REVIEWED_LANGUAGE` and `REVIEWED_CATEGORY_SLUG`, two
  importKey-keyed override maps recording these 20 reviewed decisions, checked before the general
  derivation rules in `buildBookInput`. Colocated unit tests. Same reasoning as TASK-22's
  `localizeTitles` fix: this does not touch the 96 existing books on its own (`upsertBook` never
  re-touches category/bookLanguage/reviewReasons on an existing `importKey`) — it only means a
  from-scratch reimport (e.g. after a database reset) reproduces the same reviewed result instead
  of drifting back to a guess.
- Applied the same 20 updates directly to the existing rows via Payload's Local API (a temporary
  `*.integration.test.ts`, run once against the real database, then deleted — the same pattern
  `src/lib/*.integration.test.ts` already uses to reach the real Neon database under Vitest,
  needed here because a plain `node` script cannot boot `payload.config.ts` at all;
  `payload-oauth2`'s extensionless re-exports are refused by Node's own ESM resolver, see
  `docs/DECISIONS.md` §15/Google sign-in section — Vitest already works around this by inlining
  the package).

## How it was verified

- Before: `english-books` 2, `french-books` 13, `hebrew-books` 70, `siddurim-machzorim` 0, 11 books
  with no category (96 total).
- After, confirmed directly against production with the Neon MCP tools: `english-books` 2,
  `french-books` 24, `hebrew-books` 61, `siddurim-machzorim` 9 — 96 total, zero books without a
  category.
- `tsc --noEmit`, ESLint, and all 222 Vitest tests pass (including the real-database integration
  suite, run after the backfill).

## What is still open

- Nothing category-specific. The remaining `reviewReasons` on these and other books
  (missing-description, absent-from-hebrew, zero-price, price-mismatch) are the same genuine
  editorial worklist TASK-22 already described — not a category problem.
