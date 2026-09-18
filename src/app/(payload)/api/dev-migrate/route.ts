import config from '@payload-config'
import { timingSafeEqual } from 'node:crypto'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

/**
 * Dev-only route that calls the exact database-adapter methods Payload's own
 * CLI calls (`payload.db.createMigration` / `payload.db.migrate`) — from
 * inside a process Next already bundles correctly, instead of through the
 * CLI's own module loader, which is broken for this project. Two verified,
 * independent upstream causes (both reproduce identically on Node 22.23.2
 * and Node 24.12.0, with tsx pinned to 4.21.0 and the config's imports fixed
 * — see the previous commits):
 *
 * 1. `@payloadcms/richtext-lexical` depends on `lexical`, whose `*.node.mjs`
 *    entry files each do a top-level `await import(...)` to pick a dev/prod
 *    build. Node refuses to `require()` any ESM graph containing top-level
 *    await — confirmed with `node --experimental-print-required-tla`.
 * 2. `@payloadcms/db-postgres` imports `loadEnv` from `payload/node`, which
 *    does `import nextEnvImport from '@next/env'` (a CommonJS package).
 *    That resolves fine under Next's bundler and resolves to `undefined`
 *    under tsx's CJS/ESM interop.
 *
 * Delete this route and scripts/dev-migrate.mjs once payloadcms/payload
 * fixes either cause and `payload migrate:create` / `payload migrate` work
 * directly — see docs/DECISIONS.md for the full record.
 *
 * SECURITY: this runs real schema migrations against whatever database
 * DATABASE_URI points at, and route handlers ship in the production build —
 * Next has no mechanism to exclude a file from the build based on an env
 * check, so "dev-only" in the path is not a control, only a label. Two
 * independent layers actually enforce it:
 *   1. `src/proxy.ts` returns 404 for this path before this file ever runs,
 *      whenever NODE_ENV is "production".
 *   2. `isAuthorized` below refuses unless NODE_ENV is exactly "development"
 *      AND a DEV_MIGRATE_SECRET matching the request's is set — a variable
 *      that must never exist in a production environment's secrets. Either
 *      layer alone should be enough; both exist so one being misconfigured
 *      doesn't expose this.
 * Every rejection returns a bare 404, identical to a route that doesn't
 * exist — never 401/403, which would confirm the route is there.
 */

function isAuthorized(request: Request): boolean {
  if (process.env.NODE_ENV !== 'development') return false

  const expected = process.env.DEV_MIGRATE_SECRET
  if (!expected) return false

  const provided = request.headers.get('x-dev-migrate-secret') ?? ''
  const expectedBytes = Buffer.from(expected)
  const providedBytes = Buffer.from(provided)
  return expectedBytes.length === providedBytes.length && timingSafeEqual(expectedBytes, providedBytes)
}

// Payload's own migration template writes
// `import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'`
// even though MigrateUpArgs/MigrateDownArgs are type-only exports (verified:
// `@payloadcms/db-postgres`'s .d.ts re-exports them as `export type`, its .js
// does not export them at all). tsx and every bundler silently elide unused
// type imports, so nobody notices; the loader `payload.db.migrate()` uses
// here does not, and fails with "does not provide an export named
// 'MigrateUpArgs'". Fixing it in the freshly written file is a one-line,
// idempotent string replace, not a template fork.
const BAD_IMPORT = "import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'"
const FIXED_IMPORT = [
  "import type { MigrateDownArgs, MigrateUpArgs } from '@payloadcms/db-postgres'",
  "import { sql } from '@payloadcms/db-postgres'",
].join('\n')

async function listMigrationFiles(dir: string): Promise<Set<string>> {
  try {
    return new Set((await readdir(dir)).filter((name) => name.endsWith('.ts')))
  } catch {
    return new Set()
  }
}

/**
 * Patches exactly the migration file `createMigration` just wrote. Throws
 * rather than silently skipping when the expected text isn't there — this
 * string match will stop matching the moment Payload changes its template,
 * and a migration silently missing this fix fails far from this file, as a
 * confusing runtime error inside `payload.db.migrate()` instead of here.
 */
async function fixMigrationImport(filePath: string): Promise<void> {
  const contents = await readFile(filePath, 'utf8')
  if (!contents.includes(BAD_IMPORT)) {
    throw new Error(
      `Expected to find the import line:\n  ${BAD_IMPORT}\nin ${filePath}, but it is not there. ` +
        `Payload's migration template has likely changed — update BAD_IMPORT/FIXED_IMPORT in ` +
        `src/app/(payload)/api/dev-migrate/route.ts to match the new template, or remove this ` +
        `patch entirely if the template now imports its types correctly.`,
    )
  }
  await writeFile(filePath, contents.replace(BAD_IMPORT, FIXED_IMPORT))
}

export async function GET(request: Request): Promise<Response> {
  if (!isAuthorized(request)) {
    return NextResponse.json(null, { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  // disableOnInit, exactly as Payload's own CLI does for migrate/migrate:create
  // (node_modules/payload/dist/bin/migrate.js) — onInit runs the seed, which
  // queries `categories`, and that table does not exist yet on a database
  // this route is about to migrate. Without this, migrating a genuinely
  // empty database crashes before db.migrate() ever runs (verified against
  // a disposable empty Neon database — see docs/reports/TASK-05.md).
  const payload = await getPayload({ config, disableOnInit: true })

  if (action === 'create') {
    const before = await listMigrationFiles(payload.db.migrationDir)
    await payload.db.createMigration({
      payload,
      migrationName: searchParams.get('name') ?? undefined,
      // Prevents an interactive prompt (no TTY exists in a route handler) if
      // a run is ever triggered with no schema changes to record.
      forceAcceptWarning: true,
    })
    const after = await listMigrationFiles(payload.db.migrationDir)
    const newFile = [...after].find((name) => !before.has(name))
    if (!newFile) {
      throw new Error(`createMigration did not produce a new file in ${payload.db.migrationDir}`)
    }
    await fixMigrationImport(path.join(payload.db.migrationDir, newFile))
    return NextResponse.json({ ok: true, action: 'create' })
  }

  if (action === 'run') {
    await payload.db.migrate()
    return NextResponse.json({ ok: true, action: 'run' })
  }

  return NextResponse.json({ error: 'action must be "create" or "run"' }, { status: 400 })
}
