// Tests each platform credential in .env with the cheapest read-only call the platform offers.
// Prints one line per platform and exits non-zero if a configured credential is refused.
import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3'

process.loadEnvFile('.env')

const NEON_API = 'https://console.neon.tech/api/v2'
const VERCEL_API = 'https://api.vercel.com'
const CLOUDFLARE_API = 'https://api.cloudflare.com/client/v4'

async function httpStatus(url, token) {
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  return response.ok ? 'ok' : `refused (HTTP ${response.status})`
}

async function checkNeon({ NEON_API_KEY, NEON_PROJECT_ID }) {
  return httpStatus(`${NEON_API}/projects/${NEON_PROJECT_ID}`, NEON_API_KEY)
}

async function checkVercel({ VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID }) {
  return httpStatus(`${VERCEL_API}/v9/projects/${VERCEL_PROJECT_ID}?teamId=${VERCEL_ORG_ID}`, VERCEL_TOKEN)
}

async function checkCloudflare({ CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID }) {
  const accountToken = await httpStatus(`${CLOUDFLARE_API}/accounts/${CLOUDFLARE_ACCOUNT_ID}/tokens/verify`, CLOUDFLARE_API_TOKEN)
  return accountToken === 'ok' ? accountToken : httpStatus(`${CLOUDFLARE_API}/user/tokens/verify`, CLOUDFLARE_API_TOKEN)
}

const MEDIA_BUCKET = 'ramhal-media'

async function checkMediaBucket({ CLOUDFLARE_ACCOUNT_ID, R2_MEDIA_WRITE_ACCESS_KEY_ID, R2_MEDIA_WRITE_SECRET_ACCESS_KEY }) {
  const client = new S3Client({
    endpoint: `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    region: 'auto',
    credentials: { accessKeyId: R2_MEDIA_WRITE_ACCESS_KEY_ID, secretAccessKey: R2_MEDIA_WRITE_SECRET_ACCESS_KEY },
  })
  try {
    await client.send(new HeadBucketCommand({ Bucket: MEDIA_BUCKET }))
    return 'ok'
  } catch (error) {
    return `refused (${error.name})`
  }
}

const platforms = [
  { name: 'Neon', variables: ['NEON_API_KEY', 'NEON_PROJECT_ID'], check: checkNeon },
  { name: 'Vercel', variables: ['VERCEL_TOKEN', 'VERCEL_ORG_ID', 'VERCEL_PROJECT_ID'], check: checkVercel },
  { name: 'Cloudflare', variables: ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID'], check: checkCloudflare },
  { name: 'R2 media', variables: ['CLOUDFLARE_ACCOUNT_ID', 'R2_MEDIA_WRITE_ACCESS_KEY_ID', 'R2_MEDIA_WRITE_SECRET_ACCESS_KEY'], check: checkMediaBucket },
]

let anyRefused = false
for (const { name, variables, check } of platforms) {
  const missing = variables.filter((variable) => !process.env[variable])
  const result = missing.length > 0 ? `not configured (missing ${missing.join(', ')})` : await check(process.env)
  if (result.startsWith('refused')) anyRefused = true
  console.log(`${name.padEnd(11)} ${result}`)
}
process.exit(anyRefused ? 1 : 0)
