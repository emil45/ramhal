import config from '@payload-config'
import { revalidatePath } from 'next/cache.js'
import { getPayload } from 'payload'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SKIP_STOREFRONT_REVALIDATION } from './revalidateStorefront'
import { startTestRun } from '@/test/checkoutFixtures'

import type { CollectionSlug } from 'payload'

vi.mock('next/cache.js', () => ({ revalidatePath: vi.fn() }))

const run = startTestRun()

// Everything a storefront page renders, and nothing else. Users, carts, orders
// and payment records are personal to a visitor or an editor and never appear
// on a content page, so saving one must not throw the whole storefront away.
const COLLECTIONS_THE_STOREFRONT_RENDERS: CollectionSlug[] = [
  'announcements',
  'books',
  'categories',
  'events',
  'media',
  'pages',
]
const GLOBALS_THE_STOREFRONT_RENDERS = ['schedule', 'siteSettings']

beforeEach(() => {
  vi.mocked(revalidatePath).mockClear()
})

describe('which content triggers storefront revalidation', () => {
  it('is exactly the content the storefront renders', async () => {
    const { collections, globals } = await config

    const revalidating = (hooks: { afterChange?: unknown[] }) => hooks.afterChange?.length
    expect(collections.filter((collection) => revalidating(collection.hooks)).map(({ slug }) => slug).sort()).toEqual(
      COLLECTIONS_THE_STOREFRONT_RENDERS,
    )
    expect(globals.filter((global) => revalidating(global.hooks)).map(({ slug }) => slug).sort()).toEqual(
      GLOBALS_THE_STOREFRONT_RENDERS,
    )
  })

  it('never uses drafts, so a save is always a publish', async () => {
    const { collections } = await config

    for (const collection of collections.filter(({ slug }) => COLLECTIONS_THE_STOREFRONT_RENDERS.includes(slug))) {
      expect(collection.versions, collection.slug).toBeFalsy()
    }
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

  it('revalidates when the schedule or the site settings are saved', async () => {
    const payload = await getPayload({ config })

    await payload.updateGlobal({ slug: 'schedule', data: {} })
    await payload.updateGlobal({ slug: 'siteSettings', data: {} })

    expect(revalidatePath).toHaveBeenCalledTimes(2)
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

describe('saving content the storefront does not render', () => {
  it('does not revalidate when shipping settings or a cart change', async () => {
    const payload = await getPayload({ config })

    await payload.updateGlobal({ slug: 'shippingSettings', data: {} })
    const cart = await payload.create({ collection: 'carts', data: { sessionId: run.id, items: [] } })
    await payload.delete({ collection: 'carts', id: cart.id })

    expect(revalidatePath).not.toHaveBeenCalled()
  })
})
