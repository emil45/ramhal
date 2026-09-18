import { describe, expect, it } from 'vitest'

import { getCatalogueBooks } from '@/lib/booksData'

// Runs against the real database, not a fixture — the collision this guards
// against (docs/tasks/TASK-07-storefront.md §A1) only ever showed up in the
// real catalogue's actual titles, and a fixture would just assert the
// uniqueness logic understands its own made-up data. See
// src/collections/Books.ts's urlSlug field for the UNIQUE constraint this
// test is a second, independent check on (the database enforces it at write
// time; this proves it holds for what's actually there right now).
describe('urlSlug uniqueness across the real catalogue', () => {
  it('never has two books resolve to the same public URL, in any locale', async () => {
    for (const locale of ['he', 'en', 'fr'] as const) {
      const books = await getCatalogueBooks(locale)
      const bySlug = new Map<string, number[]>()
      for (const book of books) {
        bySlug.set(book.urlSlug, [...(bySlug.get(book.urlSlug) ?? []), book.id])
      }

      const collisions = [...bySlug.entries()].filter(([, ids]) => ids.length > 1)
      expect(collisions, `duplicate urlSlug values in locale "${locale}": ${JSON.stringify(collisions)}`).toEqual([])
    }
  })
})
