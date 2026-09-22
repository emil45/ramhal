import config from '@payload-config'
import { getPayload } from 'payload'

import { readAppEnvironment } from '@/lib/appEnvironment'
import { buildDiagnostics } from '@/lib/diagnostics'
import { requireEnv } from '@/lib/env'

import type { LatestMigration } from '@/lib/diagnostics'

/**
 * Public, deliberately — see AGENTS.md's verification rule. Reports which
 * database this deployment is actually talking to (never the password),
 * which APP_ENV it's running as, and the most recent applied migration.
 * `payload_migrations` is Payload's own internal table, not a registered
 * collection, so reading it needs the adapter's raw pool, the same way
 * scripts/migrate.mjs already does.
 */
export async function GET(): Promise<Response> {
  const payload = await getPayload({ config })

  const { rows } = await payload.db.pool.query<{ applied_at: string; name: string }>(
    'SELECT name, created_at AS applied_at FROM payload_migrations ORDER BY id DESC LIMIT 1',
  )
  const latestMigration: LatestMigration = rows[0] ? { name: rows[0].name, appliedAt: rows[0].applied_at } : null

  const diagnostics = buildDiagnostics({
    appEnv: readAppEnvironment(),
    backup: null,
    builtForAppEnv: process.env.BUILT_FOR_APP_ENV,
    databaseUri: requireEnv('DATABASE_URI'),
    latestMigration,
  })

  return Response.json(diagnostics)
}
