import { describe, expect, it } from 'vitest'

import { slugify } from '@/lib/slugify'

describe('slugify', () => {
  it('lowercases and hyphenates a Latin title', () => {
    expect(slugify('The Path of the Just')).toBe('the-path-of-the-just')
  })

  it('strips Hebrew niqqud and gershayim without dropping the letters', () => {
    expect(slugify('רמח״ל')).toBe('רמחל')
  })

  it('collapses punctuation and whitespace into single hyphens', () => {
    expect(slugify('  Mesillat   Yesharim!! ')).toBe('mesillat-yesharim')
  })

  it('keeps accented French letters intact and drops apostrophes rather than hyphenating them', () => {
    expect(slugify("L'éthique juive")).toBe('léthique-juive')
  })
})
