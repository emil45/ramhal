# TASK-12 — Vercel demo deployment

## What was built

- Made committed migrations the only schema writer and added an idempotent standalone
  `db:migrate` runner used by Vercel before every production build.
- Replaced boot-time seeding and the HTTP catalogue importer with explicit local commands.
- Added S3-compatible Payload media storage with direct browser uploads, direct public URLs,
  a committed `media.prefix` migration, and a strict all-or-none environment configuration.
- Configured Vercel Hobby, Node 22, the Frankfurt function region, Neon Postgres, Neon Object
  Storage, production-only demo variables, and an explicit upload ignore list.
- Preserved the three reviewed canonical URL collision overrides while rebuilding the catalogue.
- Replaced the scaffold README and updated the architecture decision for the Hobby demo / Pro
  live transition.

## What was verified and how

- Fresh Neon database: all six committed migrations applied; a repeat run printed
  `Database already up to date.`
- Seed: ran twice; category and global `updated_at` values remained unchanged.
- Catalogue: 100 sellable books imported, 28 CD/DVD listings skipped, zero duplicate
  `urlSlug` values; a repeat import reported 100 unchanged and zero created.
- Storage: seven media records produced 19 visible source/derivative objects. A raw public
  image and its Next image-optimizer URL both returned JPEG 200 responses.
- Gate: `tsc --noEmit`, ESLint (zero errors; 18 existing generated-migration warnings),
  Vitest (26 files, 176 tests), and `next build` (325 static pages) all passed.
- Vercel: remote Node 22 production build ran the migration no-op and completed successfully.
  The final deployment is <https://ramhal-theta.vercel.app>.
- Smoke: `/`, `/en`, `/fr`, `/admin`, `/ספרים`, `/en/books`, and `/fr/livres` returned 200;
  the permanent demo banner and all 100 catalogue links rendered. A browser run added a book,
  calculated shipping, created mock order 1001, approved the fake payment, and reached the
  paid-order confirmation. No real payment details or money were involved.

## What felt wrong

- Payload's Postgres adapter retains a reconnect client after `destroy()`. The one-shot runners
  explicitly exit after cleanup, matching Payload's own CLI, so successful commands terminate.
- The first CLI deploy uploaded the ignored local `.env` into its private build context. Vercel
  variables still won and the file was never served, but `.vercelignore` was added and a clean
  replacement deployment completed without that warning.

## Still open

- Create the first Payload admin user; no admin credentials were invented for this task.
- Most legacy cover URLs no longer return usable files. The prepared cover assets need the
  planned catalogue matching pass; this import recovered seven media records.
- A branch-scoped Neon credential named `Catalogue import 2026-09-20` remains available for
  local re-imports. Revoke it in Neon when catalogue migration work is finished.
- Before real commerce: upgrade to Vercel Pro, configure the real payment and email adapters,
  move the full media archive to the chosen R2 plan, and set up the documented second backup.
