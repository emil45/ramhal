# TASK-45 — Stop spending Neon's transfer allowance: local Postgres, media and backups on R2

## What was built

- **Local PostgreSQL 18** (Homebrew) with databases `ramhal` and `ramhal_test`. `npm run db:restore-local`
  (`scripts/db-restore-local.mjs`, rules in `src/lib/localRestore.ts`, tested).
- **Guards:** `vitest.setup.ts` refuses a `*.neon.tech` `TEST_DATABASE_URI` always; the Payload config
  refuses a `*.neon.tech` `DATABASE_URI` under `APP_ENV=development` unless
  `ALLOW_PRODUCTION_ONE_OFF=TASK-NN` is set for that command (`src/lib/refuseProductionDatabase.ts`).
- **Media:** `S3_PUBLIC_URL` alone is a read-only mode (URLs built, uploads and deletes refused with an
  explanation); Media/global upload limit 10 MB (`MEDIA_UPLOAD_LIMIT_BYTES`, Payload's one global
  limit, and Media is the only upload collection).
- **Workflows:** `backup.yml` writes with `BACKUP_WRITER_S3_*` to R2; `restore-drill.yml` restores into a
  `postgres:18` service container with `ON_ERROR_STOP` and pipefail, reading with `BACKUP_S3_*`.
  `RAMHAL_BACKUP_S3_*` and `RESTORE_DRILL_TARGET_URI` are gone from the workflows.
- **Docs:** DECISIONS §5, §6, §11, new §17; README (Environments, Running it, Storage, env list);
  AGENTS; RECOVERY (backups on R2, local restore, one-off override, drill, tokens and rotation);
  `.env.example`; `vitest.config.ts` comment; BACKLOG. TASK-44 numbers are in `docs/reports/TASK-44.md`.
- **Committed records:** `scripts/one-off/TASK-45-provision-r2.mjs`,
  `scripts/one-off/TASK-45-copy-media-to-r2.ts`, `infrastructure/r2/media-bucket-cors.json`.

## R2 resources and tokens (names and scopes only)

Created (none existed): buckets `ramhal-media` (Standard, `r2.dev` public access on) and
`ramhal-backups` (Standard, private). Tokens: `ramhal-media-rw` (Object Read & Write, `ramhal-media`),
`ramhal-backup-rw` (Object Read & Write, `ramhal-backups`), `ramhal-backup-ro` (Object Read,
`ramhal-backups`). Access key id = token id; secret = SHA-256 of the token value. The admin Cloudflare
token was used only by the provisioning script, from local `.env`.

CORS on `ramhal-media`: origin `https://ramhal-theta.vercel.app`, method `PUT`, header `Content-Type`
(read from `@payloadcms/storage-s3`'s client upload: it sends `Content-Length`, which the browser sets
itself and does not preflight, and `Content-Type`; the presigned URL carries everything else in the query
string). Confirmed with a live preflight. Max age 3600.

## Production-host finding: BLOCKED

Live `GET /api/diagnostics` returned HTTP 500 (Neon quota). No fingerprint, so nothing changed:
`refuseProductionDatabase.ts` still names `ep-red-tree-b19ry3lo…`, RECOVERY still records
`2c951382a7f8`, the old local `.env` host fingerprinted to `d82df7fce6e7`. In BACKLOG.

## Sanitised tables and real-data finding

Truncated after every restore, derived from the schema's foreign keys: `carts`, `carts_items`,
`mock_payment_sessions`, `orders`, `orders_lines`, `payment_events`, `payload_locked_documents_rels`,
`users_sessions`. Two admin users kept. Production's dump held 15 orders: all provider `mock`, all with
example/test emails, so **production held no real customer data**. Ran twice; tables empty both times
and the temporary dump directory was gone.

## Neon-only objects handled

Owner role `neondb_owner` (created `NOLOGIN` locally and in the drill container). No extensions in the
current dump; the script removes `neon`, `neon_utils`, `neon_test_utils`, `pg_session_jwt` if ever present.
The dump's `\restrict` lines need a current `psql` (18).

## Zero-Neon proof

A preload (kept outside the repo) makes `dns.lookup`, `net.Socket.connect` and `tls.connect` throw for any
`*.neon.tech` host; self-tested. With `NODE_OPTIONS="--require <preload>"`: `tsc` clean, `eslint` 0 errors
(46 pre-existing warnings), `npm test` 363/363 (integration included), `npm run build` exit 0.

## Copy verification

Media: 25 of 25 objects, keys, sizes, Content-Types and SHA-256 (source hashed during the copy,
destination re-read from R2) match; re-run skipped all 25. Backup: newest dump
`ramhal-2026-09-23T07-38-37Z.sql.gz` copied and verified the same way. The R2 object's last-modified is
the copy time, so `/api/diagnostics` `backup.ageHours` reads about 0 until the next nightly run.

## Vercel and GitHub changes, with rollback

GitHub secrets **added**: `BACKUP_WRITER_S3_{ENDPOINT,BUCKET,REGION,ACCESS_KEY_ID,SECRET_ACCESS_KEY}` and
`BACKUP_S3_{ENDPOINT,BUCKET,REGION,ACCESS_KEY_ID,SECRET_ACCESS_KEY}`. **Not yet deleted:**
`RAMHAL_BACKUP_S3_*` (five). Vercel Production, `vercel env update`: `S3_BUCKET`, `S3_ENDPOINT`,
`S3_PUBLIC_URL`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` (all six existed; now
`ramhal-media`, R2 endpoint, `r2.dev` URL, `auto`, media-rw key) and `BACKUP_S3_*` (five, now backup-ro).
No deploy was triggered.

Rollback: previous values were Sensitive and unreadable. Recreate a Neon Object Storage credential in the
Neon console (or use the old backup key still valid there) and run, per name,
`vercel env update S3_BUCKET production` (and the other five, `BACKUP_S3_*` likewise), values on stdin;
revert the code with `git revert` of this task's commits. Neon's objects were not deleted, so the old
bucket still holds every file.

## PENDING (needs the user's push)

- Backup and restore drill green via `gh workflow run backup.yml` then `restore-drill.yml`: they run the
  pushed workflow files, so they could not run before the push.
- Delete the five `RAMHAL_BACKUP_S3_*` secrets after the first green backup (`gh secret delete NAME`).
  Left in place so tonight's 02:00 UTC backup on the old workflow does not fail before the push.

## What felt wrong

- `payload-types.ts` regenerates differently when a bucket is configured (`Media.prefix` disappears);
  the committed file matches the no-bucket state. Runs restore it with `git checkout`; not committed.
- The integration test `diagnostics/route.integration.test.ts` asserts a non-empty database password, so
  local URIs carry a dummy one.
- Media source credentials could not be pulled from Vercel (Sensitive); the old Neon backup key, which
  also reads `ramhal-media`, was the copy source.
- The exact-host constant in `refuseProductionDatabase.ts` is redundant beside the `*.neon.tech` guard.

## Still open (in BACKLOG)

- BLOCKER before launch: R2 custom domain (`r2.dev` is non-production).
- Audio archive will not fit R2's 10 GB free tier.
- Production-host fingerprint discrepancy (BLOCKED).

## User's remaining steps

1. `git push` (deploys). Then check: the live catalogue and a book page serve covers from `r2.dev`
   (HTTP 200, including through `/_next/image`); `/api/diagnostics` `backup` reads from R2; do one
   authenticated admin upload (proves CORS and the 10 MB limit).
2. Run `backup.yml` then `restore-drill.yml` from the Actions tab; when green, delete the
   `RAMHAL_BACKUP_S3_*` secrets.
3. Revoke the admin Cloudflare token; delete the Neon `testing` branch; empty the Neon media and backup
   buckets after a week on R2; set the $1 Cloudflare budget alert and a low-limit card.
4. Put `/opt/homebrew/opt/postgresql@18/bin` on `PATH`.
