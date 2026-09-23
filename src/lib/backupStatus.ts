import 'server-only'

import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3'

import type { BackupReaderConfig } from '@/lib/backupReaderConfig'
import type { BackupStatus } from '@/lib/diagnostics'

/** Pure: which of the bucket's objects is newest, and how long ago that
 * was — split out from the S3 call itself so this arithmetic is testable
 * without a real (or mocked) bucket. */
export function backupStatusFromObjects(lastModifiedDates: readonly Date[], now: Date): BackupStatus {
  if (lastModifiedDates.length === 0) return { error: 'No backups found in the bucket.' }

  const newest = lastModifiedDates.reduce((latest, date) => (date > latest ? date : latest))
  const ageHours = Math.round(((now.getTime() - newest.getTime()) / (1000 * 60 * 60)) * 10) / 10

  return { lastSuccessAt: newest.toISOString(), ageHours }
}

/**
 * The most recently modified object in the backup bucket, reported as an
 * age rather than left for the caller to compute — GET /api/diagnostics
 * exists so "are backups running" is answerable in one request, not one
 * request plus arithmetic. Never throws: an unreachable bucket or a
 * misconfigured credential is exactly the kind of thing this route exists
 * to surface, not hide behind a 500.
 */
export async function getBackupStatus(config: BackupReaderConfig | null): Promise<BackupStatus> {
  if (!config) return null

  const client = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
    forcePathStyle: true,
  })

  try {
    const result = await client.send(new ListObjectsV2Command({ Bucket: config.bucket }))
    const lastModifiedDates = (result.Contents ?? []).flatMap((object) => (object.LastModified ? [object.LastModified] : []))
    return backupStatusFromObjects(lastModifiedDates, new Date())
  } catch (error) {
    // GET /api/diagnostics is public — the underlying error (from the AWS
    // SDK) can otherwise contain the endpoint or bucket name, which the rest
    // of this route deliberately never exposes to an anonymous caller
    // (docs/DECISIONS.md §11). Logged so an operator can still see it.
    console.error('Backup status check failed:', error)
    return { error: 'Could not read the backup bucket.' }
  }
}
