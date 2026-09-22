import config from '@payload-config'
import { getPayload } from 'payload'

import { readAppEnvironment } from '@/lib/appEnvironment'
import { readBackupReaderConfig } from '@/lib/backupReaderConfig'
import { getBackupStatus } from '@/lib/backupStatus'
import { buildDiagnostics, toPublicDiagnostics } from '@/lib/diagnostics'
import { requireEnv } from '@/lib/env'

import type { LatestMigration } from '@/lib/diagnostics'

/**
 * Public, deliberately — see AGENTS.md's verification rule. Reports which
 * APP_ENV this deployment is running as, a fingerprint of the database it's
 * talking to, and the most recent applied migration, to anyone. The
 * database's actual host, name and connecting user — together, most of a
 * connection string — are only included for a request carrying a valid
 * admin session: `allowOnlyListedAdmins` is the only way to ever obtain one
 * (docs/DECISIONS.md §19/§20), so any authenticated user here is an admin.
 * See docs/DECISIONS.md §22.
 *
 * `payload_migrations` is Payload's own internal table, not a registered
 * collection, so reading it needs the adapter's raw pool, the same way
 * scripts/migrate.mjs already does.
 */
export async function GET(request: Request): Promise<Response> {
  const payload = await getPayload({ config })

  const { rows } = await payload.db.pool.query<{ applied_at: string; name: string }>(
    'SELECT name, created_at AS applied_at FROM payload_migrations ORDER BY id DESC LIMIT 1',
  )
  const latestMigration: LatestMigration = rows[0] ? { name: rows[0].name, appliedAt: rows[0].applied_at } : null
  const backup = await getBackupStatus(readBackupReaderConfig(process.env))

  const diagnostics = buildDiagnostics({
    appEnv: readAppEnvironment(),
    backup,
    builtForAppEnv: process.env.BUILT_FOR_APP_ENV,
    databaseUri: requireEnv('DATABASE_URI'),
    latestMigration,
  })

  const { user } = await payload.auth({ headers: request.headers })

  return Response.json(user ? diagnostics : toPublicDiagnostics(diagnostics))
}
