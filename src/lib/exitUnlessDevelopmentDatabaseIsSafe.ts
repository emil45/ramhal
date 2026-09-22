import { readAppEnvironment } from '@/lib/appEnvironment'
import { requireEnv } from '@/lib/env'
import { assertNotProductionDatabase } from '@/lib/refuseProductionDatabase'

/**
 * `next dev` must be unable to touch the database that serves the public,
 * for the same reason TASK-27 already refuses it for the test suite —
 * reusing that same guard rather than writing a second one
 * (docs/DECISIONS.md §22). Only checked under APP_ENV=development: demo and
 * production are still meant to share the one production database
 * (docs/DECISIONS.md §20).
 */
export function exitUnlessDevelopmentDatabaseIsSafe(): void {
  if (readAppEnvironment() !== 'development') return

  try {
    assertNotProductionDatabase(
      new URL(requireEnv('DATABASE_URI')).hostname,
      'Point DATABASE_URI at the Neon branch named "development" instead. See .env.example.',
    )
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  }
}
