import { describe, expect, it } from 'vitest'

import { validateShippingAmounts } from '@/lib/admin/validateShippingAmounts'

describe('validateShippingAmounts', () => {
  it('accepts one amount in each currency, in any order', () => {
    expect(validateShippingAmounts([{ currency: 'USD' }, { currency: 'ILS' }, { currency: 'EUR' }])).toBe(true)
  })

  it('names the currencies that have no amount', () => {
    const result = validateShippingAmounts([{ currency: 'ILS' }])

    expect(result).toContain('EUR')
    expect(result).toContain('USD')
    expect(result).not.toContain('ILS')
  })

  it('treats an empty or absent list as missing every currency', () => {
    expect(validateShippingAmounts([])).not.toBe(true)
    expect(validateShippingAmounts(null)).not.toBe(true)
  })

  it('rejects a currency listed twice, which would make the amount ambiguous', () => {
    const result = validateShippingAmounts([{ currency: 'ILS' }, { currency: 'ILS' }, { currency: 'EUR' }, { currency: 'USD' }])

    expect(result).toContain('ILS')
    expect(result).not.toBe(true)
  })
})
