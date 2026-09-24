import config from '@payload-config'
import { getPayload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { SKIP_STOREFRONT_REVALIDATION } from '@/collections/hooks/revalidateStorefront'
import { cleanUpTestRun, createTestBook, startTestRun } from '@/test/checkoutFixtures'

import type { Book } from '@/payload-types'

const run = startTestRun()
const books: Book[] = []
let book: Book

beforeAll(async () => {
  book = await createTestBook(run)
  books.push(book)
})

afterAll(async () => {
  await cleanUpTestRun(run, books)
})

describe('localized display-title hook', () => {
  it('does not discard another localized field changed in the same save', async () => {
    const payload = await getPayload({ config })
    const subtitle = `כותרת משנה ${run.id}`

    await payload.update({
      collection: 'books',
      id: book.id,
      locale: 'he',
      data: { subtitle },
      context: SKIP_STOREFRONT_REVALIDATION,
    })

    const updated = await payload.findByID({
      collection: 'books',
      id: book.id,
      locale: 'he',
      fallbackLocale: false,
      depth: 0,
    })

    expect(updated.subtitle).toBe(subtitle)
  })
})
