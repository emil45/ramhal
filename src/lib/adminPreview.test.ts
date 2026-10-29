import { describe, expect, it } from 'vitest'

import { bookPreviewPath, pagePreviewPath } from '@/lib/adminPreview'

describe('bookPreviewPath', () => {
  it('points at the book page in the language being edited', () => {
    expect(bookPreviewPath({ urlSlug: 'mesillat-yesharim' }, 'he')).toBe('/ספר/mesillat-yesharim')
    expect(bookPreviewPath({ urlSlug: 'mesillat-yesharim' }, 'fr')).toBe('/fr/livre/mesillat-yesharim')
  })

  it('has no preview before the book has a slug', () => {
    expect(bookPreviewPath({}, 'he')).toBeNull()
    expect(bookPreviewPath({ urlSlug: '' }, 'he')).toBeNull()
  })

  it('has no preview for a locale the site does not serve', () => {
    expect(bookPreviewPath({ urlSlug: 'mesillat-yesharim' }, 'de')).toBeNull()
  })
})

describe('pagePreviewPath', () => {
  it('points at each narrative page, prefixed for every locale but Hebrew', () => {
    expect(pagePreviewPath({ slug: 'beit-ramhal' }, 'he')).toBe('/beit-ramhal')
    expect(pagePreviewPath({ slug: 'rabbi-chriqui' }, 'en')).toBe('/en/rabbi-chriqui')
  })

  it('has no preview for a page that has no route', () => {
    expect(pagePreviewPath({ slug: 'some-new-page' }, 'he')).toBeNull()
    expect(pagePreviewPath({}, 'he')).toBeNull()
  })
})
