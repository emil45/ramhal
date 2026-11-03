// Sets a PDF as a book's reading copy (the sample button on its page).
// One file per process, read back from its public URL afterwards — same
// environment and run procedure as TASK-57-attach-book-photo.ts.
//
//   ALLOW_PRODUCTION_ONE_OFF=TASK-59 DATABASE_URI="<production>" S3_…="<R2 write credentials>" \
//     npx vite-node -c vitest.config.ts --options.deps.inline=payload-oauth2 \
//       scripts/one-off/2026-11-03-attach-book-preview-pdf.ts <urlSlug> <pdf file>
//
// A book that already has a reading copy is refused: replace it in the admin.
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

async function main() {
  const [urlSlug, filePath] = process.argv.slice(2)
  if (!urlSlug || !filePath || path.extname(filePath).toLowerCase() !== '.pdf') {
    throw new Error('usage: 2026-11-03-attach-book-preview-pdf.ts <urlSlug> <pdf file>')
  }

  const databaseUri = process.env.DATABASE_URI
  if (!databaseUri) throw new Error('DATABASE_URI is not set')
  console.log(`Target database fingerprint ${parseDatabaseIdentity(databaseUri).fingerprint}`)

  const payload = await getPayload({ config })
  const { docs } = await payload.find({ collection: 'books', where: { urlSlug: { equals: urlSlug } }, depth: 0, limit: 2 })
  if (docs.length !== 1) throw new Error(`expected exactly one book with urlSlug "${urlSlug}", found ${docs.length}`)
  const [book] = docs
  if (book.previewPdf) throw new Error(`${urlSlug} already has a reading copy`)

  const data = await readFile(filePath)
  const media = await payload.create({
    collection: 'media',
    data: {},
    file: { data, mimetype: 'application/pdf', name: path.basename(filePath), size: data.length },
    context: SKIP_STOREFRONT_REVALIDATION,
  })
  if (media.url && URL.canParse(media.url)) {
    const response = await fetch(media.url, { method: 'HEAD' })
    if (!response.ok) throw new Error(`${media.url}: ${response.status} — the file did not reach storage`)
  }

  await payload.update({ collection: 'books', id: book.id, data: { previewPdf: media.id }, context: SKIP_STOREFRONT_REVALIDATION })
  console.log(`done   ${media.filename} is now the reading copy of ${urlSlug}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
