// Turns the Ramhal Haggadah's photo gallery into the two colours it is sold in,
// brown and white: each colour gets its own pictures, the brown front stays the
// cover. Dry run prints what would change; `--apply` writes it.
//
//   ALLOW_PRODUCTION_ONE_OFF=TASK-60 DATABASE_URI="<production>" APP_ENV=development \
//     npx vite-node -c vitest.config.ts --options.deps.inline=payload-oauth2 \
//       scripts/one-off/2026-11-03-haggadah-colors.ts [--apply]
//
// The pictures are the Media files TASK-57 uploaded; they are found by file name,
// which Payload may have suffixed (`-1`) when the name was taken.
import { getPayload } from 'payload'

import config from '../../src/payload.config.ts'
import { SKIP_STOREFRONT_REVALIDATION } from '../../src/collections/hooks/revalidateStorefront.ts'
import { parseDatabaseIdentity } from '../../src/lib/diagnostics.ts'

try {
  process.loadEnvFile('.env')
} catch {
  // CI or an operator can provide the variables through the process environment.
}

const URL_SLUG = 'הגדה-של-פסח-לרמחל'

const COLORS = [
  { names: { he: 'חום', en: 'Brown', fr: 'Brun' }, swatch: '#5a2d1b', files: ['hagadah-shel-pesach-front', 'hagadah-shel-pesach-angle'] },
  { names: { he: 'לבן', en: 'White', fr: 'Blanc' }, swatch: '#f4f1ea', files: ['hagadah-shel-pesach-white-front', 'hagadah-shel-pesach-white-angle'] },
] as const

async function main() {
  const apply = process.argv.includes('--apply')
  const databaseUri = process.env.DATABASE_URI
  if (!databaseUri) throw new Error('DATABASE_URI is not set')
  console.log(`Target database fingerprint ${parseDatabaseIdentity(databaseUri).fingerprint}`)

  const payload = await getPayload({ config })
  const { docs } = await payload.find({ collection: 'books', where: { urlSlug: { equals: URL_SLUG } }, depth: 0, limit: 2 })
  if (docs.length !== 1) throw new Error(`expected exactly one book with urlSlug "${URL_SLUG}", found ${docs.length}`)
  const [book] = docs
  if (book.colors && book.colors.length > 0) throw new Error('the book already has colours')

  const imageIdsByColor: number[][] = []
  for (const color of COLORS) {
    const ids: number[] = []
    for (const stem of color.files) {
      const found = await payload.find({ collection: 'media', where: { filename: { like: `${stem}` } }, depth: 0, limit: 5, sort: 'createdAt' })
      const match = found.docs.find((media) => media.filename?.startsWith(stem) && media.filename.endsWith('.webp'))
      if (!match) throw new Error(`no Media file named ${stem}*.webp`)
      ids.push(match.id)
    }
    imageIdsByColor.push(ids)
    console.log(`${color.names.he}: media ${ids.join(', ')}`)
  }
  if (!apply) {
    console.log('Dry run — pass --apply to write.')
    return
  }

  const created = await payload.update({
    collection: 'books',
    id: book.id,
    locale: 'he',
    data: {
      gallery: [],
      colors: COLORS.map((color, index) => ({ name: color.names.he, swatch: color.swatch, images: imageIdsByColor[index].map((image) => ({ image })) })),
    },
    context: SKIP_STOREFRONT_REVALIDATION,
  })
  for (const locale of ['en', 'fr'] as const) {
    await payload.update({
      collection: 'books',
      id: book.id,
      locale,
      data: { colors: (created.colors ?? []).map((row, index) => ({ ...row, name: COLORS[index].names[locale] })) },
      context: SKIP_STOREFRONT_REVALIDATION,
    })
  }
  console.log(`done   ${URL_SLUG} now has ${COLORS.length} colours`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
