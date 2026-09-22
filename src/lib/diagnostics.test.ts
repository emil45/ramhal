import { describe, expect, it } from 'vitest'

import { buildDiagnostics, computeDatabaseFingerprint, parseDatabaseIdentity, toPublicDiagnostics } from '@/lib/diagnostics'

describe('computeDatabaseFingerprint', () => {
  it('is deterministic for the same host', () => {
    expect(computeDatabaseFingerprint('ep-red-tree-b19ry3lo-pooler.c-5.eu-central-1.aws.neon.tech')).toBe(
      computeDatabaseFingerprint('ep-red-tree-b19ry3lo-pooler.c-5.eu-central-1.aws.neon.tech'),
    )
  })

  it('differs for different hosts', () => {
    expect(computeDatabaseFingerprint('ep-red-tree-b19ry3lo-pooler.c-5.eu-central-1.aws.neon.tech')).not.toBe(
      computeDatabaseFingerprint('ep-orange-bar-b12vlqne-pooler.c-5.eu-central-1.aws.neon.tech'),
    )
  })

  it('never contains the raw host itself', () => {
    const host = 'ep-red-tree-b19ry3lo-pooler.c-5.eu-central-1.aws.neon.tech'
    expect(computeDatabaseFingerprint(host)).not.toContain(host)
  })
})

describe('parseDatabaseIdentity', () => {
  it('reads host, database name, user and a fingerprint, never the password', () => {
    const identity = parseDatabaseIdentity('postgresql://neondb_owner:s3cr3t-pw@ep-red-tree-b19ry3lo-pooler.c-5.eu-central-1.aws.neon.tech/neondb?sslmode=require')

    expect(identity).toEqual({
      host: 'ep-red-tree-b19ry3lo-pooler.c-5.eu-central-1.aws.neon.tech',
      database: 'neondb',
      user: 'neondb_owner',
      fingerprint: computeDatabaseFingerprint('ep-red-tree-b19ry3lo-pooler.c-5.eu-central-1.aws.neon.tech'),
    })
  })

  it('never includes the password anywhere in its output, under any key', () => {
    const identity = parseDatabaseIdentity('postgresql://someuser:the-actual-secret@example.neon.tech/somedb')

    expect(JSON.stringify(identity)).not.toContain('the-actual-secret')
  })

  it('decodes a percent-encoded username', () => {
    expect(parseDatabaseIdentity('postgresql://ne%40user:pw@host/db').user).toBe('ne@user')
  })
})

describe('buildDiagnostics', () => {
  it('assembles the full report and defaults a missing builtForAppEnv to null rather than "undefined"', () => {
    const result = buildDiagnostics({
      appEnv: 'demo',
      backup: null,
      builtForAppEnv: undefined,
      databaseUri: 'postgresql://user:pw@host/db',
      latestMigration: { name: '20260101_000000_initial', appliedAt: '2026-01-01T00:00:00.000Z' },
    })

    expect(result).toEqual({
      appEnv: 'demo',
      backup: null,
      builtForAppEnv: null,
      database: { host: 'host', database: 'db', user: 'user', fingerprint: computeDatabaseFingerprint('host') },
      latestMigration: { name: '20260101_000000_initial', appliedAt: '2026-01-01T00:00:00.000Z' },
    })
  })

  it('never leaks the password through the assembled report either', () => {
    const result = buildDiagnostics({
      appEnv: 'production',
      backup: null,
      builtForAppEnv: 'production',
      databaseUri: 'postgresql://user:the-actual-secret@host/db',
      latestMigration: null,
    })

    expect(JSON.stringify(result)).not.toContain('the-actual-secret')
  })
})

describe('toPublicDiagnostics', () => {
  it('replaces the database identity with the fingerprint alone', () => {
    const full = buildDiagnostics({
      appEnv: 'production',
      backup: null,
      builtForAppEnv: 'production',
      databaseUri: 'postgresql://neondb_owner:s3cr3t@ep-red-tree-b19ry3lo-pooler.c-5.eu-central-1.aws.neon.tech/neondb',
      latestMigration: null,
    })

    const result = toPublicDiagnostics(full)

    expect(result).toEqual({
      appEnv: 'production',
      backup: null,
      builtForAppEnv: 'production',
      database: { fingerprint: full.database.fingerprint },
      latestMigration: null,
    })
  })

  it('never contains the host, database name or user, under any key', () => {
    const full = buildDiagnostics({
      appEnv: 'production',
      backup: null,
      builtForAppEnv: 'production',
      databaseUri: 'postgresql://neondb_owner:s3cr3t@ep-red-tree-b19ry3lo-pooler.c-5.eu-central-1.aws.neon.tech/neondb',
      latestMigration: null,
    })

    const raw = JSON.stringify(toPublicDiagnostics(full))

    expect(raw).not.toContain('ep-red-tree-b19ry3lo-pooler.c-5.eu-central-1.aws.neon.tech')
    expect(raw).not.toContain('neondb_owner')
    expect(JSON.parse(raw).database).toEqual({ fingerprint: full.database.fingerprint })
  })
})
