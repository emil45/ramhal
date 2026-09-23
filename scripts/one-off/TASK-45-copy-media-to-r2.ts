// Copies Neon Object Storage into Cloudflare R2 with identical keys, then
// verifies the copy. Run once per bucket (docs/RECOVERY.md, "Running a one-off
// script"), with credentials only in that command's environment:
//
//   media:   MEDIA_SOURCE_S3_{ENDPOINT,REGION,BUCKET,ACCESS_KEY_ID,SECRET_ACCESS_KEY}
//            R2_MEDIA_WRITE_{ENDPOINT,REGION,BUCKET,ACCESS_KEY_ID,SECRET_ACCESS_KEY}
//            npx vite-node scripts/one-off/TASK-45-copy-media-to-r2.ts media
//
//   backup:  the same with BACKUP_SOURCE_S3_* and R2_BACKUP_WRITE_*; copies only
//            the newest dump, because older ones age out of retention anyway.
//            npx vite-node scripts/one-off/TASK-45-copy-media-to-r2.ts backup
//
// The source is read once. Each object is hashed while it is read, written to R2
// with its Content-Type, Cache-Control and Content-Disposition, then read back
// from R2 (R2 egress is free) and compared. A key is skipped when the
// destination already has the same size and MD5 ETag, which makes a re-run
// cheap and safe.
import { createHash } from 'node:crypto'

import { GetObjectCommand, HeadObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import type { _Object } from '@aws-sdk/client-s3'

type Mode = 'media' | 'backup'

const ENVIRONMENT_PREFIXES: Record<Mode, { source: string; destination: string }> = {
  media: { source: 'MEDIA_SOURCE_S3', destination: 'R2_MEDIA_WRITE' },
  backup: { source: 'BACKUP_SOURCE_S3', destination: 'R2_BACKUP_WRITE' },
}

type Location = { bucket: string; client: S3Client }

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set`)
  return value
}

function connect(prefix: string): Location {
  return {
    bucket: requireEnv(`${prefix}_BUCKET`),
    client: new S3Client({
      endpoint: requireEnv(`${prefix}_ENDPOINT`),
      region: requireEnv(`${prefix}_REGION`),
      forcePathStyle: true,
      credentials: { accessKeyId: requireEnv(`${prefix}_ACCESS_KEY_ID`), secretAccessKey: requireEnv(`${prefix}_SECRET_ACCESS_KEY`) },
    }),
  }
}

async function listAll({ bucket, client }: Location): Promise<_Object[]> {
  const objects: _Object[] = []
  let continuationToken: string | undefined
  do {
    const page = await client.send(new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: continuationToken }))
    objects.push(...(page.Contents ?? []))
    continuationToken = page.NextContinuationToken
  } while (continuationToken)
  return objects
}

async function readObject({ bucket, client }: Location, key: string) {
  const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
  if (!response.Body) throw new Error(`${key}: empty response body`)
  const body = Buffer.from(await response.Body.transformToByteArray())
  return {
    body,
    contentType: response.ContentType,
    cacheControl: response.CacheControl,
    contentDisposition: response.ContentDisposition,
    sha256: createHash('sha256').update(body).digest('hex'),
    md5: createHash('md5').update(body).digest('hex'),
  }
}

const stripQuotes = (etag: string | undefined) => etag?.replaceAll('"', '')

async function destinationAlreadyMatches({ bucket, client }: Location, source: _Object): Promise<boolean> {
  if (!source.Key) throw new Error('Source listing returned an object without a key')
  try {
    const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: source.Key }))
    return head.ContentLength === source.Size && stripQuotes(head.ETag) === stripQuotes(source.ETag)
  } catch (error) {
    if (error instanceof Error && error.name === 'NotFound') return false
    throw error
  }
}

async function main() {
  const mode = process.argv[2]
  if (mode !== 'media' && mode !== 'backup') throw new Error('Usage: TASK-45-copy-media-to-r2.ts media|backup')
  const source = connect(ENVIRONMENT_PREFIXES[mode].source)
  const destination = connect(ENVIRONMENT_PREFIXES[mode].destination)

  const allSourceObjects = await listAll(source)
  const sourceObjects =
    mode === 'backup' ? allSourceObjects.sort((a, b) => (a.LastModified?.getTime() ?? 0) - (b.LastModified?.getTime() ?? 0)).slice(-1) : allSourceObjects
  console.log(`source ${source.bucket}: ${sourceObjects.length} object(s) to copy`)

  const sourceSha256ByKey = new Map<string, string>()
  let copied = 0
  let skipped = 0
  for (const object of sourceObjects) {
    const key = object.Key
    if (!key) throw new Error('Source listing returned an object without a key')
    if (await destinationAlreadyMatches(destination, object)) {
      skipped += 1
      continue
    }
    const read = await readObject(source, key)
    sourceSha256ByKey.set(key, read.sha256)
    await destination.client.send(
      new PutObjectCommand({
        Bucket: destination.bucket,
        Key: key,
        Body: read.body,
        ContentType: read.contentType,
        CacheControl: read.cacheControl,
        ContentDisposition: read.contentDisposition,
      }),
    )
    copied += 1
  }
  console.log(`copied ${copied}, skipped ${skipped} already identical`)

  // Verification: the destination's key set, then every object's size,
  // Content-Type and content hash, read back from R2 (free egress).
  const destinationObjects = await listAll(destination)
  const sourceKeys = new Set(sourceObjects.map((object) => object.Key))
  const destinationKeys = new Set(destinationObjects.map((object) => object.Key))
  const failures: string[] = []
  if (mode === 'media') {
    for (const key of sourceKeys) if (!destinationKeys.has(key)) failures.push(`missing in destination: ${key}`)
    for (const key of destinationKeys) if (!sourceKeys.has(key)) failures.push(`extra in destination: ${key}`)
  } else {
    for (const key of sourceKeys) if (!destinationKeys.has(key)) failures.push(`missing in destination: ${key}`)
  }

  for (const object of sourceObjects) {
    const key = object.Key
    if (!key) continue
    const sourceHead = await source.client.send(new HeadObjectCommand({ Bucket: source.bucket, Key: key }))
    const destinationRead = await readObject(destination, key)
    const expectedSha256 = sourceSha256ByKey.get(key)
    if (destinationRead.body.length !== object.Size) failures.push(`${key}: size ${destinationRead.body.length} != ${object.Size}`)
    if (destinationRead.contentType !== sourceHead.ContentType) failures.push(`${key}: Content-Type ${destinationRead.contentType} != ${sourceHead.ContentType}`)
    if (expectedSha256 !== undefined && destinationRead.sha256 !== expectedSha256) failures.push(`${key}: SHA-256 mismatch`)
    if (expectedSha256 === undefined && destinationRead.md5 !== stripQuotes(object.ETag)) failures.push(`${key}: MD5 differs from the source ETag`)
    console.log(`${key}  ${destinationRead.body.length} bytes  ${destinationRead.contentType}  sha256 ${destinationRead.sha256.slice(0, 12)}…`)
  }

  if (failures.length > 0) {
    console.error(`VERIFICATION FAILED:\n${failures.join('\n')}`)
    process.exit(1)
  }
  console.log(`VERIFIED: ${sourceObjects.length} object(s), keys, sizes, Content-Types and hashes match`)
}

await main()
