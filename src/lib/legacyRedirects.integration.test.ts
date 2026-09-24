import config from '@payload-config'
import { getPayload } from 'payload'
import { describe, expect, it } from 'vitest'

import legacyRedirects from '@/lib/legacyRedirects.json'
import { BOOK_SEGMENT } from '@/lib/routes'

// A book redirect names a slug; a slug changed or a book deleted since the table
// was generated would turn a 301 into a 404. This is the check to re-run after
// either (README, "Legacy URLs"): the fix is `npm run redirects:generate`.
describe('legacy redirects to books', () => {
  it('only name books that exist', async () => {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({ collection: 'books', depth: 0, pagination: false, select: { urlSlug: true } })
    const existing = new Set(docs.map((book) => book.urlSlug))

    const bookWord = BOOK_SEGMENT.he
    const missing: string[] = []
    let checked = 0
    for (const [source, target] of Object.entries(legacyRedirects)) {
      const [, segment, slug] = target.split('/')
      if (segment !== bookWord) continue
      checked += 1
      if (!existing.has(slug)) missing.push(`${source} → ${target}`)
    }

    expect(checked).toBeGreaterThan(0)
    expect(missing).toEqual([])
  })
})
