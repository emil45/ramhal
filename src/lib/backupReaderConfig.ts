export type BackupReaderConfig = {
  accessKeyId: string
  bucket: string
  endpoint: string
  region: string
  secretAccessKey: string
}

const VARIABLE_NAMES = [
  'BACKUP_S3_BUCKET',
  'BACKUP_S3_ENDPOINT',
  'BACKUP_S3_REGION',
  'BACKUP_S3_ACCESS_KEY_ID',
  'BACKUP_S3_SECRET_ACCESS_KEY',
] as const

/**
 * Read-only credentials for GET /api/diagnostics to check the age of the
 * last successful backup (docs/tasks/TASK-27-database-hardening.md §3c) —
 * deliberately a *different*, narrower-scoped credential than the one the
 * nightly GitHub Action writes with (that one is a repo secret, never an
 * application environment variable). All or none, the same pattern as
 * readMediaStorageSettings: unset entirely means "no backup reporting
 * configured" (local development), not an error; half-configured is.
 */
export function readBackupReaderConfig(env: Record<string, string | undefined>): BackupReaderConfig | null {
  const missing = VARIABLE_NAMES.filter((name) => !env[name])
  if (missing.length === VARIABLE_NAMES.length) return null

  if (missing.length > 0) {
    throw new Error(`Backup status reporting is half-configured: ${missing.join(', ')} not set. Set all five BACKUP_S3_* variables or none. See .env.example.`)
  }

  return {
    accessKeyId: env.BACKUP_S3_ACCESS_KEY_ID as string,
    bucket: env.BACKUP_S3_BUCKET as string,
    endpoint: env.BACKUP_S3_ENDPOINT as string,
    region: env.BACKUP_S3_REGION as string,
    secretAccessKey: env.BACKUP_S3_SECRET_ACCESS_KEY as string,
  }
}
