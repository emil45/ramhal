import { loadEnvConfig } from '@next/env'

import { assertNotNeonDatabase, assertNotProductionDatabase } from '@/lib/refuseProductionDatabase'

// Loads .env the same way Next itself does (this ships with `next`, already
// a direct dependency — see docs/DECISIONS.md §15 for why Payload's own CLI
// can't be relied on to do this outside Next's bundler). Needed so the
// handful of tests that touch the real database (src/lib/*.integration.test.ts)
// see DATABASE_URI and PAYLOAD_SECRET without every test file loading them
// by hand.
loadEnvConfig(process.cwd())

// A test run must never be able to touch the database that serves the
// public — not "reads DATABASE_URI like everything else", a *separate*,
// required variable, so there is no fallback path where a run silently
// proceeds against whatever
// DATABASE_URI happens to hold. Overriding DATABASE_URI here, once, before
// any test file's own imports resolve, is what makes every existing
// getPayload({config}) call in the test suite transparently target it.
const testDatabaseUri = process.env.TEST_DATABASE_URI
if (!testDatabaseUri) {
  throw new Error(
    'TEST_DATABASE_URI is not set. Tests never fall back to DATABASE_URI — point TEST_DATABASE_URI at the ' +
      'local ramhal_test database (docs/DECISIONS.md §5). See .env.example.',
  )
}
const testDatabaseHost = new URL(testDatabaseUri).hostname
const guidance = 'Point TEST_DATABASE_URI at the local ramhal_test database instead. See .env.example.'
assertNotNeonDatabase(testDatabaseHost, guidance)
assertNotProductionDatabase(testDatabaseHost, guidance)
process.env.DATABASE_URI = testDatabaseUri
