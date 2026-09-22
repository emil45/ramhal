import { describe, expect, it } from 'vitest'

import { buildBookInput, localizeTitles } from './importBooks.ts'

import type { ImportView } from './importBooks.ts'

function view(overrides: Partial<ImportView> = {}): ImportView {
  return {
    categories: {},
    descriptions: {},
    images: {},
    legacyUrls: [],
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
  it('assigns a reviewed French title to french-books instead of leaving bookLanguage unknown', () => {
    // "La voix des justes" — REVIEW-01-findings.md #7's own example of a
    // Latin-script title script detection cannot place — has since been read
    // by a human and confirmed French; see REVIEWED_LANGUAGE.
    const input = buildBookInput('La voix des justes', view(), { fr: 'La voix des justes' }, null)

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
})
