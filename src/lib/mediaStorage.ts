export type MediaStorageSettings =
  | {
      access: 'read-write'
      accessKeyId: string
      bucket: string
      endpoint: string
      publicUrl: string
      region: string
      secretAccessKey: string
    }
  | { access: 'read-only'; publicUrl: string }

const VARIABLE_NAMES = ['S3_BUCKET', 'S3_ENDPOINT', 'S3_PUBLIC_URL', 'S3_REGION', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY'] as const

/**
 * Where uploaded media lives. Unset, uploads go to the local `media/` folder —
 * right for development, wrong for any host whose disk is wiped on deploy.
 * Set, they go to an S3-compatible bucket (Cloudflare R2): the same six
 * variables everywhere the bucket is written to.
 *
 * One deliberate exception: `S3_PUBLIC_URL` alone means read-only. Local
 * development then shows the production bucket's files without holding a key
 * that could overwrite or delete them; uploads are refused (assertMediaWritable).
 *
 * Otherwise all or none. A half-configured bucket would fall back to local disk
 * and lose every upload on the next deploy without a word, so it is an error.
 */
export function readMediaStorageSettings(env: Record<string, string | undefined>): MediaStorageSettings | null {
  const { S3_ACCESS_KEY_ID, S3_BUCKET, S3_ENDPOINT, S3_PUBLIC_URL, S3_REGION, S3_SECRET_ACCESS_KEY } = env

  const missing = VARIABLE_NAMES.filter((name) => !env[name])
  if (missing.length === VARIABLE_NAMES.length) return null

  const onlyPublicUrlSet = missing.length === VARIABLE_NAMES.length - 1 && Boolean(S3_PUBLIC_URL)
  if (onlyPublicUrlSet && S3_PUBLIC_URL) return { access: 'read-only', publicUrl: S3_PUBLIC_URL.replace(/\/$/, '') }

  if (!S3_ACCESS_KEY_ID || !S3_BUCKET || !S3_ENDPOINT || !S3_PUBLIC_URL || !S3_REGION || !S3_SECRET_ACCESS_KEY) {
    throw new Error(
      `Media storage is half-configured: ${missing.join(', ')} not set. Set all six S3_* variables, only S3_PUBLIC_URL (read-only), or none. See .env.example.`,
    )
  }

  return {
    access: 'read-write',
    accessKeyId: S3_ACCESS_KEY_ID,
    bucket: S3_BUCKET,
    endpoint: S3_ENDPOINT,
    publicUrl: S3_PUBLIC_URL.replace(/\/$/, ''),
    region: S3_REGION,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
  }
}

export function assertMediaWritable(settings: MediaStorageSettings | null): void {
  if (settings?.access !== 'read-only') return
  throw new Error(
    'Media storage is read-only here: only S3_PUBLIC_URL is set, so this environment shows production\'s files but never changes them. ' +
      'Upload from the deployed admin, or set all six S3_* variables to a bucket of your own.',
  )
}

export function getPublicMediaUrl(publicUrl: string, prefix: string | undefined, filename: string): string {
  const segments = [prefix, filename]
    .filter((segment): segment is string => Boolean(segment))
    .flatMap((segment) => segment.split('/'))
    .filter(Boolean)
    .map(encodeURIComponent)

  return `${publicUrl.replace(/\/$/, '')}/${segments.join('/')}`
}
