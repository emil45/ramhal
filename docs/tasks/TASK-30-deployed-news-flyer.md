# TASK-30 — Repair the deployed news flyer

## Why

TASK-29 created the real flyer Media record while Payload used local development storage. The
database is shared with the demo deployment, but ignored `media/` files are not deployed. The live
homepage therefore renders the correct announcement and alternative text around a broken image.

## Scope

- Make `seed:demo-news` replace the flyer bytes when reusing its Media record so a database row can
  never falsely count as a complete upload.
- Add a committed one-off script that replaces the existing demo Media file through Payload with
  S3-compatible storage enabled. It must refuse outside `APP_ENV=demo`, preserve the Media ID and
  existing announcement relationship, and report only non-secret identifiers and dimensions.
- Run the one-off exactly once against the Vercel demo environment.
- Do not modify the announcement dates, copy, or relationship during the repair.

## Verification

- Before repair, establish the failure through the live URL.
- Run typecheck, lint, tests, and the production build before committing the executable repair.
- Execute the committed repair once with the Vercel production environment (whose `APP_ENV` is
  `demo`).
- Verify that the public object URL and its Next image-optimizer URL return an image, then visually
  check the live homepage at desktop and 390px width.
- Finish with `docs/reports/TASK-30.md`.
