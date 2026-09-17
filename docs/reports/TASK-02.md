# TASK-02 — Seeding and the Hebrew-label guard

No brief file exists in `docs/tasks/` for this task. Reconstructed from commit history
(`7690ab5`, `97c7889`), not memory.

## What was built

- Fixed Payload config resolution for the CLI (`payloadcms/payload#16684`): the CLI's nested
  `tsx` worker resolves modules with Node's own ESM algorithm, not Turbopack's, and ignores
  tsconfig `paths`. Every relative import inside the Payload config graph
  (`payload.config.ts` and the collections/globals it pulls in) was converted from the `@/`
  alias to explicit relative, `.ts`-extensioned imports, and `allowImportingTsExtensions` was
  enabled.
- Seeding wired through Payload's `onInit` hook rather than the CLI, since the CLI remained
  broken for this dependency graph for two further, independent reasons documented directly in
  `scripts/seed.ts`.
- `collectMissingHebrewLabels`: walks a field tree (recursing into arrays, groups, rows, tabs)
  and reports any data-bearing field, or array, missing a Hebrew label. Unit-tested against a
  synthetic field tree; `hebrewLabels.test.ts` runs it against every real collection and global.

## What was verified and how

- The two further CLI-breaking causes were confirmed, not assumed: `@payloadcms/richtext-lexical`
  pulls in `lexical`, whose `*.node.mjs` entry files do a top-level `await import(...)` — Node
  refuses to `require()` an ESM graph containing top-level await, confirmed with
  `node --experimental-print-required-tla`. Separately, `@payloadcms/db-postgres` imports
  `loadEnv` from `payload/node`, which does `import nextEnvImport from '@next/env'` (a
  CommonJS package); that resolves under Next's bundler but resolves to `undefined` under tsx's
  CJS/ESM interop. Both reproduced identically on Node 22.23.2 and Node 24.12.0, ruling out the
  tsx/Node version issue from TASK-01 as the cause.
- The Hebrew-label guard is enforced by test (`hebrewLabels.test.ts`), not by manual review —
  the rationale being one Hebrew-speaking admin persona, so every editor-facing label must be
  Hebrew.

## What felt wrong

- The CLI resolution bug required three independent root causes to be found and worked around
  (module resolution, top-level await, CJS/ESM interop) before seeding could work at all — none
  fixable from this codebase alone; all are working around upstream Payload/tsx behaviour.

## What is still open

- `migrate:create`/`generate:types` were still not usable via the CLI after this task — carried
  into the next task, which routes migrations through a Next.js route handler instead.
