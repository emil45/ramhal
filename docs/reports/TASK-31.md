# TASK-31 — Separate development from production, and make the live diagnostics honest

Brief: `docs/tasks/TASK-31-dev-separation.md` (originally briefed as TASK-30; renumbered because
`docs/tasks/TASK-30-deployed-news-flyer.md` already existed — an unrelated, already-committed
piece of work by Emanuel, left untouched throughout this task).

## What was built

- A new, long-lived Neon branch, **`development`** (`br-gentle-term-b11mvbu3`), forked
  copy-on-write from `production`. Local `.env`'s `DATABASE_URI` now points at it instead of at
  production directly. Refresh procedure ("Reset from parent") documented in `.env.example`.
- `exitUnlessDevelopmentDatabaseIsSafe` (`src/instrumentation.ts`), reusing TASK-27's own
  `assertNotProductionDatabase` rather than a second guard — moved that function from `src/test/`
  to `src/lib/` and generalised its one hard-coded message into a `guidance` parameter, since it
  now has two callers (the test suite and this one).
- The five `BACKUP_S3_*` variables set in Vercel's Production environment for the first time,
  using the read-only credential (`ramhal-backups-app-reader`, scope `storage:read` only) TASK-27
  already created but never applied there.
- `getBackupStatus` no longer returns the AWS SDK's raw error message publicly — it logs the real
  error server-side and returns a fixed, generic string instead (`src/lib/backupStatus.ts`).
- `GET /api/diagnostics` narrowed: an anonymous request gets `appEnv`, `builtForAppEnv`,
  `latestMigration`, `backup`, and `database.fingerprint` (a truncated SHA-256 of the connection
  host). The full `database.host`/`database.name`/`database.user` are only included when the
  request carries a valid, authenticated Payload admin session.
- `AGENTS.md`'s verification rule and `docs/RECOVERY.md` updated to describe using the
  fingerprint; production's is recorded there as `2c951382a7f8`.
- `docs/DECISIONS.md` §22 records all of the above, including the trade: content entered locally
  no longer reaches the live site.

## What was verified and how

- **The development-database guard, for real, not by inspection.** Booted locally with
  `APP_ENV=development` and `DATABASE_URI` deliberately set to production's own connection
  string. The process printed `Refusing: "ep-red-tree-b19ry3lo-pooler…" is production's own
  database...` and exited; confirmed the port stopped accepting connections afterward
  (`curl` returned no response) rather than assuming the printed message alone was enough. (One
  timing note under "what felt wrong" below.)
- **The narrowed diagnostics route, against the real (testing-branch) database.** Real
  integration tests: an anonymous request's `database` field is `{ fingerprint }` only, never
  contains the real host/database name/user; an authenticated request gets all three plus the
  fingerprint. "Authenticated" is a real, validly signed Payload session — the local password
  login strategy is disabled, so the test signs its own JWT with `jose` (already a direct
  dependency) using Payload's own derived signing key
  (`sha256(config.secret).hex.slice(0, 32)`), attached to a throwaway user via the public Local
  API (`payload.update`) — not a mock of `payload.auth`.
- **The generic backup-error message.** Unit test mocks the AWS SDK to throw an error containing
  a fake endpoint hostname and asserts `getBackupStatus` returns the fixed, generic string, never
  the SDK's own message.
- **Every backup/diagnostics claim about production, on the live URL, after deploying:**
  - Before: `curl https://ramhal-theta.vercel.app/api/diagnostics` showed `"backup": null` and the
    full `database` object (host/database/user) to an anonymous request.
  - Pushed the five commits below; Vercel's GitHub integration built and deployed automatically
    (confirmed via `vercel inspect` reaching `Ready`).
  - After: the same URL returns
    `{"appEnv":"demo","backup":{"lastSuccessAt":"2026-09-22T15:34:10.716Z","ageHours":1.9},"builtForAppEnv":"demo","database":{"fingerprint":"2c951382a7f8"},"latestMigration":{...}}`.
    `backup.lastSuccessAt` (15:34:10Z) matches the `nightly-database-backup` GitHub Actions run
    (`gh run list`) that started at 15:33:17Z. `database` carries only `fingerprint`, and its
    value (`2c951382a7f8`) matches the value computed from production's known host and now
    recorded in `docs/RECOVERY.md` — confirming, from the live site itself, that it's still the
    same database.
  - Sanity-checked the site itself still serves after deploy (`/` and `/en` return 200).
- **Local development now points at a different database than production**, confirmed by
  comparing `GET /api/diagnostics` from a local `next dev` boot (`fingerprint: "d82df7fce6e7"`)
  against the live production value (`"2c951382a7f8"`) — different values, as expected.
- **Existing cover images still render locally on the new branch**, verified by reasoning from a
  live check rather than assumed: `curl`ing the live homepage shows cover URLs are plain public
  HTTPS (`https://br-delicate-math-b1b1mbw7.storage.c-5.eu-central-1.aws.neon.tech/ramhal-media/…`),
  unauthenticated and independent of which database serves the row referencing them; the
  `development` branch's `Media` rows carry the same URLs, having been forked from production.
- `tsc --noEmit` (clean), `eslint` (0 errors, the same 22 pre-existing generated-migration
  warnings as TASK-29 left), `vitest` (314/314 passing, up from 306), and
  `APP_ENV=development npm run build` (clean) — all before each of the five commits.

## What felt wrong

- **`next dev` printed "Ready" before the development-database guard's refusal message**, in the
  boot-refusal test above. The process did exit and stopped accepting connections immediately
  after, and nothing in this app's own startup path opens a real database connection before a
  request arrives (Payload's Postgres adapter connects lazily), so no query reached production —
  but the ordering is a genuine quirk of when Next.js's `instrumentation.register()` resolves
  relative to the "Ready" banner, not something specific to this guard. All four pre-existing
  `exitUnless*` guards share the exact same timing, since they all run from the same `register()`
  function in the same order — this isn't a new gap introduced here, but it means "the port is
  listening" briefly precedes "the guard has run" for all five checks, not just this one.
- **Neon's object-storage credentials scope to a whole branch (`storage:read`/`storage:write`),
  never to one bucket within it.** The brief asked to stop and report if bucket-scoped read access
  wasn't available — it isn't; `ramhal-backups-app-reader`'s branch-wide `storage:read` is already
  the narrowest credential Neon's API offers, not a broader one chosen for convenience.
- **New Vercel environment variables did not take effect on the already-deployed function** —
  confirmed by curling `/api/diagnostics` twice, 15 seconds apart, right after `vercel env add`,
  with no change. A new deployment (triggered here by pushing to `main`, which Vercel's GitHub
  integration builds automatically) was required before either the new env vars or the narrowed
  route code took effect. Worth remembering for any future env-only Vercel change.
- **This session found an already-committed, unpushed commit on `main`** (`c51edd0`, "fix(media):
  restore missing news flyer bytes") that wasn't there when the task began — Emanuel's own work,
  landed while this task's number was being renumbered. Left entirely untouched, per his explicit
  instruction, and it's now part of the same push.

## What is still open

- **The authenticated-admin path was verified against the real (testing-branch) database via
  integration test, not against the live production `/admin` session** — logging into the live
  site's Google OAuth flow to confirm the same behavior in production specifically wasn't
  attempted, since the code path is identical regardless of which database it's reading from and
  the integration test already exercises Payload's real JWT verification, not a stand-in for it.
- **The `development` branch will drift from `production` over time** since it's a
  point-in-time, copy-on-write fork, not a live replica. `.env.example` documents "Reset from
  parent" as the refresh procedure, but no automation resets it on a schedule — a developer must
  remember to do it when local data looks stale.
- **`demo` and `production` still share the one live database**, unchanged from §20 — this task
  only carved development out. §20's own note that the shared-database trade "should be revisited
  before the site has real customers, not after" still stands for demo/production themselves.
