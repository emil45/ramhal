import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Only real for tests that touch Payload's Local API
      // (src/lib/*.integration.test.ts) — see vitest.setup.ts and
      // src/test/serverOnlyShim.ts for why both aliases below exist.
      '@payload-config': path.resolve(__dirname, './src/payload.config.ts'),
      'server-only': path.resolve(__dirname, './src/test/serverOnlyShim.ts'),
    },
  },
  test: {
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    // The Local API tests hit the real dev database over the network
    // (Neon) — comfortably inside a minute, but well past vitest's 5s
    // default.
    testTimeout: 30_000,
    env: {
      // Payload's own flag to skip next dev's dynamic schema push during
      // these tests — see docs/DECISIONS.md §15 and
      // src/app/(payload)/api/dev-migrate/route.ts's own comment on the
      // same flag. Without it, every test run pays a multi-second
      // "pulling schema from database" round trip against Neon for no
      // reason (the schema is already correct — it came from a committed
      // migration).
      PAYLOAD_MIGRATING: 'true',
    },
  },
})
