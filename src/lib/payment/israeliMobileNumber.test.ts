import { describe, expect, it } from 'vitest'

import { toIsraeliMobileNumber } from '@/lib/payment/israeliMobileNumber'

describe('toIsraeliMobileNumber', () => {
  it.each([
    ['0501234567', '0501234567'],
    ['050-123-4567', '0501234567'],
    ['050 123 4567', '0501234567'],
    ['+972 50 123 4567', '0501234567'],
    ['972501234567', '0501234567'],
    ['(050) 123-4567', '0501234567'],
  ])('reads %s as %s', (typed, expected) => {
    expect(toIsraeliMobileNumber(typed)).toBe(expected)
  })

  it.each([
    ['a landline', '03-123-4567'],
    ['a French mobile', '+33 6 12 34 56 78'],
    ['a US number', '+1 212 555 0100'],
    ['too short', '050123456'],
    ['too long', '05012345678'],
    ['empty', ''],
  ])('refuses %s', (_label, typed) => {
    expect(toIsraeliMobileNumber(typed)).toBeNull()
  })
})
