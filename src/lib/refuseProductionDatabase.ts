/**
 * The hard requirement: a test run must be unable to touch the live
 * database even when someone's `.env` is wrong. `TEST_DATABASE_URI` being a
 * separate, required variable (vitest.setup.ts) is the first guard — a test
 * run never falls back to whatever `DATABASE_URI` happens to hold. This is
 * the second, independent one: even a `TEST_DATABASE_URI` mistakenly
 * pointed at production is refused.
 *
 * The host is not a secret — GET /api/diagnostics publishes a fingerprint
 * derived from it (src/lib/diagnostics.ts) precisely so it can be compared
 * without the raw value leaving this file — but it IS load-bearing: if
 * production's database ever changes (another consolidation, a host
 * rotation), this constant must be updated too, or this guard silently
 * stops protecting anything.
 */
const PRODUCTION_DATABASE_HOST = 'ep-red-tree-b19ry3lo-pooler.c-5.eu-central-1.aws.neon.tech'

export function assertNotProductionDatabase(host: string, guidance: string): void {
  if (host === PRODUCTION_DATABASE_HOST) {
    throw new Error(`Refusing: "${host}" is production's own database. ${guidance}`)
  }
}

// Neon is only ever reached by Vercel's deployed app and the nightly backup
// (docs/DECISIONS.md §5): its free plan meters network transfer for the whole
// project, and local work, builds and tests used to exhaust it.
const NEON_HOST_SUFFIX = '.neon.tech'

/** The one command-scoped escape hatch for a script that mutates production
 * data (docs/RECOVERY.md, "Running a one-off script against production"). Its
 * value names the task, so a stale export in a shell profile is visibly wrong. */
export const PRODUCTION_ONE_OFF_OVERRIDE = 'ALLOW_PRODUCTION_ONE_OFF'
const TASK_IDENTIFIER = /^TASK-\d+$/

function isNeonHost(host: string): boolean {
  return host.endsWith(NEON_HOST_SUFFIX)
}

/** Tests write to their database freely, so no override exists. */
export function assertNotNeonDatabase(host: string, guidance: string): void {
  if (isNeonHost(host)) {
    throw new Error(`Refusing: "${host}" is a Neon database, and tests never use one. ${guidance}`)
  }
}

export function assertDevelopmentDoesNotUseNeon({
  appEnvironment,
  host,
  override,
}: {
  appEnvironment: string
  host: string
  override: string | undefined
}): void {
  if (appEnvironment !== 'development' || !isNeonHost(host)) return
  if (override !== undefined && TASK_IDENTIFIER.test(override)) return
  throw new Error(
    `Refusing: DATABASE_URI points at Neon ("${host}") while APP_ENV is development. ` +
      'Local work runs against the local Postgres (`npm run db:restore-local`, docs/RECOVERY.md). ' +
      `A production one-off script sets ${PRODUCTION_ONE_OFF_OVERRIDE}=TASK-NN for its own command only.`,
  )
}
