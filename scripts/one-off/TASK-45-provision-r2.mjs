// Provisions the two R2 buckets and the three bucket-scoped API tokens that
// replace Neon Object Storage (docs/DECISIONS.md §5). Idempotent: anything that
// already exists is reused and reported as "found". Run once with the admin
// Cloudflare token in CLOUDFLARE_API_TOKEN; that token is used here and nowhere
// else. Minted credentials are written to the file named by CREDENTIALS_FILE
// (mode 600), never printed.
//
//   CREDENTIALS_FILE=/path/outside/repo.json node scripts/one-off/TASK-45-provision-r2.mjs
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

process.loadEnvFile('.env')

const API = 'https://api.cloudflare.com/client/v4'
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
const adminToken = process.env.CLOUDFLARE_API_TOKEN
const credentialsFile = process.env.CREDENTIALS_FILE
if (!accountId || !adminToken || !credentialsFile) throw new Error('CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN and CREDENTIALS_FILE are required')

const MEDIA_BUCKET = 'ramhal-media'
const BACKUP_BUCKET = 'ramhal-backups'
const corsPolicy = JSON.parse(readFileSync(fileURLToPath(new URL('../../infrastructure/r2/media-bucket-cors.json', import.meta.url)), 'utf8'))

const TOKENS = [
  { name: 'ramhal-media-rw', bucket: MEDIA_BUCKET, permission: 'Workers R2 Storage Bucket Item Write' },
  { name: 'ramhal-backup-rw', bucket: BACKUP_BUCKET, permission: 'Workers R2 Storage Bucket Item Write' },
  { name: 'ramhal-backup-ro', bucket: BACKUP_BUCKET, permission: 'Workers R2 Storage Bucket Item Read' },
]

async function call(method, path, body) {
  const response = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const json = await response.json()
  if (!json.success) throw new Error(`${method} ${path}: ${JSON.stringify(json.errors)}`)
  return json.result
}

const report = []

async function ensureBucket(name) {
  const { buckets } = await call('GET', `/accounts/${accountId}/r2/buckets`)
  if (buckets.some((bucket) => bucket.name === name)) return report.push(`bucket ${name}: found`)
  await call('POST', `/accounts/${accountId}/r2/buckets`, { name, storageClass: 'Standard' })
  report.push(`bucket ${name}: created (Standard)`)
}

await ensureBucket(MEDIA_BUCKET)
await ensureBucket(BACKUP_BUCKET)

const publicDomain = await call('PUT', `/accounts/${accountId}/r2/buckets/${MEDIA_BUCKET}/domains/managed`, { enabled: true })
report.push(`bucket ${MEDIA_BUCKET}: r2.dev public access on (${publicDomain.domain})`)

await call('PUT', `/accounts/${accountId}/r2/buckets/${MEDIA_BUCKET}/cors`, corsPolicy)
report.push(`bucket ${MEDIA_BUCKET}: CORS applied from infrastructure/r2/media-bucket-cors.json`)

const permissionGroups = await call('GET', '/user/tokens/permission_groups')
const existingTokens = await call('GET', '/user/tokens')
const credentials = existsSync(credentialsFile) ? JSON.parse(readFileSync(credentialsFile, 'utf8')) : {}

for (const { name, bucket, permission } of TOKENS) {
  const group = permissionGroups.find((candidate) => candidate.name === permission)
  if (!group) throw new Error(`Permission group not found: ${permission}`)

  const existing = existingTokens.find((token) => token.name === name)
  let tokenId
  let tokenValue
  if (existing && credentials[name]) {
    report.push(`token ${name}: found, credentials already in the credentials file`)
    continue
  }
  if (existing) {
    // A token's value is shown once, at creation. Rolling issues a new value.
    tokenId = existing.id
    tokenValue = await call('PUT', `/user/tokens/${existing.id}/value`, {})
    report.push(`token ${name}: found, value rolled (the old value was not on file)`)
  } else {
    const created = await call('POST', '/user/tokens', {
      name,
      policies: [
        {
          effect: 'allow',
          resources: { [`com.cloudflare.edge.r2.bucket.${accountId}_default_${bucket}`]: '*' },
          permission_groups: [{ id: group.id }],
        },
      ],
    })
    tokenId = created.id
    tokenValue = created.value
    report.push(`token ${name}: created (${permission}, ${bucket} only)`)
  }
  credentials[name] = { accessKeyId: tokenId, secretAccessKey: createHash('sha256').update(tokenValue).digest('hex') }
}

credentials.publicUrl = `https://${publicDomain.domain}`
credentials.endpoint = `https://${accountId}.r2.cloudflarestorage.com`
writeFileSync(credentialsFile, JSON.stringify(credentials, null, 2), { mode: 0o600 })
console.log(report.join('\n'))
