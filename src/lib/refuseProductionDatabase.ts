/**
 * The hard requirement docs/tasks/TASK-27-database-hardening.md names: a
 * test run must be unable to touch the live database even when someone's
 * `.env` is wrong. `TEST_DATABASE_URI` being a separate, required variable
 * (vitest.setup.ts) is the first guard — a test run never falls back to
 * whatever `DATABASE_URI` happens to hold. This is the second, independent
 * one: even a `TEST_DATABASE_URI` mistakenly pointed at production is
 * refused. TASK-31 reuses the same guard for local development
 * (exitUnlessDevelopmentDatabaseIsSafe) rather than writing a second one —
 * `guidance` is the only thing that differs between the two callers.
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
