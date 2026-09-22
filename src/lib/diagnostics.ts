import { createHash } from 'node:crypto'

/**
 * What the running application can say about itself, publicly — the fix for
 * the root cause behind TASK-24's finding: three tasks verified "production"
 * against a Neon project connection the live site never actually served,
 * and nobody could cheaply ask the running site which database it was on.
 * See AGENTS.md's verification rule and docs/DECISIONS.md §20/§22.
 *
 * `host`, `database` and `user` are only ever handed to an authenticated
 * admin caller (route.ts) — an anonymous caller gets `fingerprint` alone
 * (toPublicDiagnostics). None of the three is secret on its own, but
 * together they're most of a connection string, which is more than a
 * public, unauthenticated endpoint needs to say.
 */

const FINGERPRINT_LENGTH = 12

/** A short, stable value derived from the connection host — enough to
 * answer "is this the same database as last time?" by comparing it against
 * a recorded value (docs/RECOVERY.md), without exposing the host itself. */
export function computeDatabaseFingerprint(host: string): string {
  return createHash('sha256').update(host).digest('hex').slice(0, FINGERPRINT_LENGTH)
}

export type DatabaseIdentity = {
  /** The connection host — for Neon, this embeds the branch's own endpoint
   * id (e.g. `ep-red-tree-b19ry3lo`), a real, stable, per-branch identifier.
   * Not the Neon project/branch's human-readable name: that needs a
   * NEON_API_KEY and a call to Neon's Management API for a label this
   * already disambiguates unambiguously — see docs/reports/TASK-27.md. */
  host: string
  database: string
  user: string
  fingerprint: string
}

export type PublicDatabaseIdentity = Pick<DatabaseIdentity, 'fingerprint'>

/** Never call this on anything but DATABASE_URI's structure — the password
 * component is deliberately never read out of the parsed URL. */
export function parseDatabaseIdentity(databaseUri: string): DatabaseIdentity {
  const url = new URL(databaseUri)
  return {
    host: url.hostname,
    database: url.pathname.replace(/^\//, ''),
    user: decodeURIComponent(url.username),
    fingerprint: computeDatabaseFingerprint(url.hostname),
  }
}

export type LatestMigration = { appliedAt: string; name: string } | null

export type BackupStatus = { ageHours: number; lastSuccessAt: string } | { error: string } | null

export type Diagnostics = {
  appEnv: string
  backup: BackupStatus
  builtForAppEnv: string | null
  database: DatabaseIdentity
  latestMigration: LatestMigration
}

export function buildDiagnostics(params: {
  appEnv: string
  backup: BackupStatus
  builtForAppEnv: string | undefined
  databaseUri: string
  latestMigration: LatestMigration
}): Diagnostics {
  return {
    appEnv: params.appEnv,
    backup: params.backup,
    builtForAppEnv: params.builtForAppEnv ?? null,
    database: parseDatabaseIdentity(params.databaseUri),
    latestMigration: params.latestMigration,
  }
}

export type PublicDiagnostics = Omit<Diagnostics, 'database'> & { database: PublicDatabaseIdentity }

/** What an unauthenticated caller sees — everything except the three fields
 * that together are most of a connection string. */
export function toPublicDiagnostics(diagnostics: Diagnostics): PublicDiagnostics {
  return { ...diagnostics, database: { fingerprint: diagnostics.database.fingerprint } }
}
