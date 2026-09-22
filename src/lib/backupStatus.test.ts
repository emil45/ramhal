import { describe, expect, it, vi } from 'vitest'

import { backupStatusFromObjects, getBackupStatus } from '@/lib/backupStatus'

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn().mockImplementation(() => ({
    send: vi.fn().mockRejectedValue(new Error('getaddrinfo ENOTFOUND br-secret-endpoint.storage.example.neon.tech')),
  })),
  ListObjectsV2Command: vi.fn(),
}))

describe('backupStatusFromObjects', () => {
  it('reports an error rather than a status when the bucket is empty', () => {
    expect(backupStatusFromObjects([], new Date())).toEqual({ error: 'No backups found in the bucket.' })
  })

  it('picks the newest object when several exist', () => {
    const now = new Date('2026-01-10T12:00:00.000Z')
    const dates = [new Date('2026-01-08T02:00:00.000Z'), new Date('2026-01-09T02:00:00.000Z'), new Date('2026-01-07T02:00:00.000Z')]

    expect(backupStatusFromObjects(dates, now)).toMatchObject({ lastSuccessAt: '2026-01-09T02:00:00.000Z' })
  })

  it('computes age in hours, to one decimal place', () => {
    const now = new Date('2026-01-10T12:00:00.000Z')
    const dates = [new Date('2026-01-10T00:00:00.000Z')] // exactly 12 hours earlier

    expect(backupStatusFromObjects(dates, now)).toEqual({ lastSuccessAt: '2026-01-10T00:00:00.000Z', ageHours: 12 })
  })

  it('reports a fractional age rather than rounding away a genuinely stale backup', () => {
    const now = new Date('2026-01-10T12:30:00.000Z')
    const dates = [new Date('2026-01-10T00:00:00.000Z')] // 12.5 hours earlier

    expect(backupStatusFromObjects(dates, now)).toMatchObject({ ageHours: 12.5 })
  })
})

describe('getBackupStatus', () => {
  it('reports a generic error rather than the underlying SDK message, which can name the endpoint or bucket', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    const status = await getBackupStatus({
      accessKeyId: 'id',
      bucket: 'ramhal-backups',
      endpoint: 'https://br-secret-endpoint.storage.example.neon.tech',
      region: 'eu-central-1',
      secretAccessKey: 'secret',
    })

    expect(status).toEqual({ error: 'Could not read the backup bucket.' })
    consoleError.mockRestore()
  })
})
