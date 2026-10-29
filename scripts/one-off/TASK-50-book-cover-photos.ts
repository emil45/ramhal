// Attaches the photographed covers to their books: the first file of each
// entry becomes the book's cover, the rest its gallery (shown as thumbnails
// on the book page). The files are the cut-out photos on the storefront's
// paper colour, WebP, 1600px on the long side; they live outside the repository
// (docs/DECISIONS.md §16), so the folder is an argument:
//
//   ALLOW_PRODUCTION_ONE_OFF=TASK-50 DATABASE_URI="<production>" S3_...="<R2 write credentials>" \
//     npx vite-node scripts/one-off/TASK-50-book-cover-photos.ts ~/Downloads/ramhal-covers
//
// Uploads go wherever payload.config.ts sends media for the environment it is
// run in (local disk with none of the S3_* variables, the R2 bucket with them).
// A book that already has a cover is left alone, so a re-run never replaces a
// cover someone chose in the admin. Saving anything in the admin afterwards
// refreshes the cached storefront (docs/DECISIONS.md §5) — this script cannot,
// because it runs outside a Next request.
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

const KNOWN_DATABASES: Record<string, string> = {
  '2c951382a7f8': 'production',
}

type BookPhotos = { urlSlug: string; files: [string, ...string[]] }

const BOOK_PHOTOS: BookPhotos[] = [
  { urlSlug: 'אדיר-במרום-הוצאת-מכון-רמחל', files: ['adir-bamarom-front.webp', 'adir-bamarom-angle-1.webp', 'adir-bamarom-angle-2.webp'] },
  { urlSlug: 'איגרות-הרמחל', files: ['igrot-ramhal-front.webp', 'igrot-ramhal-angle.webp'] },
  {
    urlSlug: 'מחזור-כיפור-רמחל-חדש-צבע-לבן',
    files: ['machzor-kippur-white-set.webp', 'machzor-kippur-white-set-angle.webp', 'machzor-kippur-white-set-spines.webp'],
  },
  { urlSlug: 'מלך-העולם', files: ['melech-haolam-front.webp', 'melech-haolam-angle.webp'] },
  { urlSlug: 'tikoun-olam', files: ['tikoun-olam-front.webp', 'tikoun-olam-angle.webp'] },
  { urlSlug: 'מחזור-רה-לרמחל', files: ['machzor-rosh-hashanah.webp'] },
  { urlSlug: 'גילוי-מלכותו-על-רה-פורמט-קטן', files: ['gilui-malchuto-rosh-hashanah.webp'] },
  { urlSlug: 'גילוי-מלכותו-על-חג-מתן-תורה', files: ['gilui-malchuto-matan-torah.webp'] },
  { urlSlug: 'גילוי-מלכותו-על-פסח', files: ['gilui-malchuto-pesach.webp'] },
]

function fail(message: string): never {
  throw new Error(`TASK-50 refused to proceed: ${message}`)
}

async function main() {
  const folder = process.argv[2]
  if (!folder) fail('usage: TASK-50-book-cover-photos.ts <folder with the WebP files>')

  const databaseUri = process.env.DATABASE_URI
  if (!databaseUri) fail('DATABASE_URI is not set')
  const identity = parseDatabaseIdentity(databaseUri)
  console.log(`Target database: ${KNOWN_DATABASES[identity.fingerprint] ?? 'local'} (fingerprint ${identity.fingerprint})`)

  const payload = await getPayload({ config })

  for (const { urlSlug, files } of BOOK_PHOTOS) {
    const { docs } = await payload.find({ collection: 'books', where: { urlSlug: { equals: urlSlug } }, depth: 0, limit: 2 })
    if (docs.length !== 1) fail(`expected exactly one book with urlSlug "${urlSlug}", found ${docs.length}`)
    const [book] = docs
    if (book.cover) {
      console.log(`skip   ${urlSlug} — already has a cover`)
      continue
    }

    const mediaIds: number[] = []
    for (const file of files) {
      const media = await payload.create({
        collection: 'media',
        data: {},
        filePath: path.resolve(folder, file),
        context: SKIP_STOREFRONT_REVALIDATION,
      })
      mediaIds.push(media.id)
    }

    const [coverId, ...galleryIds] = mediaIds
    await payload.update({
      collection: 'books',
      id: book.id,
      data: { cover: coverId, gallery: galleryIds.map((image) => ({ image })) },
      context: SKIP_STOREFRONT_REVALIDATION,
    })
    console.log(`done   ${urlSlug} — cover + ${galleryIds.length} gallery image(s)`)
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
