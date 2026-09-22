import { describe, expect, it } from 'vitest'

import { parseCheckoutForm } from '@/lib/checkoutForm'

function form(fields: Record<string, string>): FormData {
  const data = new FormData()
  for (const [name, value] of Object.entries(fields)) data.set(name, value)
  return data
}

const validDelivery = {
  name: 'דנה כהן',
  email: 'dana@example.com',
  phone: '+972 50-123-4567',
  countryCode: 'IL',
  addressLine1: 'הרצל 1',
  city: 'תל אביב',
  postalCode: '6100000',
  expectedTotal: '8500',
}

describe('parseCheckoutForm', () => {
  it('accepts a complete delivery order', () => {
    const result = parseCheckoutForm(form(validDelivery))

    expect(result).toEqual({
      ok: true,
      values: {
        name: 'דנה כהן',
        email: 'dana@example.com',
        phone: '+972 50-123-4567',
        countryCode: 'IL',
        isPickup: false,
        address: { line1: 'הרצל 1', line2: '', city: 'תל אביב', postalCode: '6100000' },
        expectedTotal: 8500,
      },
    })
  })

  it('needs no postal address for self-pickup', () => {
    const result = parseCheckoutForm(
      form({ name: 'דנה', email: 'dana@example.com', phone: '0501234567', countryCode: 'IL', pickup: 'on', expectedTotal: '55.50' }),
    )

    expect(result).toMatchObject({ ok: true, values: { isPickup: true } })
  })

  it('accepts an expected total with exactly two decimal places', () => {
    const result = parseCheckoutForm(form({ ...validDelivery, expectedTotal: '12.50' }))

    expect(result).toMatchObject({ ok: true, values: { expectedTotal: 12.5 } })
  })

  it('reports every missing required field', () => {
    const result = parseCheckoutForm(form({ expectedTotal: '100' }))

    expect(result).toEqual({
      ok: false,
      errors: {
        name: 'required',
        email: 'required',
        phone: 'required',
        countryCode: 'required',
        addressLine1: 'required',
        city: 'required',
        postalCode: 'required',
      },
    })
  })

  it('rejects a malformed email and a phone number with too few digits', () => {
    const result = parseCheckoutForm(form({ ...validDelivery, email: 'not-an-email', phone: '12-34' }))

    expect(result).toMatchObject({ ok: false, errors: { email: 'invalid', phone: 'invalid' } })
  })

  it.each(['', 'abc', '-5', '12.555'])('rejects an expected total of "%s"', (expectedTotal) => {
    const result = parseCheckoutForm(form({ ...validDelivery, expectedTotal }))

    expect(result).toMatchObject({ ok: false, errors: { expectedTotal: 'invalid' } })
  })
})
