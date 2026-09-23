#!/usr/bin/env vite-node
// One-time initialisation of the institute's social links for TASK-41.
//
// Runs against whichever database DATABASE_URI identifies and refuses every
// database except the audited development and production branches. It writes
// only when the array is empty; existing editor-owned values are left alone
// by aborting rather than guessing which account is authoritative.

import { randomUUID } from 'node:crypto'

import pg from 'pg'

import { parseDatabaseIdentity } from '../../src/lib/diagnostics.ts'
import { DEFAULT_SOCIAL_LINKS } from '../../src/lib/socialLinks.ts'

const EXPECTED_DATABASES: Record<string, string> = {
  '2c951382a7f8': 'production',
  d82df7fce6e7: 'development',
}

function fail(message: string): never {
  throw new Error(`TASK-41 refused to proceed: ${message}`)
}

const connectionString = process.env.DATABASE_URI
if (!connectionString) fail('DATABASE_URI is not set')

const identity = parseDatabaseIdentity(connectionString)
const environment = EXPECTED_DATABASES[identity.fingerprint]
if (!environment) fail(`unrecognised database fingerprint ${identity.fingerprint}`)

const client = new pg.Client({ connectionString })
await client.connect()

try {
  await client.query('begin')
  await client.query('lock table site_settings, site_settings_social_links in share row exclusive mode')

  const settings = await client.query<{ id: number }>('select id from site_settings order by id')
  if (settings.rowCount !== 1) fail(`expected one site_settings row on ${environment}, found ${settings.rowCount}`)

  const parentId = settings.rows[0].id
  const existing = await client.query<{ platform: string; url: string }>(
    'select platform, url from site_settings_social_links where _parent_id = $1 order by _order',
    [parentId],
  )

  if (existing.rows.length > 0) {
    if (JSON.stringify(existing.rows) !== JSON.stringify(DEFAULT_SOCIAL_LINKS)) {
      fail(`social links on ${environment} are not empty and differ from TASK-41 defaults`)
    }
  } else {
    for (const [order, link] of DEFAULT_SOCIAL_LINKS.entries()) {
      await client.query(
        `insert into site_settings_social_links (_order, _parent_id, id, platform, url)
         values ($1, $2, $3, $4, $5)`,
        [order + 1, parentId, randomUUID(), link.platform, link.url],
      )
    }
    await client.query('update site_settings set updated_at = now() where id = $1', [parentId])
  }

  const persisted = await client.query<{ platform: string; url: string }>(
    'select platform, url from site_settings_social_links where _parent_id = $1 order by _order',
    [parentId],
  )
  if (JSON.stringify(persisted.rows) !== JSON.stringify(DEFAULT_SOCIAL_LINKS)) {
    fail(`final social links on ${environment} do not match TASK-41 defaults`)
  }

  await client.query('commit')
  console.log(JSON.stringify({ environment, fingerprint: identity.fingerprint, socialLinks: persisted.rows }, null, 2))
} catch (error) {
  await client.query('rollback')
  throw error
} finally {
  await client.end()
}
