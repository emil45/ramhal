// Repair for scripts/one-off/TASK-50-book-cover-photos.ts, which on its production
// run created every Media row and linked it to its book, but stored only the first
// file (adir-bamarom-front-1.webp) in R2: the other 14 rows pointed at objects that
// did not exist, so the books showed broken covers. Why only one upload landed was
// not established. This puts the missing objects there — each row's main file and
// the sized copies its row names — and then checks that every object answers.
//
// Run once with the same environment as the original script, plus the folder:
//
//   DATABASE_URI="<production>" S3_BUCKET=… S3_ENDPOINT=… S3_ACCESS_KEY_ID=… S3_SECRET_ACCESS_KEY=… \
//     S3_PUBLIC_URL=… node scripts/one-off/TASK-50-upload-missing-cover-files.mjs ~/Downloads/ramhal-covers
//
// A row's file is found by its filename without the "-1" Payload appended when the
// name already existed on the machine that ran the original script. Sized copies
// are resized with sharp to the widths in the row's own sized filenames, and the
// resulting height must match the one in that filename.
import { HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

import pg from 'pg'
import sharp from 'sharp'

const SIZE_COLUMNS = ['sizes_thumbnail_filename', 'sizes_card_filename', 'sizes_full_filename']
const COVER_FILENAME = /^(adir-bamarom|igrot-ramhal|machzor-kippur-white-set|melech-haolam|tikoun-olam|machzor-rosh-hashanah|gilui-malchuto)-.*\.webp$|^(adir-bamarom|igrot-ramhal|machzor-kippur-white-set|melech-haolam|tikoun-olam|machzor-rosh-hashanah|gilui-malchuto)\.webp$/

function requireEnv(name) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not set`)
  return value
}

const folder = process.argv[2]
if (!folder) throw new Error('usage: TASK-50-upload-missing-cover-files.mjs <folder with the WebP files>')

const client = new S3Client({
  endpoint: requireEnv('S3_ENDPOINT'),
  region: 'auto',
  forcePathStyle: true,
  credentials: { accessKeyId: requireEnv('S3_ACCESS_KEY_ID'), secretAccessKey: requireEnv('S3_SECRET_ACCESS_KEY') },
})
const bucket = requireEnv('S3_BUCKET')
const publicUrl = requireEnv('S3_PUBLIC_URL').replace(/\/$/, '')

async function exists(key) {
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }))
    return true
  } catch (error) {
    if (error.name === 'NotFound') return false
    throw error
  }
}

async function put(key, body) {
  await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: 'image/webp' }))
  console.log(`put    ${key}`)
}

const database = new pg.Client({ connectionString: requireEnv('DATABASE_URI') })
await database.connect()
const { rows } = await database.query(`SELECT id, filename, ${SIZE_COLUMNS.join(', ')} FROM media WHERE filename ~ '\\.webp$' ORDER BY id`)
await database.end()

const checked = []
for (const row of rows.filter((candidate) => COVER_FILENAME.test(candidate.filename))) {
  const sourceName = row.filename.replace(/-1\.webp$/, '.webp')
  const source = await readFile(path.resolve(folder, sourceName))

  if (!(await exists(row.filename))) await put(row.filename, source)
  checked.push(row.filename)

  for (const column of SIZE_COLUMNS) {
    const sizedFilename = row[column]
    if (!sizedFilename) continue
    checked.push(sizedFilename)
    if (await exists(sizedFilename)) continue
    const [, width, height] = sizedFilename.match(/-(\d+)x(\d+)\.webp$/)
    const resized = await sharp(source).resize({ width: Number(width) }).webp().toBuffer({ resolveWithObject: true })
    if (resized.info.height !== Number(height)) throw new Error(`${sizedFilename}: resized to ${resized.info.width}x${resized.info.height}`)
    await put(sizedFilename, resized.data)
  }
}

for (const key of checked) {
  const response = await fetch(`${publicUrl}/${key}`, { method: 'HEAD' })
  if (!response.ok) throw new Error(`${key}: ${response.status} from the public URL`)
}
console.log(`verified ${checked.length} objects answer on ${publicUrl}`)
