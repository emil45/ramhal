import { describe, expect, it } from 'vitest'

import { validateIntegerAmount, validateMoneyAmount } from '@/lib/validateIntegerAmount'

import type { NumberField, PayloadRequest, ValidateOptions } from 'payload'

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

// The field as it is actually configured in Books/ShippingSettings: `min: 0`,
// `required: true`, `validate: validateMoneyAmount`. Payload calls the
// configured validator with these options at runtime.
const fieldOptions: ValidateOptions<unknown, unknown, NumberField, number> = {
  blockData: {},
  data: {},
  min: 0,
  name: 'amount',
  path: ['amount'],
  preferences: { fields: {} },
  req: { t: (key: string) => key } as unknown as PayloadRequest,
  required: true,
  siblingData: {},
  type: 'number',
}

describe('validateMoneyAmount (the configured field, not just the predicate)', () => {
  it('rejects a negative amount instead of letting min: 0 be ignored', () => {
    expect(validateMoneyAmount(-100, fieldOptions)).not.toBe(true)
  })

  it('rejects a missing amount on a required field', () => {
    expect(validateMoneyAmount(null, fieldOptions)).not.toBe(true)
  })

  it('rejects a fractional amount', () => {
    expect(validateMoneyAmount(55.5, fieldOptions)).not.toBe(true)
  })

  it('accepts a valid whole, non-negative amount', () => {
    expect(validateMoneyAmount(5500, fieldOptions)).toBe(true)
  })
})
