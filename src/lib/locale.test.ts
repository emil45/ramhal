import { describe, expect, it } from 'vitest'

import { isLocale, LOCALE_CONFIG, LOCALES } from '@/lib/locale'

describe('isLocale', () => {
  it('accepts every configured locale', () => {
    for (const locale of LOCALES) expect(isLocale(locale)).toBe(true)
  })

  it('rejects an unconfigured value', () => {
    expect(isLocale('de')).toBe(false)
    expect(isLocale('')).toBe(false)
  })
})

describe('LOCALE_CONFIG', () => {
  it('maps each locale to its settled currency (docs/DECISIONS.md §2, §8)', () => {
    expect(LOCALE_CONFIG.he.currency).toBe('ILS')
    expect(LOCALE_CONFIG.fr.currency).toBe('EUR')
    expect(LOCALE_CONFIG.en.currency).toBe('USD')
  })

  it('marks Hebrew right-to-left and the others left-to-right', () => {
    expect(LOCALE_CONFIG.he.direction).toBe('rtl')
    expect(LOCALE_CONFIG.en.direction).toBe('ltr')
    expect(LOCALE_CONFIG.fr.direction).toBe('ltr')
  })
})
