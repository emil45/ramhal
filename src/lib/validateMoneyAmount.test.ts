import { describe, expect, it } from 'vitest'

import { hasAtMostTwoDecimalPlaces, validateMoneyAmount } from '@/lib/validateMoneyAmount'

import type { NumberField, PayloadRequest, ValidateOptions } from 'payload'

describe('hasAtMostTwoDecimalPlaces', () => {
  it('accepts a whole number', () => {
    expect(hasAtMostTwoDecimalPlaces(55)).toBe(true)
  })

  it('accepts an amount with exactly two decimal places', () => {
    expect(hasAtMostTwoDecimalPlaces(55.5)).toBe(true)
    expect(hasAtMostTwoDecimalPlaces(19.99)).toBe(true)
  })

  it('rejects a third decimal place', () => {
    expect(hasAtMostTwoDecimalPlaces(19.999)).not.toBe(true)
  })

  it('accepts an absent value, leaving required-ness to the field itself', () => {
    expect(hasAtMostTwoDecimalPlaces(null)).toBe(true)
    expect(hasAtMostTwoDecimalPlaces(undefined)).toBe(true)
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
    expect(validateMoneyAmount(-19.9, fieldOptions)).not.toBe(true)
  })

  it('rejects a missing amount on a required field', () => {
    expect(validateMoneyAmount(null, fieldOptions)).not.toBe(true)
  })

  it('rejects a third decimal place', () => {
    expect(validateMoneyAmount(19.999, fieldOptions)).not.toBe(true)
  })

  it('accepts a valid, non-negative amount in major units', () => {
    expect(validateMoneyAmount(55, fieldOptions)).toBe(true)
    expect(validateMoneyAmount(19.99, fieldOptions)).toBe(true)
  })
})
