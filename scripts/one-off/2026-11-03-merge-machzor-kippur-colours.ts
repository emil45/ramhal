// Merges the two Yom Kippur machzor books (white and brown, same price) into one
// book sold in two colours, like the Haggadah. The white book survives: it gets a
// white and a brown colour (white shows its existing pictures, brown the new photo),
// loses "צבע לבן" from its title and slug, and takes over the brown book's legacy
// URLs. The brown book is deleted only with `--delete-old`, as a separate run.
//
// One photo, one process, read back from its public URL (same environment as
// TASK-57-attach-book-photo.ts). Dry run by default; `--apply` writes.
//
//   ALLOW_PRODUCTION_ONE_OFF=TASK-62 DATABASE_URI="<production>" S3_…="<R2 write credentials>" \
//     APP_ENV=development npx vite-node -c vitest.config.ts --options.deps.inline=payload-oauth2 \
//       scripts/one-off/2026-11-03-merge-machzor-kippur-colours.ts <brown photo .webp> [--apply | --delete-old]
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

const WHITE_SLUG = 'מחזור-כיפור-רמחל-חדש-צבע-לבן'
const BROWN_SLUG = 'מחזור-כיפור-רמחל-חדש-צבע-חום'
const MERGED_SLUG = 'מחזור-כיפור-רמחל-חדש'
const COLOUR_SUFFIX = /\s*צבע (לבן|חום)\s*$/
const LOCALES = ['he', 'en', 'fr'] as const

const COLOURS = {
  white: { name: 'לבן', swatch: '#f4f1ea' },
  brown: { name: 'חום', swatch: '#5a2d1b' },
} as const

async function main() {
  const [photoPath] = process.argv.slice(2).filter((argument) => !argument.startsWith('--'))
  const apply = process.argv.includes('--apply')
  const deleteOld = process.argv.includes('--delete-old')
  const databaseUri = process.env.DATABASE_URI
  if (!databaseUri) throw new Error('DATABASE_URI is not set')
  console.log(`Target database fingerprint ${parseDatabaseIdentity(databaseUri).fingerprint}`)

  const payload = await getPayload({ config })
  const find = async (urlSlug: string) => {
    const { docs } = await payload.find({ collection: 'books', where: { urlSlug: { equals: urlSlug } }, depth: 0, limit: 2 })
    return docs
  }

  if (deleteOld) {
    const [brown] = await find(BROWN_SLUG)
    const [merged] = await find(MERGED_SLUG)
    if (!brown) throw new Error('the brown book is already gone')
    if (!merged) throw new Error('run --apply first: the merged book does not exist yet')
    await payload.delete({ collection: 'books', id: brown.id, context: SKIP_STOREFRONT_REVALIDATION })
    console.log(`done   deleted the old brown book ${brown.id}`)
    return
  }

  if (!photoPath) throw new Error('usage: <brown photo .webp> [--apply | --delete-old]')
  const whiteBooks = await find(WHITE_SLUG)
  const brownBooks = await find(BROWN_SLUG)
  if (whiteBooks.length !== 1 || brownBooks.length !== 1) throw new Error(`expected one white and one brown book, found ${whiteBooks.length} and ${brownBooks.length}`)
  const [white] = whiteBooks
  const [brown] = brownBooks

  const whiteWithRelations = await payload.findByID({ collection: 'books', id: white.id, depth: 0 })
  const whiteImageIds = [whiteWithRelations.cover, ...(whiteWithRelations.gallery ?? []).map((entry) => entry.image)].flatMap((image) => (typeof image === 'number' ? [image] : []))
  const newTitles = new Map<(typeof LOCALES)[number], string>()
  for (const locale of LOCALES) {
    const { title } = await payload.findByID({ collection: 'books', id: white.id, locale, fallbackLocale: false, depth: 0 })
    if (title) newTitles.set(locale, title.replace(COLOUR_SUFFIX, ''))
  }
  console.log(`white book ${white.id}: ${whiteImageIds.length} pictures; brown book ${brown.id}; new titles ${JSON.stringify([...newTitles])}`)
  if (!apply) {
    console.log('Dry run — pass --apply to write.')
    return
  }

  const fileName = path.basename(photoPath)
  const existing = await payload.find({ collection: 'media', where: { filename: { equals: fileName } }, depth: 0, limit: 1 })
  if (existing.docs.length > 0) throw new Error(`${fileName} is already in Media`)
  const data = await readFile(photoPath)
  const photo = await payload.create({
    collection: 'media',
    data: {},
    file: { data, mimetype: 'image/webp', name: fileName, size: data.length },
    context: SKIP_STOREFRONT_REVALIDATION,
  })
  if (photo.url && URL.canParse(photo.url)) {
    const response = await fetch(photo.url, { method: 'HEAD' })
    if (!response.ok) throw new Error(`${photo.url}: ${response.status} — the file did not reach storage`)
  }

  const brownLegacyUrls = (await payload.findByID({ collection: 'books', id: brown.id, depth: 0 })).legacyUrls ?? []
  const whiteLegacyUrls = whiteWithRelations.legacyUrls ?? []
  await payload.update({
    collection: 'books',
    id: white.id,
    locale: 'he',
    data: {
      urlSlug: MERGED_SLUG,
      gallery: [],
      colors: [
        { name: COLOURS.white.name, swatch: COLOURS.white.swatch, images: whiteImageIds.map((image) => ({ image })) },
        { name: COLOURS.brown.name, swatch: COLOURS.brown.swatch, images: [{ image: photo.id }] },
      ],
      legacyUrls: [...whiteLegacyUrls, ...brownLegacyUrls].map(({ url }) => ({ url })),
    },
    context: SKIP_STOREFRONT_REVALIDATION,
  })
  for (const [locale, title] of newTitles) {
    await payload.update({
      collection: 'books',
      id: white.id,
      locale,
      data: { title },
      context: SKIP_STOREFRONT_REVALIDATION,
    })
  }
  console.log(`done   ${MERGED_SLUG}: white + brown colours, brown photo ${photo.filename} stored; run again with --delete-old to remove the old brown book`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
