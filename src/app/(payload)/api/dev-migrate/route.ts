import config from '@payload-config'
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
 */

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

async function fixMigrationImports(migrationDir: string): Promise<void> {
  const files = await readdir(migrationDir)
  for (const file of files.filter((name) => name.endsWith('.ts'))) {
    const filePath = path.join(migrationDir, file)
    const contents = await readFile(filePath, 'utf8')
    if (contents.includes(BAD_IMPORT)) {
      await writeFile(filePath, contents.replace(BAD_IMPORT, FIXED_IMPORT))
    }
  }
}

export async function GET(request: Request): Promise<Response> {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'dev only' }, { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const payload = await getPayload({ config })

  if (action === 'create') {
    await payload.db.createMigration({
      payload,
      migrationName: searchParams.get('name') ?? undefined,
      // Prevents an interactive prompt (no TTY exists in a route handler) if
      // a run is ever triggered with no schema changes to record.
      forceAcceptWarning: true,
    })
    await fixMigrationImports(payload.db.migrationDir)
    return NextResponse.json({ ok: true, action: 'create' })
  }

  if (action === 'run') {
    await payload.db.migrate()
    return NextResponse.json({ ok: true, action: 'run' })
  }

  return NextResponse.json({ error: 'action must be "create" or "run"' }, { status: 400 })
}
