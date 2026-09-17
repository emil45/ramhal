// Standalone seed runner — the conventional Payload pattern, run via
// `npm run seed` (`payload run scripts/seed.ts`).
//
// In THIS environment (Payload 3.89 + Next 16.3.4 + Node's native module
// loader), running any Payload CLI command that loads src/payload.config.ts
// outside Next's own bundler currently fails — two independent, verified
// upstream incompatibilities, neither fixed by pinning Node or tsx:
//
// 1. `@payloadcms/richtext-lexical`'s dependency tree includes `lexical`,
//    whose `*.node.mjs` entry files each do a top-level `await import(...)`
//    to pick a dev/prod build. Node refuses to `require()` any ESM graph
//    containing top-level await (ERR_REQUIRE_ASYNC_MODULE) — confirmed with
//    `node --experimental-print-required-tla`.
// 2. `@payloadcms/db-postgres` imports `loadEnv` from `payload/node`, which
//    does `import nextEnvImport from '@next/env'` — a plain CommonJS
//    package. Under Next's own bundler this resolves fine; under tsx's
//    CJS/ESM interop it resolves to `undefined`, crashing on
//    `const { loadEnvConfig } = nextEnvImport`.
//
// Both are toolchain-level bugs in the Payload/tsx/Next combination, not in
// this repo. Until they are fixed upstream, the same seed logic runs on
// every app boot via `onInit` in payload.config.ts, which goes through
// Next's bundler and is unaffected — see that file for the verified path.
import { getPayload } from 'payload'

import config from '../src/payload.config.ts'
import { seed } from '../src/seed.ts'

const payload = await getPayload({ config })
await seed(payload)
await payload.destroy()
