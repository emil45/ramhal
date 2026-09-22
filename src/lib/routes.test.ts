import { describe, expect, it } from 'vitest'

import { bookPath, cataloguePath, coursesPath, localePath } from '@/lib/routes'

describe('localePath', () => {
  it('gives Hebrew no prefix', () => {
    expect(localePath('he', '/')).toBe('/')
    expect(localePath('he', '/cart')).toBe('/cart')
  })

  it('prefixes every other locale', () => {
    expect(localePath('en', '/')).toBe('/en')
    expect(localePath('fr', '/cart')).toBe('/fr/cart')
  })
})

describe('bookPath', () => {
  it('uses each locale’s own word for "book"', () => {
    expect(bookPath('he', 'מסילת-ישרים')).toBe('/ספר/מסילת-ישרים')
    expect(bookPath('en', 'the-path-of-the-just')).toBe('/en/book/the-path-of-the-just')
    expect(bookPath('fr', 'la-voie-des-justes')).toBe('/fr/livre/la-voie-des-justes')
  })
})

describe('cataloguePath', () => {
  it('uses each locale’s own word for "books", distinct from the front page', () => {
    expect(cataloguePath('he')).toBe('/ספרים')
    expect(cataloguePath('en')).toBe('/en/books')
    expect(cataloguePath('fr')).toBe('/fr/livres')
  })
})

describe('coursesPath', () => {
  it('uses the shared courses segment under the locale root', () => {
    expect(coursesPath('he')).toBe('/courses')
    expect(coursesPath('en')).toBe('/en/courses')
    expect(coursesPath('fr')).toBe('/fr/courses')
  })
})
