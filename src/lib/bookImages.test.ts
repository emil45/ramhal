import { describe, expect, it } from 'vitest'

import { collectBookImages } from '@/lib/bookImages'

import type { Media } from '@/payload-types'

function media(id: number): Media {
  return { id, updatedAt: '2026-10-29T00:00:00.000Z', createdAt: '2026-10-29T00:00:00.000Z' }
}

describe('collectBookImages', () => {
  it('puts the cover first and the gallery after it, in gallery order', () => {
    const images = collectBookImages(media(1), [{ image: media(3) }, { image: media(2) }])
    expect(images.map((image) => image.id)).toEqual([1, 3, 2])
  })

  it('shows a book with no cover from its gallery alone', () => {
    expect(collectBookImages(null, [{ image: media(5) }]).map((image) => image.id)).toEqual([5])
  })

  it('returns nothing for a book without pictures', () => {
    expect(collectBookImages(undefined, undefined)).toEqual([])
    expect(collectBookImages(null, [])).toEqual([])
  })

  it('does not show a picture twice when the gallery repeats the cover', () => {
    const images = collectBookImages(media(1), [{ image: media(1) }, { image: media(2) }, { image: media(2) }])
    expect(images.map((image) => image.id)).toEqual([1, 2])
  })

  it('drops a reference that was not loaded', () => {
    const images = collectBookImages(7, [{ image: 8 }, { image: media(2) }])
    expect(images.map((image) => image.id)).toEqual([2])
  })
})
