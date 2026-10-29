// Sets one image file as the cover of one book. Same environment and run procedure as
// TASK-50-book-cover-photos.ts; one file per process (see TASK-53-zohar-boxed-set-gallery.ts),
// read back from the public URL afterwards. A book that already has a cover is refused
// unless `replace` is given; the old file stays in Media, only the link changes.
//
//   ALLOW_PRODUCTION_ONE_OFF=TASK-55 DATABASE_URI="<production>" S3_…="<R2 write credentials>" \
//     npx vite-node scripts/one-off/TASK-55-set-book-cover-from-file.ts <urlSlug> <image file> [replace]
//
// Run against production on 29 October 2026 for the French "Kabbalah du Arizal".
import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { getPayload } from 'payload'

import config from '../../src/payload.config.ts'
import { SKIP_STOREFRONT_REVALIDATION } from '../../src/collections/hooks/revalidateStorefront.ts'
import { parseDatabaseIdentity } from '../../src/lib/diagnostics.ts'

try {
  process.loadEnvFile('.env')
} catch {
  // CI or an operator can provide the variables through the process environment.
}

const MIME_TYPES: Record<string, string> = { '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' }

async function main() {
  const [urlSlug, filePath, mode] = process.argv.slice(2)
  if (!urlSlug || !filePath) throw new Error('usage: TASK-55-set-book-cover-from-file.ts <urlSlug> <image file> [replace]')
  const mimetype = MIME_TYPES[path.extname(filePath).toLowerCase()]
  if (!mimetype) throw new Error(`unsupported file type: ${filePath}`)

  const databaseUri = process.env.DATABASE_URI
  if (!databaseUri) throw new Error('DATABASE_URI is not set')
  console.log(`Target database fingerprint ${parseDatabaseIdentity(databaseUri).fingerprint}`)

  const payload = await getPayload({ config })
  const { docs } = await payload.find({ collection: 'books', where: { urlSlug: { equals: urlSlug } }, depth: 0, limit: 2 })
  if (docs.length !== 1) throw new Error(`expected exactly one book with urlSlug "${urlSlug}", found ${docs.length}`)
  const [book] = docs
  if (book.cover && mode !== 'replace') throw new Error(`${urlSlug} already has a cover; pass "replace" to change it`)

  const data = await readFile(filePath)
  const media = await payload.create({
    collection: 'media',
    data: {},
    file: { data, mimetype, name: path.basename(filePath), size: data.length },
    context: SKIP_STOREFRONT_REVALIDATION,
  })
  const urls = [media.url, media.sizes?.thumbnail?.url, media.sizes?.card?.url].filter((url): url is string => Boolean(url))
  for (const url of urls) {
    const response = await fetch(url, { method: 'HEAD' })
    if (!response.ok) throw new Error(`${url}: ${response.status} — the file did not reach storage`)
  }

  await payload.update({ collection: 'books', id: book.id, data: { cover: media.id }, context: SKIP_STOREFRONT_REVALIDATION })
  console.log(`done   ${media.filename} (${urls.length} files answer) is now the cover of ${urlSlug}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
