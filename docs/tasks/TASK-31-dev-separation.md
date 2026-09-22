# TASK-31 — Separate development from production, and make the live diagnostics honest

(Originally briefed as TASK-30; renumbered before any work started because
`docs/tasks/TASK-30-deployed-news-flyer.md` already exists — Emanuel confirmed TASK-31.)

## Why

`GET /api/diagnostics` on `ramhal-theta.vercel.app` currently reports:

```json
{"appEnv":"demo","backup":null,"builtForAppEnv":"demo",
 "database":{"host":"ep-red-tree-b19ry3lo-pooler…","database":"neondb","user":"neondb_owner"}, …}
```

Three confirmed problems:

1. Local `.env`'s `DATABASE_URI` is byte-identical to production's (`ep-red-tree-b19ry3lo`).
   TASK-27 isolated the *test* suite (`ep-curly-feather`) but never isolated *development* —
   every `next dev` session reads and writes the live site's own data. TASK-29's report went
   wrong for exactly this reason: it said local had a record production "does not", but local
   *is* production.
2. `"backup": null` in production. TASK-27 built and proved the nightly dump, but the
   bucket-reader variables were never set in Vercel, so the check that was meant to make a
   silent failure visible can't see anything in the one environment that matters.
3. The public diagnostics payload shows three of the four parts of a connection string — only
   the password is missing.

## Scope

1. **Give development its own database branch.** A Neon branch forked from production
   (copy-on-write), local `.env`'s `DATABASE_URI` pointed at it, refresh procedure documented.
   Reuse TASK-27's refuse-if-production guard (`assertNotProductionDatabase`) for a new boot-time
   check: under `APP_ENV=development`, refuse to start against production, exactly like the test
   suite already refuses. Verify for real, the same way TASK-27 did. Decide and document where
   local media uploads go without touching the production bucket, and how covers whose URLs
   already point at the production bucket keep rendering locally. Record the resulting trade in
   `docs/DECISIONS.md`: content entered locally no longer reaches the live site.
2. **Make production see its own backups.** Set the backup-reader variables in Vercel's
   Production environment, using a credential that can only read, scoped as narrowly as the
   storage provider allows. Verify on the live URL that `backup.lastSuccessAt`/`ageHours` match
   the most recent nightly run, and that a failure (if any) surfaces only a generic message.
3. **Narrow the public diagnostics payload.** Public response: `appEnv`, `builtForAppEnv`,
   `latestMigration`, `backup`, and a short stable database fingerprint — enough to answer "which
   database is this?" without exposing host, database name or user. Those three remain available,
   but only behind an authenticated admin (Payload) session. Update the AGENTS.md verification
   rule to describe using the fingerprint, and record the production fingerprint somewhere a
   stranger will find it.

## Verification

- `tsc --noEmit`, ESLint, Vitest, `next build` before every commit.
- Every claim about production verified through the live URL, per AGENTS.md.
- The development-database guard tested for real: boot locally with `APP_ENV=development` and
  `DATABASE_URI` deliberately pointed at production, confirm it refuses before serving anything.
- Finish with `docs/reports/TASK-31.md`.
