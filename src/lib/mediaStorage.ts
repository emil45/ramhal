export type MediaStorageSettings = {
  accessKeyId: string
  bucket: string
  endpoint: string
  publicUrl: string
  region: string
  secretAccessKey: string
}

const VARIABLE_NAMES = ['S3_BUCKET', 'S3_ENDPOINT', 'S3_PUBLIC_URL', 'S3_REGION', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'] as const

/**
 * Where uploaded media lives. Unset, uploads go to the local `media/` folder —
 * right for development, wrong for any host whose disk is wiped on deploy.
 * Set, they go to an S3-compatible bucket (Neon Object Storage for the demo,
 * Cloudflare R2 for the larger archive): the same six variables either way.
 *
 * All or none. A half-configured bucket would fall back to local disk and lose
 * every upload on the next deploy without a word, so it is an error.
 */
export function readMediaStorageSettings(env: Record<string, string | undefined>): MediaStorageSettings | null {
  const { S3_ACCESS_KEY_ID, S3_BUCKET, S3_ENDPOINT, S3_PUBLIC_URL, S3_REGION, S3_SECRET_ACCESS_KEY } = env

  const missing = VARIABLE_NAMES.filter((name) => !env[name])
  if (missing.length === VARIABLE_NAMES.length) return null

  if (!S3_ACCESS_KEY_ID || !S3_BUCKET || !S3_ENDPOINT || !S3_PUBLIC_URL || !S3_REGION || !S3_SECRET_ACCESS_KEY) {
    throw new Error(`Media storage is half-configured: ${missing.join(', ')} not set. Set all six S3_* variables or none. See .env.example.`)
  }

  return {
    accessKeyId: S3_ACCESS_KEY_ID,
    bucket: S3_BUCKET,
    endpoint: S3_ENDPOINT,
    publicUrl: S3_PUBLIC_URL.replace(/\/$/, ''),
    region: S3_REGION,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
  }
}

export function getPublicMediaUrl(publicUrl: string, prefix: string | undefined, filename: string): string {
  const segments = [prefix, filename]
    .filter((segment): segment is string => Boolean(segment))
    .flatMap((segment) => segment.split('/'))
    .filter(Boolean)
    .map(encodeURIComponent)

  return `${publicUrl.replace(/\/$/, '')}/${segments.join('/')}`
}
