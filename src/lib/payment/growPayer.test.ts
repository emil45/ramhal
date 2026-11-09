import { describe, expect, it } from 'vitest'

import { toGrowPayer } from '@/lib/payment/growPayer'

const PAYER = { name: 'ישראל ישראלי', email: 'buyer@example.com', phone: '050-123-4567' }

describe('toGrowPayer', () => {
  it('normalises the phone to the local mobile form and tidies the name', () => {
    expect(toGrowPayer({ ...PAYER, name: '  ישראל   ישראלי ', phone: '+972 50 123 4567' })).toEqual({
      fullName: 'ישראל ישראלי',
      phone: '0501234567',
      email: 'buyer@example.com',
    })
  })

  it('refuses a single name, which Grow rejects', () => {
    expect(toGrowPayer({ ...PAYER, name: 'ישראלי' })).toBeNull()
  })

  it('refuses a name part shorter than two characters', () => {
    expect(toGrowPayer({ ...PAYER, name: 'ישראל י' })).toBeNull()
  })

  it('refuses a phone that is not an Israeli mobile', () => {
    expect(toGrowPayer({ ...PAYER, phone: '+33 6 12 34 56 78' })).toBeNull()
  })
})
