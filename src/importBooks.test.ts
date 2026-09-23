import { describe, expect, it } from 'vitest'

import { buildBookInput, localizeTitles, newPriceRowsFor } from './importBooks.ts'

import type { ImportView } from './importBooks.ts'

function view(overrides: Partial<ImportView> = {}): ImportView {
  return {
    categories: {},
    descriptions: {},
    images: {},
    legacyUrls: [{ site: 'he', url: 'https://www.ramhal.com/example.html' }],
    missingDescriptionIn: [],
    priceImplausible: false,
    priceZero: false,
    prices: { fr: { currency: '€', raw: '10€', value: 10 } },
    titles: {},
    ...overrides,
  }
}

describe('localizeTitles', () => {
  it('leaves a genuine Hebrew-site entry under he', () => {
    expect(localizeTitles({ he: 'מסילת ישרים' })).toEqual({ he: 'מסילת ישרים' })
  })

  it('leaves genuine Latin-script site entries under their own site', () => {
    expect(localizeTitles({ en: 'The Path of the Just', fr: 'Le Sentier de Rectitude' })).toEqual({
      en: 'The Path of the Just',
      fr: 'Le Sentier de Rectitude',
    })
  })

  it('reassigns a Hebrew-script title to he even when scraped from the fr/en site', () => {
    // The book this happened to: TASK-20's data audit found 21 books whose
    // real Hebrew title was written under fr/en instead, because no
    // matching he-site entry existed to key it correctly.
    expect(localizeTitles({ fr: 'זוהר תניינא חלק א׳' })).toEqual({ he: 'זוהר תניינא חלק א׳' })
  })

  it('drops a duplicate Hebrew title on a second site rather than keeping it under that site too', () => {
    expect(localizeTitles({ he: 'מסילת ישרים', fr: 'מסילת ישרים' })).toEqual({ he: 'מסילת ישרים' })
  })

  it('keeps the first Hebrew-script title when the real he entry is missing but two other sites both carry it', () => {
    expect(localizeTitles({ fr: 'מסילת ישרים', en: 'מסילת ישרים' })).toEqual({ he: 'מסילת ישרים' })
  })
})

describe('buildBookInput reviewed overrides', () => {
  it('keeps a French-shelf book listed on the canonical Hebrew-domain storefront', () => {
    const input = buildBookInput(
      'tikoun olam',
      view({ categories: { he: 'ספרים בצרפתית' } }),
      { he: 'tikoun olam' },
      null,
    )

    expect(input?.bookLanguage).toBe('fr')
    expect(input?.categorySlug).toBe('french-books')
    expect(input?.reviewReasons).not.toContain('language-uncertain')
  })

  it('files a reviewed siddur under siddurim-machzorim despite a plain hebrew-books breadcrumb', () => {
    const input = buildBookInput(
      'סידור שבת פורמט קטן',
      view({ categories: { he: 'ספרים בעברית' } }),
      { he: 'סידור שבת פורמט קטן' },
      null,
    )

    expect(input?.categorySlug).toBe('siddurim-machzorim')
  })

  it('leaves an unreviewed hebrew-books breadcrumb alone', () => {
    const input = buildBookInput('מסילת ישרים', view({ categories: { he: 'ספרים בעברית' } }), { he: 'מסילת ישרים' }, null)

    expect(input?.categorySlug).toBe('hebrew-books')
  })

  it('skips a listing that exists only on a non-canonical legacy storefront', () => {
    const input = buildBookInput(
      'דרך ה',
      view({
        categories: { en: 'Hebrew Books' },
        legacyUrls: [{ site: 'en', url: 'https://www.enramhal.com/extra.html' }],
      }),
      { en: 'דרך ה׳' },
      null,
    )

    expect(input).toBeNull()
  })
})

describe('newPriceRowsFor', () => {
  it('adds a currency the existing record lacks', () => {
    expect(newPriceRowsFor([{ amount: 50, currency: 'ILS' }], [{ amount: 30, currency: 'USD' }])).toEqual([
      { amount: 30, currency: 'USD' },
    ])
  })

  it('never replaces an existing currency, even at a different amount', () => {
    expect(newPriceRowsFor([{ amount: 50, currency: 'ILS' }], [{ amount: 999, currency: 'ILS' }])).toEqual([])
  })

  it('adds nothing when every candidate currency is already present', () => {
    expect(
      newPriceRowsFor(
        [
          { amount: 50, currency: 'ILS' },
          { amount: 30, currency: 'USD' },
        ],
        [{ amount: 30, currency: 'USD' }],
      ),
    ).toEqual([])
  })
})
