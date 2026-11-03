// Attaches one photograph to one book: as its cover when the role is `cover`
// and the book has none, otherwise at the end of its gallery (the thumbnail
// strip on the book page). Run once per photo — a process that creates several
// Media files loses all but the first from R2 (docs/reports/TASK-53.md) — by
// TASK-57-attach-book-photos.sh, which walks the manifest.
//
//   ALLOW_PRODUCTION_ONE_OFF=TASK-57 DATABASE_URI="<production>" S3_…="<R2 write credentials>" \
//     npx vite-node -c vitest.config.ts --options.deps.inline=payload-oauth2 \
//       scripts/one-off/TASK-57-attach-book-photo.ts <urlSlug> <image file> <cover|gallery>
//
// Every file stored in R2 is read back from its public URL before the book is
// touched (a local-disk run has only relative URLs and nothing to read back).
// A photo whose file name is already in Media is skipped, so a re-run after a
// failure picks up where it stopped. Saving anything in the admin afterwards
// refreshes the cached storefront (docs/DECISIONS.md §5).
import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { getPayload } from 'payload'

import config from '../../src/payload.config.ts'
import { SKIP_STOREFRONT_REVALIDATION } from '../../src/collections/hooks/revalidateStorefront.ts'
import { parseDatabaseIdentity } from '../../src/lib/platform/diagnostics.ts'

try {
  process.loadEnvFile('.env')
} catch {
  // CI or an operator can provide the variables through the process environment.
}

async function main() {
  const [urlSlug, filePath, role] = process.argv.slice(2)
  if (!urlSlug || !filePath || (role !== 'cover' && role !== 'gallery')) {
    throw new Error('usage: TASK-57-attach-book-photo.ts <urlSlug> <image file> <cover|gallery>')
  }

  const databaseUri = process.env.DATABASE_URI
  if (!databaseUri) throw new Error('DATABASE_URI is not set')
  console.log(`Target database fingerprint ${parseDatabaseIdentity(databaseUri).fingerprint}`)

  const payload = await getPayload({ config })
  const { docs } = await payload.find({ collection: 'books', where: { urlSlug: { equals: urlSlug } }, depth: 0, limit: 2 })
  if (docs.length !== 1) throw new Error(`expected exactly one book with urlSlug "${urlSlug}", found ${docs.length}`)
  const [book] = docs
  if (role === 'cover' && book.cover) {
    console.log(`skip   ${path.basename(filePath)} — ${urlSlug} already has a cover`)
    return
  }

  const fileName = path.basename(filePath)
  const existing = await payload.find({ collection: 'media', where: { filename: { equals: fileName } }, depth: 0, limit: 1 })
  if (existing.docs.length > 0) {
    console.log(`skip   ${fileName} — already in Media`)
    return
  }

  const data = await readFile(filePath)
  const media = await payload.create({
    collection: 'media',
    data: {},
    file: { data, mimetype: 'image/webp', name: fileName, size: data.length },
    context: SKIP_STOREFRONT_REVALIDATION,
  })
  const urls = [media.url, media.sizes?.thumbnail?.url, media.sizes?.card?.url].filter((url): url is string => typeof url === 'string' && URL.canParse(url))
  for (const url of urls) {
    const response = await fetch(url, { method: 'HEAD' })
    if (!response.ok) throw new Error(`${url}: ${response.status} — the file did not reach storage`)
  }

  const gallery = (book.gallery ?? []).map(({ image }) => ({ image: typeof image === 'number' ? image : image.id }))
  await payload.update({
    collection: 'books',
    id: book.id,
    data: role === 'cover' ? { cover: media.id } : { gallery: [...gallery, { image: media.id }] },
    context: SKIP_STOREFRONT_REVALIDATION,
  })
  console.log(`done   ${media.filename} (${urls.length} files answer) is now ${role === 'cover' ? 'the cover' : 'in the gallery'} of ${urlSlug}`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
