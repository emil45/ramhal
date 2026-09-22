import { describe, expect, it } from 'vitest'

import { readBackupReaderConfig } from '@/lib/backupReaderConfig'

const FULL_ENV = {
  BACKUP_S3_BUCKET: 'ramhal-backups',
  BACKUP_S3_ENDPOINT: 'https://example.storage.neon.tech',
  BACKUP_S3_REGION: 'eu-central-1',
  BACKUP_S3_ACCESS_KEY_ID: 'access-key',
  BACKUP_S3_SECRET_ACCESS_KEY: 'secret-key',
}

describe('readBackupReaderConfig', () => {
  it('returns null when nothing is set — backup reporting is simply not configured', () => {
    expect(readBackupReaderConfig({})).toBeNull()
  })

  it('reads a fully configured reader', () => {
    expect(readBackupReaderConfig(FULL_ENV)).toEqual({
      bucket: 'ramhal-backups',
      endpoint: 'https://example.storage.neon.tech',
      region: 'eu-central-1',
      accessKeyId: 'access-key',
      secretAccessKey: 'secret-key',
    })
  })

  it('refuses a half-configured reader, naming what is missing', () => {
    expect(() => readBackupReaderConfig({ ...FULL_ENV, BACKUP_S3_SECRET_ACCESS_KEY: undefined })).toThrow(/BACKUP_S3_SECRET_ACCESS_KEY/)
  })
})
