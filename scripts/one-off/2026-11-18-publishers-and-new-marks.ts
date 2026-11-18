// Run 2026-11-18. Marks the two new prayer books as new (and drops "חדש" from the Yom Kippur
// machzor's title, keeping its URL), and moves three books to the other-publishers shelf, giving a
// placeholder publisher name only to those that have none. Dry run by default; `--apply` writes.
//
//   ALLOW_PRODUCTION_ONE_OFF=TASK-64 DATABASE_URI="<production>" APP_ENV=development \
//     npx vite-node -c vitest.config.ts --options.deps.inline=payload-oauth2 \
//       scripts/one-off/2026-11-18-publishers-and-new-marks.ts [--apply]
import { getPayload } from 'payload'

import config from '../../src/payload.config.ts'
import { SKIP_STOREFRONT_REVALIDATION } from '../../src/collections/hooks/revalidateStorefront.ts'
import { parseDatabaseIdentity } from '../../src/lib/platform/diagnostics.ts'

try {
  process.loadEnvFile('.env')
} catch {
  // CI or an operator can provide the variables through the process environment.
}

const PLACEHOLDER_PUBLISHER_NAME = 'הוצאה אחרת'
const NEW_MARK_TITLE_SUFFIX = / חדש$/

const NEW_BOOK_URL_SLUGS = ['מחזור-כיפור-רמחל-חדש', 'מחזור-רה-לרמחל']
const OTHER_PUBLISHER_URL_SLUGS = [
  'מחול-לצדיקים-בדברי-תכלית-הבריאה',
  'שוד-מלכים',
  'רבי-יעקב-מולכו-הגהות-בספר-משנה-תורה-לרמבם',
]
const LOCALES = ['he', 'fr'] as const

async function main() {
  const apply = process.argv.includes('--apply')
  const databaseUri = process.env.DATABASE_URI
  if (!databaseUri) throw new Error('DATABASE_URI is not set')
  console.log(`Target database fingerprint ${parseDatabaseIdentity(databaseUri).fingerprint}`)

  const payload = await getPayload({ config })

  async function findBook(urlSlug: string) {
    const { docs } = await payload.find({
      collection: 'books',
      where: { urlSlug: { equals: urlSlug } },
      locale: 'he',
      fallbackLocale: false,
      depth: 0,
      limit: 2,
    })
    if (docs.length !== 1) throw new Error(`expected exactly one book with urlSlug "${urlSlug}", found ${docs.length}`)
    return docs[0]
  }

  for (const urlSlug of NEW_BOOK_URL_SLUGS) {
    const book = await findBook(urlSlug)
    console.log(`\n${urlSlug} (id ${book.id})`)
    console.log(`  markedNew: ${book.markedNew} -> true`)
    const retitled: Array<{ locale: (typeof LOCALES)[number]; title: string }> = []
    for (const locale of LOCALES) {
      const { title } = await payload.findByID({ collection: 'books', id: book.id, locale, fallbackLocale: false, depth: 0 })
      if (typeof title !== 'string' || !NEW_MARK_TITLE_SUFFIX.test(title)) continue
      const newTitle = title.replace(NEW_MARK_TITLE_SUFFIX, '')
      console.log(`  title[${locale}]: ${JSON.stringify(title)} -> ${JSON.stringify(newTitle)}`)
      retitled.push({ locale, title: newTitle })
    }
    if (!apply) continue
    await payload.update({ collection: 'books', id: book.id, locale: 'he', data: { markedNew: true }, context: SKIP_STOREFRONT_REVALIDATION })
    for (const { locale, title } of retitled) {
      await payload.update({ collection: 'books', id: book.id, locale, data: { title }, context: SKIP_STOREFRONT_REVALIDATION })
    }
    console.log('  written')
  }

  for (const urlSlug of OTHER_PUBLISHER_URL_SLUGS) {
    const book = await findBook(urlSlug)
    console.log(`\n${urlSlug} (id ${book.id})`)
    console.log(`  fromInstitute: ${book.fromInstitute} -> false`)
    const publisherName = book.publisherName || PLACEHOLDER_PUBLISHER_NAME
    console.log(`  publisherName[he]: ${JSON.stringify(book.publisherName)} -> ${JSON.stringify(publisherName)}`)
    if (!apply) continue
    await payload.update({
      collection: 'books',
      id: book.id,
      locale: 'he',
      data: { fromInstitute: false, publisherName },
      context: SKIP_STOREFRONT_REVALIDATION,
    })
    console.log('  written')
  }

  if (!apply) console.log('\nDry run — pass --apply to write.')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
