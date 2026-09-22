#!/usr/bin/env vite-node
// RECONSTRUCTION, not the code that ran — see docs/reports/TASK-24.md and
// AGENTS.md's "one-off scripts are kept, not deleted" convention.
//
// TASK-23 backfilled these through "a temporary Vitest integration test
// hitting the real Neon database through Payload's Local API, run once and
// deleted" (docs/reports/TASK-23.md). That exact test no longer exists; this
// rebuilds its effect from what the report states plainly it did: 9 books
// moved from hebrew-books to siddurim-machzorim, and 11 uncategorized French
// books given category french-books, bookLanguage 'fr', with the
// now-resolved language-uncertain review reason dropped. The two lists below
// are copied from REVIEWED_CATEGORY_SLUG and REVIEWED_LANGUAGE in
// src/importBooks.ts as they stood when this was written, not imported live,
// because a one-off script's job is to record exactly what ran, independent
// of how that source file may later change.
//
// Never run again. Kept as a record of what executed against production.
import { getPayload } from 'payload'

import config from '../../src/payload.config.ts'

import type { Book } from '../../src/payload-types.ts'

const SIDDURIM_MACHZORIM_IMPORT_KEYS: readonly string[] = [
  'מחזור כיפור רמחל חדש צבע חום',
  'מחזור כיפור רמחל חדש צבע לבן',
  'מחזור רה לרמחל',
  'סידור כוונות לשבת כריכת עור מהודרת פורמט גדול',
  'סידור שבת פורמט קטן',
  'סידור חול ורח כוונות הרמחל (פורמט קטן) במבצע',
  'מחזור רה עם כוונות הרמחל',
  'מחזור כוונות רה לרמחל',
  'he:סידור כוונות לימות החול (פורמט קטן)',
]

const FRENCH_IMPORT_KEYS: readonly string[] = [
  'La Voie de D.ieu',
  'MAAMAR HA-HOKHMA',
  'Les Voies de la Direction divine',
  'Lessence de la Torah - Nouveau format',
  'Maamar Ha-Gueoula',
  'La voix des justes',
  'Les Soixante Dix Arrangements Tome1',
  'la kabbale de la reparation',
  'Kalah Pithé Hokhma, ou la Kabbale signifiante',
  'Maamar Ha-Gueoula Le discours de la délivrance',
  '1Les Soixante-dix Arrangements',
]

const payload = await getPayload({ config })

try {
  const categories = await payload.find({ collection: 'categories', limit: 100 })
  const siddurimMachzorimId = categories.docs.find((category) => category.slug === 'siddurim-machzorim')?.id
  const frenchBooksId = categories.docs.find((category) => category.slug === 'french-books')?.id
  if (!siddurimMachzorimId || !frenchBooksId) {
    throw new Error('Expected categories "siddurim-machzorim" and "french-books" to already exist.')
  }

  let siddurimMachzorimUpdated = 0
  for (const importKey of SIDDURIM_MACHZORIM_IMPORT_KEYS) {
    const found = await payload.find({ collection: 'books', where: { importKey: { equals: importKey } }, limit: 1, depth: 0 })
    const book = found.docs[0]
    if (!book) {
      console.log(`siddurim-machzorim: no book with importKey ${importKey}, skipping.`)
      continue
    }
    if (book.category === siddurimMachzorimId) continue
    await payload.update({ collection: 'books', id: book.id, data: { category: siddurimMachzorimId } })
    siddurimMachzorimUpdated++
  }

  let frenchUpdated = 0
  for (const importKey of FRENCH_IMPORT_KEYS) {
    const found = await payload.find({ collection: 'books', where: { importKey: { equals: importKey } }, limit: 1, depth: 0 })
    const book = found.docs[0]
    if (!book) {
      console.log(`french-books: no book with importKey ${importKey}, skipping.`)
      continue
    }
    const reviewReasons = (book.reviewReasons ?? []).filter((reason: NonNullable<Book['reviewReasons']>[number]) => reason !== 'language-uncertain')
    await payload.update({
      collection: 'books',
      id: book.id,
      data: {
        bookLanguage: 'fr',
        category: frenchBooksId,
        reviewReasons,
        needsReview: reviewReasons.length > 0,
      },
    })
    frenchUpdated++
  }

  console.log(JSON.stringify({ siddurimMachzorimUpdated, frenchUpdated }, null, 2))
} finally {
  await payload.destroy()
}

process.exit(0)
