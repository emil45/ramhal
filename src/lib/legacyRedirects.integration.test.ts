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

    const bookWords = Object.values(BOOK_SEGMENT)
    const missing: string[] = []
    let checked = 0
    for (const [host, table] of Object.entries(legacyRedirects)) {
      for (const [source, target] of Object.entries(table)) {
        const [, first, second, third] = target.split('/')
        const segments = ['en', 'fr'].includes(first) ? [second, third] : [first, second]
        if (!bookWords.includes(segments[0])) continue
        checked += 1
        if (!existing.has(segments[1])) missing.push(`${host}${source} → ${target}`)
      }
    }

    expect(checked).toBeGreaterThan(0)
    expect(missing).toEqual([])
  })
})
