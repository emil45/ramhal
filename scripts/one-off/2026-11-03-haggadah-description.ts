// Removes the sentence pointing at the old flipbook ("לצפייה של חלק מההגדה: <link>")
// from the Haggadah's Hebrew description: the sample button replaces it. Dry run
// prints the new text; `--apply` writes it.
//
//   ALLOW_PRODUCTION_ONE_OFF=TASK-61 DATABASE_URI="<production>" APP_ENV=development \
//     npx vite-node -c vitest.config.ts --options.deps.inline=payload-oauth2 \
//       scripts/one-off/2026-11-03-haggadah-description.ts [--apply]
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
const FLIPBOOK_SENTENCE = /\s*לצפייה של חלק מההגדה:\s*https:\/\/online\.fliphtml5\.com\/sncyb\/wizw\/?/

function removeSentence(node: unknown): number {
  if (typeof node !== 'object' || node === null) return 0
  let removed = 0
  if ('text' in node && typeof node.text === 'string' && FLIPBOOK_SENTENCE.test(node.text)) {
    node.text = node.text.replace(FLIPBOOK_SENTENCE, '')
    removed += 1
  }
  if ('children' in node && Array.isArray(node.children)) {
    for (const child of node.children) removed += removeSentence(child)
  }
  return removed
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

  const removed = removeSentence(book.description.root)
  if (removed !== 1) throw new Error(`expected the sentence once, found it ${removed} times`)
  console.log(JSON.stringify(book.description.root))
  if (!apply) {
    console.log('Dry run — pass --apply to write.')
    return
  }

  await payload.update({ collection: 'books', id: book.id, locale: 'he', data: { description: book.description }, context: SKIP_STOREFRONT_REVALIDATION })
  console.log(`done   ${URL_SLUG} description updated`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
