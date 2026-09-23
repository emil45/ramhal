# TASK-34 — Make the Hebrew-domain legacy catalogue canonical

## What was built

- `src/importBooks.ts` now imports a book only when its reconciliation candidate includes a
  `ramhal.com` (`site: he`) listing. Matching French/English-host data can still enrich that book;
  cross-site-only listings cannot create extras.
- Removed the now-dead language and duplicate-key overrides for cross-site-only records, plus
  three siddur/machzor overrides whose records are no longer canonical.
- `scripts/one-off/TASK-34-remove-noncanonical-books.mjs`: the exact guarded transaction run once
  against production. It deleted the audited 34-record set and refuses any changed identity,
  count, reference, media ownership or database host.

## What was verified and how

- Crawled Emanuel's five live `www.ramhal.com` category pages with the legacy site's five-second
  crawl delay: 21 + 21 + 9 Hebrew, 9 French and 2 English listings = 62 unique product URLs.
- Compared those exact `%2D`-preserving URLs with production before deletion: all 62 matched
  exactly one book, with zero missing and zero double-matched. The other 34 books exactly equalled
  the existing `absent-from-hebrew` set.
- Checked all 34 before deletion: zero order lines, cart items, series links, book-series
  relationships, covers and gallery images. The guarded transaction committed 34 deletions and
  then confirmed 62 books, zero `absent-from-hebrew`, and zero books without a canonical URL.
- Confirmed specifically that extra `דרך ה׳` (id 113) was deleted while canonical
  `דרך ה' - עם פירוש דרך היחוד` remains; extra `מחול לצדיקים` (id 119) was deleted while canonical
  `מחול לצדיקים (בדברי תכלית הבריאה)` remains.
- Evaluated the complete checked-in reconciliation through the corrected pure import rule: 62
  importable candidates, 62 unique import keys, 66 skipped stale/media candidates.
- `tsc --noEmit`, ESLint (only the existing generated-migration warnings), all 322 Vitest tests,
  and `next build` pass. Because concurrent TASK-35 code had reached the working tree before its
  testing-branch migration, the complete test run used a temporary Neon branch cloned from the
  already-migrated development branch; it was deleted immediately after the passing run.
- Pushed commit `6597437` to `origin/main` and waited for its Vercel production deployment to reach
  Ready. The live Hebrew catalogue then rendered `1–20 מתוך 62 ספרים`; its deployed payload
  contained 62 canonical `www.ramhal.com` URL occurrences, all 62 unique. It contained neither
  exact extra title and still contained both legitimate longer-title counterparts. Live
  diagnostics reported the expected production database fingerprint `2c951382a7f8`.

## What felt wrong

- The previous migration intentionally kept unmatched `frramhal.com`/`enramhal.com` listings
  because nobody had yet declared which drifted catalogue was authoritative. The review flag was
  doing its job; what was missing was the business decision Emanuel supplied here.
- Production changed immediately, but the storefront catalogue's ISR payload kept the deleted
  records until the TASK-34 deployment rebuilt it. The live verification therefore had to wait
  for that deployment rather than treating the database transaction alone as completion.

## What is still open

None.
