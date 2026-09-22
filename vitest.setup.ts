import { loadEnvConfig } from '@next/env'

import { assertNotProductionDatabase } from '@/lib/refuseProductionDatabase'

// Loads .env the same way Next itself does (this ships with `next`, already
// a direct dependency — see docs/DECISIONS.md §15 for why Payload's own CLI
// can't be relied on to do this outside Next's bundler). Needed so the
// handful of tests that touch the real database (src/lib/*.integration.test.ts)
// see DATABASE_URI and PAYLOAD_SECRET without every test file loading them
// by hand.
loadEnvConfig(process.cwd())

// A test run must never be able to touch the database that serves the
// public (docs/tasks/TASK-27-database-hardening.md) — not "reads
// DATABASE_URI like everything else", a *separate*, required variable, so
// there is no fallback path where a run silently proceeds against whatever
// DATABASE_URI happens to hold. Overriding DATABASE_URI here, once, before
// any test file's own imports resolve, is what makes every existing
// getPayload({config}) call in the test suite transparently target it.
const testDatabaseUri = process.env.TEST_DATABASE_URI
if (!testDatabaseUri) {
  throw new Error(
    'TEST_DATABASE_URI is not set. Tests never fall back to DATABASE_URI — point TEST_DATABASE_URI at the ' +
      'long-lived Neon branch named "testing" (docs/reports/TASK-27.md). See .env.example.',
  )
}
assertNotProductionDatabase(
  new URL(testDatabaseUri).hostname,
  'Point TEST_DATABASE_URI at the long-lived Neon branch named "testing" instead. See .env.example.',
)
process.env.DATABASE_URI = testDatabaseUri
