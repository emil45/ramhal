// Gives the Haggadah its Hebrew year (תשפ״ו) in the book's details table, and drops
// it from the description sentence, which keeps "מהדורה ראשונה". Dry run by default;
// `--apply` writes.
//
//   ALLOW_PRODUCTION_ONE_OFF=TASK-63 DATABASE_URI="<production>" APP_ENV=development \
//     npx vite-node -c vitest.config.ts --options.deps.inline=payload-oauth2 \
//       scripts/one-off/2026-11-03-haggadah-year.ts [--apply]
import { getPayload } from 'payload'

import config from '../../src/payload.config.ts'
import { SKIP_STOREFRONT_REVALIDATION } from '../../src/collections/hooks/revalidateStorefront.ts'
import { parseDatabaseIdentity } from '../../src/lib/platform/diagnostics.ts'

try {
  process.loadEnvFile('.env')
} catch {
  // CI or an operator can provide the variables through the process environment.
}

const URL_SLUG = 'הגדה-של-פסח-לרמחל'
const HEBREW_YEAR = 'תשפ״ו'
const EDITION_WITH_YEAR = `מהדורה ראשונה, ${HEBREW_YEAR}.`
const EDITION = 'מהדורה ראשונה.'

function replaceText(node: unknown): number {
  if (typeof node !== 'object' || node === null) return 0
  let replaced = 0
  if ('text' in node && typeof node.text === 'string' && node.text.includes(EDITION_WITH_YEAR)) {
    node.text = node.text.replace(EDITION_WITH_YEAR, EDITION)
    replaced += 1
  }
  if ('children' in node && Array.isArray(node.children)) {
    for (const child of node.children) replaced += replaceText(child)
  }
  return replaced
}

async function main() {
  const apply = process.argv.includes('--apply')
  const databaseUri = process.env.DATABASE_URI
  if (!databaseUri) throw new Error('DATABASE_URI is not set')
  console.log(`Target database fingerprint ${parseDatabaseIdentity(databaseUri).fingerprint}`)

  const payload = await getPayload({ config })
  const { docs } = await payload.find({ collection: 'books', where: { urlSlug: { equals: URL_SLUG } }, locale: 'he', fallbackLocale: false, depth: 0, limit: 2 })
  if (docs.length !== 1) throw new Error(`expected exactly one book with urlSlug "${URL_SLUG}", found ${docs.length}`)
  const [book] = docs
  if (!book.description) throw new Error('the book has no Hebrew description')
  const replaced = replaceText(book.description.root)
  if (replaced !== 1) throw new Error(`expected the edition sentence once, found it ${replaced} times`)
  console.log(`hebrewYear: ${JSON.stringify(book.hebrewYear)} -> ${HEBREW_YEAR}`)
  if (!apply) {
    console.log('Dry run — pass --apply to write.')
    return
  }

  await payload.update({ collection: 'books', id: book.id, locale: 'he', data: { hebrewYear: HEBREW_YEAR, description: book.description }, context: SKIP_STOREFRONT_REVALIDATION })
  console.log(`done   ${URL_SLUG} year set`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
