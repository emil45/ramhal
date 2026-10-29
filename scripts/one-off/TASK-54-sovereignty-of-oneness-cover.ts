// Sets the scanned front cover of "The Sovereignty of Oneness" as that book's cover.
// Same environment and run procedure as TASK-50-book-cover-photos.ts. A single file,
// so one process (see TASK-53-zohar-boxed-set-gallery.ts for why that matters); the
// object is read back from the public URL and the script fails if it is missing.
//
//   ALLOW_PRODUCTION_ONE_OFF=TASK-54 DATABASE_URI="<production>" S3_…="<R2 write credentials>" \
//     npx vite-node scripts/one-off/TASK-54-sovereignty-of-oneness-cover.ts <path to the WebP file>
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

const URL_SLUG = 'the-sovereignty-of-oneness'

async function main() {
  const filePath = process.argv[2]
  if (!filePath) throw new Error('usage: TASK-54-sovereignty-of-oneness-cover.ts <path to the WebP file>')

  const databaseUri = process.env.DATABASE_URI
  if (!databaseUri) throw new Error('DATABASE_URI is not set')
  console.log(`Target database fingerprint ${parseDatabaseIdentity(databaseUri).fingerprint}`)

  const payload = await getPayload({ config })
  const { docs } = await payload.find({ collection: 'books', where: { urlSlug: { equals: URL_SLUG } }, depth: 0, limit: 2 })
  if (docs.length !== 1) throw new Error(`expected exactly one book with urlSlug "${URL_SLUG}", found ${docs.length}`)
  const [book] = docs
  if (book.cover) throw new Error(`${URL_SLUG} already has a cover; not replacing it`)

  const data = await readFile(filePath)
  const media = await payload.create({
    collection: 'media',
    data: {},
    file: { data, mimetype: 'image/webp', name: path.basename(filePath), size: data.length },
    context: SKIP_STOREFRONT_REVALIDATION,
  })
  const urls = [media.url, media.sizes?.thumbnail?.url, media.sizes?.card?.url].filter((url): url is string => Boolean(url))
  for (const url of urls) {
    const response = await fetch(url, { method: 'HEAD' })
    if (!response.ok) throw new Error(`${url}: ${response.status} — the file did not reach storage`)
  }

  await payload.update({ collection: 'books', id: book.id, data: { cover: media.id }, context: SKIP_STOREFRONT_REVALIDATION })
  console.log(`done   ${media.filename} (${urls.length} files answer) is now the cover of ${URL_SLUG}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
