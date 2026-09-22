/**
 * What the running application can say about itself, publicly — the fix for
 * the root cause behind TASK-24's finding: three tasks verified "production"
 * against a Neon project connection the live site never actually served,
 * and nobody could cheaply ask the running site which database it was on.
 * See AGENTS.md's verification rule and docs/DECISIONS.md §20.
 */

export type DatabaseIdentity = {
  /** The connection host — for Neon, this embeds the branch's own endpoint
   * id (e.g. `ep-red-tree-b19ry3lo`), a real, stable, per-branch identifier.
   * Not the Neon project/branch's human-readable name: that needs a
   * NEON_API_KEY and a call to Neon's Management API for a label this
   * already disambiguates unambiguously — see docs/reports/TASK-27.md. */
  host: string
  database: string
  user: string
}

/** Never call this on anything but DATABASE_URI's structure — the password
 * component is deliberately never read out of the parsed URL. */
export function parseDatabaseIdentity(databaseUri: string): DatabaseIdentity {
  const url = new URL(databaseUri)
  return {
    host: url.hostname,
    database: url.pathname.replace(/^\//, ''),
    user: decodeURIComponent(url.username),
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
