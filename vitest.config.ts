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
    server: {
      deps: {
        // payload-oauth2's compiled output re-exports sibling modules
        // without a `.js` extension (e.g. `from "./default-get-token"`),
        // which Node's own ESM resolver refuses. Next's bundler tolerates
        // it (docs/DECISIONS.md §15 covers this exact class of bug for
        // Payload's own CLI), and inlining it here makes Vite resolve it
        // too, instead of handing it to Node as an external module.
        inline: ['payload-oauth2'],
      },
    },
    // The Local API tests hit the real dev database over the network
    // (Neon) — comfortably inside a minute, but well past vitest's 5s
    // default.
    testTimeout: 30_000,
    // Cleaning up a test run's orders one round trip at a time.
    hookTimeout: 60_000,
    env: {
      // Checkout tests run against the mock, which APP_ENV=development permits
      // (src/lib/payment/paymentConfiguration.ts).
      APP_ENV: 'development',
      PAYMENT_PROVIDER: 'mock',
    },
  },
})
