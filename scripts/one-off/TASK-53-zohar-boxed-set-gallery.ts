// Adds the photos of the blue boxed set to the gallery of "זוהר השלם — חיבורה
// קדמאה מהדורה חדשה", which already has its cover. Same environment and run
// procedure as TASK-50-book-cover-photos.ts, one photo per run. Run against
// production on 29 October 2026 (with ALLOW_PRODUCTION_ONE_OFF=TASK-51, the number
// it was started under before another task took it):
//
//   ALLOW_PRODUCTION_ONE_OFF=TASK-53 DATABASE_URI="<production>" S3_…="<R2 write credentials>" \
//     npx vite-node scripts/one-off/TASK-53-zohar-boxed-set-gallery.ts <folder> blue-boxed-set-1.webp
//
// One photo per process because, in the TASK-50 run and again when this script
// handled both in one process, only the first upload of a process reached the
// bucket while every Media row was written; the cause was not found. Each run
// therefore reads the object back from the public URL and fails if it is missing.
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

const URL_SLUG = 'זוהר-השלם-חיבורה-קדמאה-מהדורה-חדשה'

/** The name a source file is stored under, e.g. blue-boxed-set-1.webp → zohar-hashalem-boxed-set-1.webp. */
function uploadedName(sourceFile: string): string {
  return sourceFile.replace(/^blue-boxed-set/, 'zohar-hashalem-boxed-set')
}

async function main() {
  const [folder, sourceFile] = process.argv.slice(2)
  if (!folder || !sourceFile) throw new Error('usage: TASK-53-zohar-boxed-set-gallery.ts <folder> <WebP file name>')

  const databaseUri = process.env.DATABASE_URI
  if (!databaseUri) throw new Error('DATABASE_URI is not set')
  console.log(`Target database fingerprint ${parseDatabaseIdentity(databaseUri).fingerprint}`)

  const payload = await getPayload({ config })
  const { docs } = await payload.find({ collection: 'books', where: { urlSlug: { equals: URL_SLUG } }, depth: 0, limit: 2 })
  if (docs.length !== 1) throw new Error(`expected exactly one book with urlSlug "${URL_SLUG}", found ${docs.length}`)
  const [book] = docs

  const data = await readFile(path.resolve(folder, sourceFile))
  const media = await payload.create({
    collection: 'media',
    data: {},
    file: { data, mimetype: 'image/webp', name: uploadedName(sourceFile), size: data.length },
    context: SKIP_STOREFRONT_REVALIDATION,
  })
  const urls = [media.url, media.sizes?.thumbnail?.url, media.sizes?.card?.url].filter((url): url is string => Boolean(url))
  for (const url of urls) {
    const response = await fetch(url, { method: 'HEAD' })
    if (!response.ok) throw new Error(`${url}: ${response.status} — the file did not reach storage`)
  }

  await payload.update({
    collection: 'books',
    id: book.id,
    data: { gallery: [...(book.gallery ?? []).map(({ image }) => ({ image })), { image: media.id }] },
    context: SKIP_STOREFRONT_REVALIDATION,
  })
  console.log(`done   ${media.filename} (${urls.length} files answer) added to ${URL_SLUG}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
