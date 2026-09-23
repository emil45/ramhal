#!/usr/bin/env node
// Imports the reconciled legacy catalogue directly through Payload's Local API.
// This is deliberately a local command, not an HTTP route: the 124-book import
// is a migration operation and must never ship as an application endpoint.
//
// Run through vite-node (npm run import:books), not plain node: loading
// src/payload.config.ts pulls in payload-oauth2, whose compiled output
// re-exports sibling modules without a `.js` extension — Node's own ESM
// resolver refuses that, the same class of bug docs/DECISIONS.md §15
// documents for Payload's own CLI. vitest.config.ts already tells Vite to
// inline and resolve the package itself instead of externalising it to Node
// (`test.server.deps.inline`); `-c vitest.config.ts` reuses that same config
// (its `resolve.alias` besides) instead of inventing a second one, and
// `--options.deps.inline=payload-oauth2` repeats the setting directly —
// needed because a dynamically-imported config graph (see
// scripts/one-off/TASK-42-narrative-page-images.mjs) doesn't pick up
// `test.server.deps`, only vite-node's own server-level `deps.inline` option.
import { readFile } from 'node:fs/promises'

import { getPayload } from 'payload'

import { parseDatabaseIdentity } from '../src/lib/diagnostics.ts'
import { importBooks } from '../src/importBooks.ts'
import config from '../src/payload.config.ts'

try {
  process.loadEnvFile('.env')
} catch {
  // CI or an operator can provide the variables through the process environment.
}

// This script writes to whichever database DATABASE_URI names — vite-node
// does not run vitest.config.ts's setupFiles (that is a Vitest-runner
// concept, not a vite-node one), so there is no automatic redirect to the
// testing branch and no guard against DATABASE_URI pointing at production.
// Printed before any write so an operator can still stop it.
console.log(`Target database fingerprint: ${parseDatabaseIdentity(process.env.DATABASE_URI ?? '').fingerprint}`)

const reconciliation = JSON.parse(
  await readFile(new URL('./scrape/out/reconciliation.json', import.meta.url), 'utf8'),
)
const payload = await getPayload({ config })

try {
  const summary = await importBooks(payload, reconciliation)
  console.log(JSON.stringify(summary, null, 2))
} finally {
  await payload.destroy()
}

// Payload's Postgres adapter retains a reconnect client. Its own CLI exits
// explicitly after destroy for the same reason.
process.exit(0)
