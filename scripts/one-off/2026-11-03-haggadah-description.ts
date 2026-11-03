// Rewrites the Ramhal Haggadah's Hebrew description: the old text was one run-on
// line of asterisks ending in a link to the retired flipbook (the sample button
// replaces it). Dry run prints the new text; `--apply` writes it.
//
//   ALLOW_PRODUCTION_ONE_OFF=TASK-61 DATABASE_URI="<production>" APP_ENV=development \
//     npx vite-node -c vitest.config.ts --options.deps.inline=payload-oauth2 \
//       scripts/one-off/2026-11-03-haggadah-description.ts [--apply]
import { getPayload } from 'payload'

import config from '../../src/payload.config.ts'
import { SKIP_STOREFRONT_REVALIDATION } from '../../src/collections/hooks/revalidateStorefront.ts'
import { parseDatabaseIdentity } from '../../src/lib/platform/diagnostics.ts'

import type { Book } from '../../src/payload-types.ts'

try {
  process.loadEnvFile('.env')
} catch {
  // CI or an operator can provide the variables through the process environment.
}

const URL_SLUG = 'הגדה-של-פסח-לרמחל'

const INTRODUCTION =
  'הגדה של פסח המלקטת מכל כתבי הרמח״ל את סוד יציאת מצרים והשלמת בריאת העולם, עם ביאור כתר מרדכי מאת הרה״ג הרב מרדכי שריקי שליט״א. מהדורה ראשונה, תשפ״ו.'
const CONTENTS_HEADING = 'בהגדה:'
const CONTENTS = [
  'ביאור כתר מרדכי על ההגדה',
  'כוונות ליל הסדר',
  'תפילות מתוך כתבי היד של הרמח״ל',
  'פירוש הרמח״ל על שיר השירים',
  'שיר מיוחד לסיום הסדר',
]

function text(value: string) {
  return { type: 'text', version: 1, text: value, format: 0, style: '', mode: 'normal', detail: 0 }
}

function paragraph(value: string) {
  return { type: 'paragraph', version: 1, children: [text(value)], direction: 'rtl', format: '', indent: 0, textFormat: 0, textStyle: '' }
}

const description: NonNullable<Book['description']> = {
  root: {
    type: 'root',
    version: 1,
    children: [
      paragraph(INTRODUCTION),
      paragraph(CONTENTS_HEADING),
      {
        type: 'list',
        version: 1,
        listType: 'bullet',
        start: 1,
        tag: 'ul',
        direction: 'rtl',
        format: '',
        indent: 0,
        children: CONTENTS.map((item, index) => ({
          type: 'listitem',
          version: 1,
          value: index + 1,
          children: [text(item)],
          direction: 'rtl',
          format: '',
          indent: 0,
        })),
      },
    ],
    direction: 'rtl',
    format: '',
    indent: 0,
  },
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
  console.log('before:', JSON.stringify(book.description))
  if (!apply) {
    console.log('Dry run — pass --apply to write.')
    return
  }

  await payload.update({ collection: 'books', id: book.id, locale: 'he', data: { description }, context: SKIP_STOREFRONT_REVALIDATION })
  console.log(`done   ${URL_SLUG} description rewritten`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
