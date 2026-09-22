# TASK-27 — Make the one database safe to work against

Re-issued from a TASK-25 brief that number-collided with a donation page and was silently
deferred rather than blocking on it — confirmed before starting that neither `docs/tasks/TASK-27-*`
nor `docs/reports/TASK-27.md` already existed. Picked up cold. Read `AGENTS.md`,
`docs/DECISIONS.md` §14/§18/§19/§20, and `docs/reports/TASK-24.md`/`TASK-26.md` before touching
anything. Work on `main` (§17). This file is written from the brief before starting;
`docs/reports/TASK-27.md` is written last.

## Why this task exists

TASK-24 consolidated onto one production database after finding three prior tasks had verified
"production" against a Neon project the live site never served. That was right, but left four
things true: production is the only copy of real catalogue repair work; the from-scratch import
is known broken and can't reconstitute it; §14 promises two backup mechanisms and neither exists
(verified again here: no `pg_dump` anywhere in the repo, no `.github/workflows`); and TASK-26's
integration tests now create and settle real orders against that same database on every local
run. This task makes that state survivable — no feature work.

## Already verified, not re-derived

- No `docs/tasks/TASK-27-*` or `docs/reports/TASK-27.md` existed before this session.
- `pg_dump` appears nowhere in the repository (`grep -rl pg_dump`, excluding `node_modules`/`.git`
  — empty).
- No `.github/workflows` directory exists.
- `payload_migrations` (`id`, `name`, `batch`, `created_at`, `updated_at`) is a plain table, not a
  registered Payload collection — reading the latest row needs a raw SQL query through the
  adapter's own pool, the same way `scripts/migrate.mjs` already does, not `payload.find()`.
- `vitest.setup.ts` is the one place every test file (unit and integration alike) already loads
  `.env` through — the natural, singular choke point for a hard refusal check.

## Plan, decided before writing code

**Item 1 — diagnostics route.** `GET /api/diagnostics`, public. Reports `APP_ENV`,
`BUILT_FOR_APP_ENV`, the database's host/database-name/username parsed structurally out of
`DATABASE_URI` (never the password), and the most recent applied migration's name and timestamp.
Deliberately does **not** call Neon's Management API for the project/branch's human-readable name
— that needs a new `NEON_API_KEY` secret and a new external dependency for a label the parsed
host already disambiguates unambiguously (Neon's endpoint id, embedded in the hostname, is a real,
stable, per-branch identifier — this is exactly what let TASK-24 tell the two Neon projects apart
by inspection). A scope decision, stated here rather than silently narrowed.

**Item 2 — test isolation.** One long-lived Neon branch, unmistakably named, not a fresh branch
per run. Argued on the brief's own question — what happens when a run is killed half way: a
per-run branch needs its own teardown step to run to avoid being orphaned, and a killed process
(Ctrl-C, a CI timeout) skips exactly that step, leaving Neon branches to accumulate with nothing
to reap them. A long-lived branch has no equivalent failure mode — an interrupted run leaves it
in whatever partial state the existing run-id-scoped cleanup (`src/test/checkoutFixtures.ts`)
already tolerates, the same tolerance it already needs today against production. TASK-24 proved
Neon branch create/delete works reliably; that evidence supports the mechanism, not particularly
this choice over the other.

Enforcement: a new required `TEST_DATABASE_URI`, read only by the test setup, which overrides
`DATABASE_URI` for the test process. Missing entirely → hard failure, no fallback to whatever
`DATABASE_URI` happens to hold. Independently, the resolved host is compared against a checked-in
constant naming production's own host (not a secret — item 1 publishes it) and refused if they
match, so a `TEST_DATABASE_URI` mistakenly pointed at production is caught too. Verified by
deliberately setting `TEST_DATABASE_URI` to production's connection string and confirming the
suite refuses to run.

**Item 3 — backups.** Establish Neon's actual current retention/granularity/restore procedure
empirically (not the marketing page). Add a scheduled `pg_dump` to object storage via GitHub
Actions (the default per the brief; used unless a concrete reason rules it out). Surface the last
successful dump's age through the diagnostics route. Prove the restore against a throwaway Neon
branch — dump, restore, boot the app, confirm catalogue and users intact — and write it into
`docs/RECOVERY.md` beside the existing admin-account procedure. Never exercised against the live
database.

**Item 4 — two small things.** Hide `payload-oauth2`'s `sub` field via its `subField` config
option rather than translating a field that's never read. Record in `DECISIONS.md`, against §5's
"structured extension work" claim, that TASK-26 found a real gap between `PaymentRequest`
(one `returnUrl`) and PayPal (separate approve/cancel URLs), and that the interface's shape
carries the mock provider's assumptions — worth expecting more of when the Israeli gateway lands.

## Gate and reporting

`tsc --noEmit`, ESLint, Vitest, `next build` before every commit. Small conventional commits.
Cannot push. Separate what was executed from what was reasoned about, the way TASK-24's report
does. If any premise here turns out wrong, say so and do not implement it.
