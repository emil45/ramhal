#!/usr/bin/env node
// Imports the reconciled legacy catalogue directly through Payload's Local API.
// This is deliberately a local command, not an HTTP route: the 124-book import
// is a migration operation and must never ship as an application endpoint.
import { readFile } from 'node:fs/promises'

import { getPayload } from 'payload'

import { importBooks } from '../src/importBooks.ts'
import config from '../src/payload.config.ts'

try {
  process.loadEnvFile('.env')
} catch {
  // CI or an operator can provide the variables through the process environment.
}

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
