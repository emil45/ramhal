import { describe, expect, it } from 'vitest'

import { validateIntegerAmount } from '@/lib/validateIntegerAmount'

describe('validateIntegerAmount', () => {
  it('accepts a whole number', () => {
    expect(validateIntegerAmount(5500)).toBe(true)
  })

  it('rejects a decimal', () => {
    expect(validateIntegerAmount(55.5)).not.toBe(true)
  })

  it('accepts an absent value, leaving required-ness to the field itself', () => {
    expect(validateIntegerAmount(null)).toBe(true)
    expect(validateIntegerAmount(undefined)).toBe(true)
  })
})
