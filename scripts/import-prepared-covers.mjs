#!/usr/bin/env node
// Publishes the reviewed cover set from TASK-11. Targets are resolved through
// the exact legacy product URL recorded by both the asset audit and each book;
// titles are deliberately not used as identifiers because the legacy
// catalogue contains near-duplicates and punctuation variants.
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import { getPayload } from 'payload'

try {
  process.loadEnvFile('.env')
} catch {
  // CI or an operator can provide the variables through the process environment.
}

const { default: config } = await import('../src/payload.config.ts')

const preparedDirectory = new URL('../assets/book-covers/prepared/', import.meta.url)
const sourceManifest = JSON.parse(await readFile(new URL('../assets/book-covers/manifest.json', import.meta.url), 'utf8'))
const preparedManifest = JSON.parse(await readFile(new URL('manifest.json', preparedDirectory), 'utf8'))
const locales = ['he', 'en', 'fr']

function localeWithTitle(book) {
  if (typeof book.title === 'string' && book.title) return 'he'
  for (const locale of locales) {
    if (book.title?.[locale]) return locale
  }
  throw new Error(`Book ${book.id} has no localized title; refusing to update it.`)
}

function populatedMediaId(cover) {
  if (typeof cover === 'number' || typeof cover === 'string') return cover
  return cover?.id ?? null
}

const sourceProductByIdentifier = new Map(sourceManifest.products.map((product) => [product.identifier, product]))
const duplicatePreparedIdentifiers = preparedManifest.covers.filter(
  (cover, index, covers) => covers.findIndex((candidate) => candidate.identifier === cover.identifier) !== index,
)
if (duplicatePreparedIdentifiers.length > 0) {
  throw new Error(`Prepared cover manifest contains duplicate identifiers: ${duplicatePreparedIdentifiers.map((cover) => cover.identifier).join(', ')}`)
}

const payload = await getPayload({ config })

try {
  const [{ docs: books }, { docs: mediaDocuments }] = await Promise.all([
    payload.find({ collection: 'books', locale: 'all', fallbackLocale: false, depth: 1, limit: 500 }),
    payload.find({ collection: 'media', locale: 'all', fallbackLocale: false, limit: 500 }),
  ])

  const preparedFilenameSet = new Set(preparedManifest.covers.map((cover) => cover.file))
  const preparedMediaByFilename = new Map(
    mediaDocuments.filter((media) => preparedFilenameSet.has(media.filename)).map((media) => [media.filename, media]),
  )
  const legacyMedia = mediaDocuments.filter((media) => media.filename?.startsWith('ramhal-cover-'))
  const legacyMediaIds = new Set(legacyMedia.map((media) => media.id))
  const targets = preparedManifest.covers.map((cover) => {
    const sourceProduct = sourceProductByIdentifier.get(cover.identifier)
    if (!sourceProduct) throw new Error(`No audited source product exists for prepared cover ${cover.identifier}.`)

    const matches = books.filter((book) => book.legacyUrls?.some((entry) => entry.url === sourceProduct.url))
    if (matches.length !== 1) {
      throw new Error(
        `Prepared cover ${cover.identifier} matched ${matches.length} books through ${sourceProduct.url}; expected exactly one.`,
      )
    }

    return { book: matches[0], cover }
  })
  const targetBookIds = new Set(targets.map((target) => target.book.id))
  let created = 0
  let reused = 0
  let attached = 0

  for (const { book, cover } of targets) {
    let media = preparedMediaByFilename.get(cover.file)

    if (media) {
      reused += 1
    } else {
      media = await payload.create({
        collection: 'media',
        locale: 'he',
        data: { alt: cover.title },
        filePath: fileURLToPath(new URL(cover.file, preparedDirectory)),
      })
      preparedMediaByFilename.set(cover.file, media)
      created += 1
    }

    if (populatedMediaId(book.cover) !== media.id) {
      await payload.update({
        collection: 'books',
        id: book.id,
        locale: localeWithTitle(book),
        data: { cover: media.id },
      })
      attached += 1
    }
  }

  let detached = 0
  for (const book of books) {
    const coverId = populatedMediaId(book.cover)
    if (!coverId || !legacyMediaIds.has(coverId) || targetBookIds.has(book.id)) continue

    await payload.update({
      collection: 'books',
      id: book.id,
      locale: localeWithTitle(book),
      data: { cover: null },
    })
    detached += 1
  }

  const { docs: currentBooks } = await payload.find({ collection: 'books', depth: 0, limit: 500 })
  const referencedLegacyIds = new Set(currentBooks.map((book) => populatedMediaId(book.cover)).filter(Boolean))
  const deletableLegacyMedia = legacyMedia.filter((media) => !referencedLegacyIds.has(media.id))

  for (const media of deletableLegacyMedia) {
    await payload.delete({ collection: 'media', id: media.id })
  }

  console.log(
    JSON.stringify(
      {
        prepared: preparedManifest.covers.length,
        mediaCreated: created,
        mediaReused: reused,
        booksAttached: attached,
        legacyCoversDetached: detached,
        legacyMediaDeleted: deletableLegacyMedia.length,
      },
      null,
      2,
    ),
  )
} finally {
  await payload.destroy()
}

// Payload's Postgres adapter retains a reconnect client. Its own CLI exits
// explicitly after destroy for the same reason.
process.exit(0)
