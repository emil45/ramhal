# TASK-22 — Book catalogue data repair

Not from a written brief — raised directly by Emanuel in chat ("a lot of bad data in the DB, like
in books"), after TASK-20. Documented here retroactively, same as every other task, because
production data was changed and the reasoning needs to survive the conversation that produced it.

## What was asked

1. Audit the `books` collection for bad data.
2. Fix whatever needed fixing; delete whatever wasn't needed.
3. Fix the root cause, not just the symptom, and check the rest of the database for the same
   class of problem.

## What was found

- 100 production books; 79 already flagged `needsReview` by the existing migration-era review
  system (`docs/DECISIONS.md` migration risk area) — expected editorial debt, not corruption.
- 23 Hebrew-language books had no Hebrew title at all: the real (Hebrew-script) title was sitting
  in the `en` or `fr` locale instead, because those books were matched to a French/English
  legacy-site listing but never matched to a Hebrew-site one, and the importer keyed a title by
  which site it was scraped from rather than the language of the text.
- Of those 23, 4 were exact duplicates of 4 *other* existing books — the reconciliation step had
  already flagged these as "possible duplicate, not auto-merged" (`reviewNote`) and left the
  decision to a human, which nobody had acted on yet.
- No book anywhere had zero title in every locale — the public storefront's title fallback chain
  (`bestAcrossLocales` in `src/lib/booksData.ts`) meant this was invisible on the live site; it
  only showed as a blank title in the admin's book list, which doesn't use that fallback.
- Articles, pages, series and media collections: no matching issues found.

## What was fixed

- 21 books: real Hebrew title copied into the `he` locale; the misfiled duplicate `en`/`fr` rows
  removed (they weren't translations, just the same Hebrew text in the wrong place).
- 4 duplicate pairs (28→47, 122→121, 124→123, 128→127) merged and the duplicate deleted: any real
  price the duplicate held in a currency the surviving record lacked was carried over first, and
  legacy redirect URLs were unioned so no old URL loses its target. Checked `orders_lines` and
  `carts_items` for references to the deleted ids first — none existed.
- `src/importBooks.ts`: `localizeTitles` now assigns each scraped title to a Payload locale by
  detecting Hebrew script, not by trusting the site it was scraped from — the actual root cause.
  Colocated unit tests. This does not touch the 96 existing books (a re-run only unions in new
  legacy URLs on an existing `importKey`, per `upsertBook`'s own contract) — it only prevents the
  same bug recurring for books added to a future reconciliation run.

## What was deliberately not touched

- 69 books still missing a description, 34 with no Hebrew edition, 11 with an uncertain language,
  5 showing €0 (the French legacy site genuinely had no price on record — inventing one would be
  worse than leaving it flagged), 4 with a price-mismatch between currencies, 93 with no cover.
  All of these are real content gaps the existing `reviewReasons` system already surfaces
  correctly; none of them are data corruption, and none had an unambiguous correct value to fill
  in without guessing.

## How it was verified

- Every deletion was checked against `orders_lines` and `carts_items` for a reference first.
- `tsc --noEmit`, ESLint, all 219 Vitest tests (including the real-database `urlSlug` uniqueness
  integration test, which passed against the repaired 96-book catalogue), and `next build` all
  pass.
- Final state confirmed directly against production with the Neon MCP tools: 96 books, all with
  at least one price and at least one locale row, zero remaining `ambiguous-match` flags.

## What is still open

- The remaining `reviewReasons` (missing-description, absent-from-hebrew, language-uncertain,
  zero-price, price-mismatch) are a genuine editorial worklist for whoever manages the catalogue
  day to day — not a data-repair task.
- 93 books with no cover image is a real, separate content gap, not addressed here.
