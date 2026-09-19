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
  it('gives each shelf its own rule colour', () => {
    const colours = ['hebrew-books', 'french-books', 'english-books'].map(coverRuleColour)
    expect(new Set(colours).size).toBe(3)
  })

  it('falls back to a brand colour for an unknown or missing category', () => {
    expect(coverRuleColour(null)).toBe(coverRuleColour('not-a-shelf'))
    expect(coverRuleColour(undefined)).toMatch(/^var\(--/)
  })
})
