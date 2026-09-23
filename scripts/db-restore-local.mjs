#!/usr/bin/env node
// Rebuilds the local databases from the newest nightly backup, sanitised.
// `npm run db:restore-local`. Both DATABASE_URI (ramhal, dev and build) and
// TEST_DATABASE_URI (ramhal_test, vitest) are overwritten — see
// docs/DECISIONS.md §5 for why local work never touches Neon.
//
// The backup lives in Cloudflare R2 and is read with the read-only BACKUP_S3_*
// credentials from .env. The dump is downloaded into a private temporary
// directory that is removed on exit however the run ends.
//
// What a Neon-made dump needs, and what this does about it, is printed on every
// run. Customer and transaction data is truncated after each restore, in the same
// run, so a copy of the live shop's orders never sits on a laptop.
import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { gunzipSync } from 'node:zlib'

import { GetObjectCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3'

import {
  assertRestorable,
  findCustomerDataTables,
  findExtensionsInDump,
  findRolesNamedByDump,
  parseRestoreTarget,
  removeNeonOnlyExtensions,
} from '../src/lib/localRestore.ts'

process.loadEnvFile('.env')

function requireEnv(name) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set. See .env.example.`)
  return value
}

function psql(connectionString, args, { input } = {}) {
  const result = spawnSync('psql', [connectionString, '-v', 'ON_ERROR_STOP=1', '-X', ...args], { encoding: 'utf8', input })
  if (result.error) throw new Error(`Could not run psql (${result.error.message}). Install PostgreSQL 18; see README.`)
  if (result.status !== 0) throw new Error(`psql failed:\n${result.stderr}`)
  return result.stdout
}

const query = (connectionString, sql) =>
  psql(connectionString, ['-At', '-F', '\t', '-c', sql])
    .split('\n')
    .filter(Boolean)
    .map((line) => line.split('\t'))

const targets = [
  { variable: 'DATABASE_URI', connectionString: requireEnv('DATABASE_URI') },
  { variable: 'TEST_DATABASE_URI', connectionString: requireEnv('TEST_DATABASE_URI') },
]

// Every target is checked and printed before anything is dropped.
for (const target of targets) {
  const parsed = parseRestoreTarget(target.connectionString)
  console.log(`${target.variable} -> host ${parsed.host}, port ${parsed.port}, database ${parsed.database}`)
  assertRestorable(parsed)
}

const workDirectory = mkdtempSync(path.join(tmpdir(), 'ramhal-restore-'))
const removeWorkDirectory = () => rmSync(workDirectory, { recursive: true, force: true })
process.on('exit', removeWorkDirectory)
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => process.exit(1))

const storage = new S3Client({
  endpoint: requireEnv('BACKUP_S3_ENDPOINT'),
  region: requireEnv('BACKUP_S3_REGION'),
  forcePathStyle: true,
  credentials: { accessKeyId: requireEnv('BACKUP_S3_ACCESS_KEY_ID'), secretAccessKey: requireEnv('BACKUP_S3_SECRET_ACCESS_KEY') },
})
const bucket = requireEnv('BACKUP_S3_BUCKET')

const listing = await storage.send(new ListObjectsV2Command({ Bucket: bucket }))
const newest = (listing.Contents ?? []).sort((a, b) => a.LastModified - b.LastModified).at(-1)
if (!newest?.Key) throw new Error(`No dump found in the ${bucket} bucket.`)
const ageHours = ((Date.now() - newest.LastModified.getTime()) / 3_600_000).toFixed(1)
console.log(`Newest dump: ${newest.Key} (${ageHours} hours old)`)

const download = await storage.send(new GetObjectCommand({ Bucket: bucket, Key: newest.Key }))
const dump = gunzipSync(Buffer.from(await download.Body.transformToByteArray())).toString('utf8')

const roles = findRolesNamedByDump(dump)
const { sql: restorableSql, removed: removedExtensions } = removeNeonOnlyExtensions(dump)
const keptExtensions = findExtensionsInDump(restorableSql)
console.log(`Roles the dump names, created if missing: ${roles.join(', ') || 'none'}`)
console.log(`Neon-only extensions removed: ${removedExtensions.join(', ') || 'none'}`)
console.log(`Other extensions left in: ${keptExtensions.join(', ') || 'none'}`)

const dumpFile = path.join(workDirectory, 'dump.sql')
writeFileSync(dumpFile, restorableSql, { mode: 0o600 })

for (const target of targets) {
  const { connectionString, variable } = target
  console.log(`\n== ${variable}: restoring ==`)

  for (const role of roles) {
    // Cluster-wide, so it may already exist from the other target or an earlier run.
    psql(connectionString, [
      '-c',
      `DO $$ BEGIN IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${role}') THEN CREATE ROLE "${role}" NOLOGIN; END IF; END $$;`,
    ])
  }
  psql(connectionString, ['-c', 'DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;'])
  psql(connectionString, ['-q', '-f', dumpFile])

  const existingTables = query(connectionString, "SELECT tablename FROM pg_tables WHERE schemaname = 'public'").map(([name]) => name)
  const foreignKeys = query(
    connectionString,
    `SELECT child.relname, parent.relname FROM pg_constraint c
       JOIN pg_class child ON child.oid = c.conrelid
       JOIN pg_class parent ON parent.oid = c.confrelid
       JOIN pg_namespace n ON n.oid = child.relnamespace
      WHERE c.contype = 'f' AND n.nspname = 'public'`,
  ).map(([childTable, parentTable]) => ({ childTable, parentTable }))
  const sanitisedTables = findCustomerDataTables(existingTables, foreignKeys)

  // Recorded before the truncate: whether production held real customers at all.
  const orderSummary = query(
    connectionString,
    `SELECT count(*), count(*) FILTER (WHERE provider <> 'mock'), count(*) FILTER (WHERE customer_email NOT LIKE '%@example.%') FROM orders`,
  )[0]
  console.log(`Production orders in the dump: ${orderSummary[0]} total, ${orderSummary[1]} from a real payment provider, ${orderSummary[2]} with a non-example email`)

  const quoted = sanitisedTables.map((table) => `"${table}"`).join(', ')
  psql(connectionString, ['-c', `TRUNCATE ${quoted} RESTART IDENTITY`])
  const remaining = sanitisedTables.map((table) => [table, query(connectionString, `SELECT count(*) FROM "${table}"`)[0][0]])
  console.log(`Sanitised (truncated) tables: ${remaining.map(([table, count]) => `${table}=${count}`).join(', ')}`)
  console.log(`Admin users kept: ${query(connectionString, 'SELECT count(*) FROM users')[0][0]}`)
}

console.log('\nDone. The temporary dump is removed on exit.')
