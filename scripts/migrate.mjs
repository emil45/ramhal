#!/usr/bin/env node
// Brings the database DATABASE_URI points at up to date by running every
// committed migration in src/migrations/ that has not run yet. This is the only
// way schema reaches a database — from an empty one to a current one, locally
// and on a host. `npm run db:migrate`.
//
// Why it is a script and not `payload migrate`: Payload's own CLI cannot load
// this project's config under Node (see docs/DECISIONS.md §15). This script
// sidesteps that by not loading the project's config at all. Migrations are
// self-contained SQL, so all it needs is a database adapter and Payload's own
// migrations table — a config with no collections. Node strips the TypeScript
// types from the migration files itself.
//
// Safe to run any number of times: an up-to-date database is a no-op.
import { readdir } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { buildConfig, getPayload } from 'payload'

const MIGRATIONS_DIRECTORY = path.resolve(import.meta.dirname, '../src/migrations')
const MIGRATION_FILE = /^\d{8}_\d{6}_.+\.ts$/

try {
  process.loadEnvFile('.env')
} catch {
  // No .env file: the variables come from the host's environment.
}

const connectionString = process.env.DATABASE_URI
if (!connectionString) {
  throw new Error('DATABASE_URI is not set. See .env.example.')
}

async function loadMigrations() {
  const files = (await readdir(MIGRATIONS_DIRECTORY)).filter((name) => MIGRATION_FILE.test(name)).sort()
  return Promise.all(
    files.map(async (file) => {
      const { up, down } = await import(pathToFileURL(path.join(MIGRATIONS_DIRECTORY, file)).href)
      return { name: file.replace(/\.ts$/, ''), up, down }
    }),
  )
}

const payload = await getPayload({
  config: buildConfig({
    // Never used to sign anything here; Payload just requires one.
    secret: process.env.PAYLOAD_SECRET ?? 'migration-runner',
    collections: [],
    // Schema changes come from migrations only. Never from a dev-mode push.
    db: postgresAdapter({ pool: { connectionString }, push: false }),
  }),
})

try {
  const { rows: tables } = await payload.db.pool.query(`SELECT to_regclass('payload_migrations') IS NOT NULL AS present`)
  const migrationsTableExists = tables[0].present
  const alreadyRun = migrationsTableExists ? (await payload.db.pool.query('SELECT name, batch FROM payload_migrations')).rows : []

  // Databases built by the old dev setup carry a marker row that makes Payload
  // stop and ask, interactively, whether to proceed with data loss. A script
  // cannot answer, and silently deleting the row would hide that this database's
  // schema was never built from the migrations. Refuse, and say what to do.
  if (alreadyRun.some((row) => Number(row.batch) === -1)) {
    throw new Error(
      'This database was built by an older dev setup that pushed its schema directly (payload_migrations has a batch -1 "dev" row).\n' +
        'Its schema was not made by the committed migrations, so they cannot be trusted to apply cleanly.\n' +
        'Point DATABASE_URI at an empty database instead — see the README.',
    )
  }

  const migrations = await loadMigrations()
  await payload.db.migrate({ migrations })

  const alreadyRunNames = alreadyRun.map((row) => row.name)
  const applied = migrations.filter((migration) => !alreadyRunNames.includes(migration.name))
  console.log(
    applied.length === 0
      ? 'Database already up to date.'
      : `Applied ${applied.length} migration(s): ${applied.map((migration) => migration.name).join(', ')}`,
  )
} finally {
  await payload.destroy()
}

// Payload's own CLI does the same after destroy: its Postgres adapter keeps a
// reconnect client checked out, so a successful one-shot process cannot become
// idle on its own.
process.exit(0)
