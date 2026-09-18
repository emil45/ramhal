import { describe, expect, it } from 'vitest'

import { filterCatalogue, normalizeForSearch } from '@/lib/bookSearch'

describe('normalizeForSearch', () => {
  it('treats gershayim, ASCII quote, and no quote as the same text', () => {
    expect(normalizeForSearch('רמח״ל')).toBe(normalizeForSearch('רמח"ל'))
    expect(normalizeForSearch('רמח"ל')).toBe(normalizeForSearch('רמחל'))
  })

  it('is case-insensitive', () => {
    expect(normalizeForSearch('Mesillat Yesharim')).toBe(normalizeForSearch('MESILLAT YESHARIM'))
  })
})

describe('filterCatalogue', () => {
  const entries = [
    { bookLanguage: 'he', categorySlug: 'hebrew-books', title: 'רמח״ל - מסילת ישרים' },
    { bookLanguage: 'fr', categorySlug: 'french-books', title: "L'essence de la Torah" },
    { bookLanguage: 'he', categorySlug: 'siddurim-machzorim', title: 'סידור כוונות' },
  ]

  it('finds a gershayim title by an ASCII-quote query', () => {
    const result = filterCatalogue(entries, { query: 'רמח"ל' })
    expect(result).toHaveLength(1)
    expect(result[0].title).toContain('מסילת ישרים')
  })

  it('filters by category', () => {
    expect(filterCatalogue(entries, { categorySlug: 'french-books' })).toHaveLength(1)
  })

  it('filters by book language', () => {
    expect(filterCatalogue(entries, { bookLanguage: 'he' })).toHaveLength(2)
  })

  it('combines filters', () => {
    expect(filterCatalogue(entries, { bookLanguage: 'he', query: 'סידור' })).toHaveLength(1)
  })

  it('returns everything when no filter is set', () => {
    expect(filterCatalogue(entries, {})).toHaveLength(3)
  })
})
