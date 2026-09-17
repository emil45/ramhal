# TASK-03 — Migration workaround

No brief file exists in `docs/tasks/` for this task. Reconstructed from commit history
(`c8ae480`, `740d6a3`), not memory.

## What was built

- `payload migrate:create` and `payload migrate` both fail identically
  (`ERR_REQUIRE_ASYNC_MODULE`), for the same two reasons found in TASK-02. Rather than continue
  fighting the CLI's loader, migrations are now driven by calling the same database-adapter
  methods the CLI calls (`payload.db.createMigration`, `payload.db.migrate`) from inside a
  Next.js route handler, which Next's own bundler builds correctly.
- `scripts/dev-migrate.mjs` drives it: starts `next dev` with `PAYLOAD_MIGRATING=true` (skips
  the dev-mode schema push that would otherwise block `migrate()` on an interactive prompt no
  route handler can answer), waits for the route, calls it, shuts the server down. Exposed as
  `npm run migrate` / `npm run migrate:create`.
- Fixed a third issue this exposed: Payload's migration template imports
  `MigrateUpArgs`/`MigrateDownArgs` as values when they are type-only exports — harmless under
  bundlers that elide unused type imports, a hard failure under the loader `migrate()` uses.
  Patched with a one-line, idempotent string replace on the freshly written migration file.
- The first real migration (615 lines) was generated and committed.
- Locked the route down in a follow-up commit: the route's name (`dev-migrate`) was the only
  thing "dev-only" about it, and it ran real migrations against whatever `DATABASE_URI` pointed
  at. Two independent gates added: `src/proxy.ts` returns 404 for the path whenever `NODE_ENV`
  is `"production"`, before the route handler runs; the route itself also refuses unless
  `NODE_ENV` is exactly `"development"` and a required `DEV_MIGRATE_SECRET` matches via a
  constant-time comparison. Every rejection is a bare 404, never 401/403, so the route's
  existence is never confirmed to a prober.
- The template-patch step was also hardened: it now scopes to exactly the migration file
  `createMigration` just produced and throws, naming the file and the expected text, if that
  text isn't found — rather than silently skipping a file it doesn't recognize.

## What was verified and how

- Confirmed `migrate` (not just `migrate:create`/`generate:types`) hits the identical
  `ERR_REQUIRE_ASYNC_MODULE` crash, ruling out a narrower fix.
- Read the generated 615-line migration directly to confirm its content, rather than assuming
  the route-handler path produced the same output the CLI would have.
- The production lockdown was confirmed against an actual `next build && next start`, not
  assumed from the source: 404 with no secret, 404 with the correct secret, both before and
  after the gating commit.

## What felt wrong

- Working around a broken CLI by routing through a Next.js route handler is a workaround, not a
  fix — it depends on the same bundler behaviour indefinitely. Worth revisiting if a future
  Payload/tsx release fixes the underlying resolution issue.

## What is still open

- No indication in the commit history that the upstream Payload/tsx issues
  (`payloadcms/payload#16684`, `#16949`) were reported or tracked externally; this workaround
  has no expiry condition tied to an upstream fix landing.
