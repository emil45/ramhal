import { loadEnvConfig } from '@next/env'

// Loads .env the same way Next itself does (this ships with `next`, already
// a direct dependency — see docs/DECISIONS.md §15 for why Payload's own CLI
// can't be relied on to do this outside Next's bundler). Needed so the
// handful of tests that touch the real database (src/lib/*.integration.test.ts)
// see DATABASE_URI and PAYLOAD_SECRET without every test file loading them
// by hand.
loadEnvConfig(process.cwd())
