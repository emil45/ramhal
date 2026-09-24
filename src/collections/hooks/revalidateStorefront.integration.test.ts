import config from '@payload-config'
import { revalidatePath } from 'next/cache.js'
import { after } from 'next/server.js'
import { getPayload } from 'payload'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { revalidateStorefront, SKIP_STOREFRONT_REVALIDATION } from './revalidateStorefront'
import { startTestRun } from '@/test/checkoutFixtures'

vi.mock('next/cache.js', () => ({ revalidatePath: vi.fn() }))
vi.mock('next/server.js', () => ({ after: vi.fn() }))

const run = startTestRun()

// Personal to a visitor or an editor, or transactional: never on a content page,
// so saving one must not throw the whole storefront away. Every other collection
// and global revalidates, which is what stops a new one being forgotten.
const NEVER_REVALIDATING = ['users', 'carts', 'orders', 'paymentEvents', 'mockPaymentSessions']

// Payload's own bookkeeping collections (preferences, locked documents,
// migrations) are added to the config and are not content.
const isPayloadInternal = (slug: string) => slug.startsWith('payload-')

beforeEach(() => {
  vi.mocked(revalidatePath).mockClear()
  vi.mocked(after).mockReset()
  vi.mocked(after).mockImplementation((callback) => {
    if (typeof callback === 'function') void callback()
  })
})

describe('which content triggers storefront revalidation', () => {
  it('is every collection and global except the personal and transactional ones', async () => {
    const { collections, globals } = await config
    const content = [...collections, ...globals].filter(({ slug }) => !isPayloadInternal(slug))

    for (const { slug, hooks } of content) {
      const revalidates = hooks.afterChange.includes(revalidateStorefront)
      expect(revalidates, `${slug} revalidates after a change`).toBe(!NEVER_REVALIDATING.includes(slug))
    }
    for (const { slug, hooks } of collections.filter(({ slug }) => !isPayloadInternal(slug))) {
      expect(hooks.afterDelete.includes(revalidateStorefront), `${slug} revalidates after a delete`).toBe(
        !NEVER_REVALIDATING.includes(slug),
      )
    }
  })

  it('never uses drafts, so a save is always a publish', async () => {
    const { collections } = await config

    for (const collection of collections.filter(({ slug }) => !NEVER_REVALIDATING.includes(slug))) {
      expect(collection.versions, collection.slug).toBeFalsy()
    }
  })
})

describe('the moment of revalidation', () => {
  it('comes after the write has committed', async () => {
    const payload = await getPayload({ config })
    const afterCallbacks: (() => unknown)[] = []
    vi.mocked(after).mockImplementation((callback) => {
      if (typeof callback === 'function') afterCallbacks.push(callback)
    })
    // Asked from a different connection than the write's own transaction, so it
    // sees only what has been committed.
    const committedRowsSeenAtRevalidation: Promise<number>[] = []
    vi.mocked(revalidatePath).mockImplementation(() => {
      committedRowsSeenAtRevalidation.push(
        payload.db.pool.query('select 1 from categories where display_title like $1', [`%${run.id}%`]).then((result) => result.rowCount ?? 0),
      )
    })

    const category = await payload.create({ collection: 'categories', locale: 'he', data: { title: `קטגוריה ${run.id}`, slug: '' } })

    expect(revalidatePath, 'nothing is revalidated while the transaction is open').not.toHaveBeenCalled()
    expect(afterCallbacks).toHaveLength(1)

    afterCallbacks.forEach((callback) => callback())
    expect(await Promise.all(committedRowsSeenAtRevalidation)).toEqual([1])

    vi.mocked(revalidatePath).mockReset()
    await payload.delete({ collection: 'categories', id: category.id, context: SKIP_STOREFRONT_REVALIDATION })
  })
})

describe('saving and deleting storefront content', () => {
  it('revalidates when a book is created, changed and deleted', async () => {
    const payload = await getPayload({ config })

    const book = await payload.create({
      collection: 'books',
      locale: 'he',
      data: { title: `ספר ${run.id}`, slug: '', urlSlug: '', bookLanguage: 'he', prices: [{ currency: 'ILS', amount: 55 }], shippingUnits: 1 },
    })
    expect(revalidatePath).toHaveBeenCalledTimes(1)

    await payload.update({ collection: 'books', id: book.id, locale: 'he', data: { subtitle: 'x' } })
    expect(revalidatePath).toHaveBeenCalledTimes(2)

    await payload.delete({ collection: 'books', id: book.id })
    expect(revalidatePath).toHaveBeenCalledTimes(3)
    expect(revalidatePath).toHaveBeenLastCalledWith('/', 'layout')
  })

  it('revalidates when a category is created, changed and deleted', async () => {
    const payload = await getPayload({ config })

    const category = await payload.create({ collection: 'categories', locale: 'he', data: { title: `קטגוריה ${run.id}`, slug: '' } })
    await payload.update({ collection: 'categories', id: category.id, locale: 'he', data: { title: `קטגוריה ב ${run.id}` } })
    await payload.delete({ collection: 'categories', id: category.id })

    expect(revalidatePath).toHaveBeenCalledTimes(3)
  })

  it('revalidates when a page is created, changed and deleted', async () => {
    const payload = await getPayload({ config })

    const page = await payload.create({ collection: 'pages', locale: 'he', data: { title: `עמוד ${run.id}`, slug: '' } })
    await payload.update({ collection: 'pages', id: page.id, locale: 'he', data: { eyebrow: 'x' } })
    await payload.delete({ collection: 'pages', id: page.id })

    expect(revalidatePath).toHaveBeenCalledTimes(3)
  })

  it('revalidates when an announcement is created, changed and deleted', async () => {
    const payload = await getPayload({ config })

    const announcement = await payload.create({
      collection: 'announcements',
      locale: 'he',
      data: { title: `הודעה ${run.id}`, startsAt: '2026-09-24T10:00:00.000Z' },
    })
    await payload.update({ collection: 'announcements', id: announcement.id, locale: 'he', data: { title: `הודעה ב ${run.id}` } })
    await payload.delete({ collection: 'announcements', id: announcement.id })

    expect(revalidatePath).toHaveBeenCalledTimes(3)
  })

  it('revalidates when an event is created, changed and deleted', async () => {
    const payload = await getPayload({ config })

    const event = await payload.create({
      collection: 'events',
      locale: 'he',
      data: { title: `אירוע ${run.id}`, startsAt: '2026-09-24T10:00:00.000Z' },
    })
    await payload.update({ collection: 'events', id: event.id, locale: 'he', data: { location: 'x' } })
    await payload.delete({ collection: 'events', id: event.id })

    expect(revalidatePath).toHaveBeenCalledTimes(3)
  })

  it('revalidates when a global is saved', async () => {
    const payload = await getPayload({ config })

    await payload.updateGlobal({ slug: 'schedule', data: {} })
    await payload.updateGlobal({ slug: 'siteSettings', data: {} })
    await payload.updateGlobal({ slug: 'shippingSettings', data: {} })

    expect(revalidatePath).toHaveBeenCalledTimes(3)
  })

  it('does not revalidate for a write that opts out', async () => {
    const payload = await getPayload({ config })

    const category = await payload.create({
      collection: 'categories',
      locale: 'he',
      data: { title: `קטגוריה ${run.id}`, slug: '' },
      context: SKIP_STOREFRONT_REVALIDATION,
    })
    await payload.delete({ collection: 'categories', id: category.id, context: SKIP_STOREFRONT_REVALIDATION })

    expect(revalidatePath).not.toHaveBeenCalled()
  })
})

describe('saving personal content', () => {
  it('does not revalidate when a cart changes', async () => {
    const payload = await getPayload({ config })

    const cart = await payload.create({ collection: 'carts', data: { sessionId: run.id, items: [] } })
    await payload.delete({ collection: 'carts', id: cart.id })

    expect(revalidatePath).not.toHaveBeenCalled()
  })
})
