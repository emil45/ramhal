// Run 2026-11-18. Ticks "מוצג בדף הבית" on the five core Hebrew books the customer wants on the
// front page. Dry run by default; `--apply` writes.
//
//   scripts/ops.sh env ALLOW_PRODUCTION_ONE_OFF=TASK-65 DATABASE_URI="<production>" APP_ENV=development \
//     npx vite-node -c vitest.config.ts --options.deps.inline=payload-oauth2 \
//       scripts/one-off/2026-11-18-featured-on-homepage.ts [--apply]
import { getPayload } from 'payload'

import config from '../../src/payload.config.ts'
import { SKIP_STOREFRONT_REVALIDATION } from '../../src/collections/hooks/revalidateStorefront.ts'
import { parseDatabaseIdentity } from '../../src/lib/platform/diagnostics.ts'

try {
  process.loadEnvFile('.env')
} catch {
  // CI or an operator can provide the variables through the process environment.
}

const FEATURED_URL_SLUGS = [
  'מסילת-ישרים',
  'דעת-תבונות',
  'אדיר-במרום-הוצאת-מכון-רמחל',
  'איגרות-הרמחל',
  'קלח-פתחי-חכמה',
]

async function main() {
  const apply = process.argv.includes('--apply')
  const databaseUri = process.env.DATABASE_URI
  if (!databaseUri) throw new Error('DATABASE_URI is not set')
  console.log(`Target database fingerprint ${parseDatabaseIdentity(databaseUri).fingerprint}`)

  const payload = await getPayload({ config })
  for (const urlSlug of FEATURED_URL_SLUGS) {
    const { docs } = await payload.find({
      collection: 'books',
      where: { urlSlug: { equals: urlSlug } },
      locale: 'he',
      fallbackLocale: false,
      depth: 0,
      limit: 2,
    })
    if (docs.length !== 1) throw new Error(`expected exactly one book with urlSlug "${urlSlug}", found ${docs.length}`)
    const [book] = docs
    console.log(`${urlSlug} (id ${book.id}, ${JSON.stringify(book.displayTitle)}): featuredOnHomepage ${book.featuredOnHomepage} -> true`)
    if (!apply) continue
    await payload.update({ collection: 'books', id: book.id, locale: 'he', data: { featuredOnHomepage: true }, context: SKIP_STOREFRONT_REVALIDATION })
  }
  if (!apply) console.log('\nDry run — pass --apply to write.')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
