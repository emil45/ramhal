import { describe, expect, it } from 'vitest'

import { coverRuleColour, coverTitleWidthPercent } from '@/lib/cover'

describe('coverTitleWidthPercent', () => {
  it('sets a short title larger than a long one', () => {
    expect(coverTitleWidthPercent('אדיר במרום')).toBeGreaterThan(coverTitleWidthPercent('The Kabbalah of the Ari Z’al, according to the Ramhal'))
  })

  it('never grows as the title gets longer', () => {
    const sizes = [1, 10, 12, 13, 24, 25, 44, 45, 80, 81, 200].map((length) => coverTitleWidthPercent('א'.repeat(length)))
    for (let index = 1; index < sizes.length; index++) {
      expect(sizes[index]).toBeLessThanOrEqual(sizes[index - 1])
    }
  })

  it('ignores surrounding whitespace when measuring', () => {
    expect(coverTitleWidthPercent('   מסילת ישרים   ')).toBe(coverTitleWidthPercent('מסילת ישרים'))
  })
})

describe('coverRuleColour', () => {
  it('colours a Hebrew book teal', () => {
    expect(coverRuleColour({ bookLanguage: 'he', categorySlug: null })).toBe('var(--teal)')
  })

  it('colours a French book gold', () => {
    expect(coverRuleColour({ bookLanguage: 'fr', categorySlug: null })).toBe('var(--gold)')
  })

  it('colours an English book deep teal', () => {
    expect(coverRuleColour({ bookLanguage: 'en', categorySlug: null })).toBe('var(--teal-deep)')
  })

  it('colours a siddur/machzor gold-ink regardless of its language', () => {
    expect(coverRuleColour({ bookLanguage: 'he', categorySlug: 'siddurim-machzorim' })).toBe('var(--gold-ink)')
    expect(coverRuleColour({ bookLanguage: 'fr', categorySlug: 'siddurim-machzorim' })).toBe('var(--gold-ink)')
  })

  it('falls back to the default rule colour for a bilingual, uncertain or missing language', () => {
    const fallback = coverRuleColour({ bookLanguage: 'unknown', categorySlug: null })
    expect(fallback).toMatch(/^var\(--/)
    expect(coverRuleColour({ bookLanguage: 'he-fr', categorySlug: null })).toBe(fallback)
    expect(coverRuleColour({ bookLanguage: 'aramaic-fr', categorySlug: undefined })).toBe(fallback)
  })
})
