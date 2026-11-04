import { describe, expect, it } from 'vitest'

import { calculateShipping, zoneServesCurrency, type ShippingTier, type ShippingZone } from '@/lib/shop/shipping'

const amounts = (ils: number, eur: number, usd: number): ShippingTier['amounts'] => [
  { currency: 'ILS', amount: ils },
  { currency: 'EUR', amount: eur },
  { currency: 'USD', amount: usd },
]

// Israel ₪30 / €8 / $9 with free self-pickup, Europe €50 / ₪190 / $55,
// the rest of the world $86 / ₪310 / €80, free shipping above 10 units
// everywhere. Every zone quotes in every currency.
const zones: ShippingZone[] = [
  {
    name: 'ישראל',
    countries: ['IL'],
    tiers: [{ minUnits: 0, amounts: amounts(30, 8, 9) }],
    freeAboveUnits: 10,
    allowPickup: true,
    isDefault: false,
  },
  {
    name: 'אירופה',
    countries: ['FR', 'DE', 'GB'],
    tiers: [{ minUnits: 0, amounts: amounts(190, 50, 55) }],
    freeAboveUnits: 10,
    allowPickup: false,
    isDefault: false,
  },
  {
    name: 'שאר העולם',
    countries: ['US', 'CA'],
    tiers: [{ minUnits: 0, amounts: amounts(310, 80, 86) }],
    freeAboveUnits: 10,
    allowPickup: false,
    isDefault: true,
  },
]

describe('calculateShipping', () => {
  it('charges the tier amount below the free threshold', () => {
    const quote = calculateShipping(zones, { countryCode: 'IL', units: 1, currency: 'ILS' })
    expect(quote).toEqual({ zoneName: 'ישראל', currency: 'ILS', amount: 30, allowPickup: true })
  })

  it('quotes the destination zone in the customer currency, whatever the destination', () => {
    const frenchReaderInIsrael = calculateShipping(zones, { countryCode: 'IL', units: 1, currency: 'EUR' })
    const englishReaderInFrance = calculateShipping(zones, { countryCode: 'FR', units: 1, currency: 'USD' })
    const hebrewReaderInTheUnitedStates = calculateShipping(zones, { countryCode: 'US', units: 1, currency: 'ILS' })

    expect(frenchReaderInIsrael).toMatchObject({ zoneName: 'ישראל', currency: 'EUR', amount: 8 })
    expect(englishReaderInFrance).toMatchObject({ zoneName: 'אירופה', currency: 'USD', amount: 55 })
    expect(hebrewReaderInTheUnitedStates).toMatchObject({ zoneName: 'שאר העולם', currency: 'ILS', amount: 310 })
  })

  it('picks the highest tier whose minUnits does not exceed the cart, at the boundary', () => {
    const tieredZones: ShippingZone[] = [
      {
        name: 'ישראל',
        countries: ['IL'],
        tiers: [
          { minUnits: 0, amounts: amounts(30, 8, 9) },
          { minUnits: 5, amounts: amounts(20, 5, 6) },
        ],
        freeAboveUnits: 10,
        allowPickup: true,
        isDefault: true,
      },
    ]

    expect(calculateShipping(tieredZones, { countryCode: 'IL', units: 4, currency: 'EUR' }).amount).toBe(8)
    expect(calculateShipping(tieredZones, { countryCode: 'IL', units: 5, currency: 'EUR' }).amount).toBe(5)
  })

  it('is free at and above freeAboveUnits', () => {
    const atThreshold = calculateShipping(zones, { countryCode: 'FR', units: 10, currency: 'EUR' })
    const aboveThreshold = calculateShipping(zones, { countryCode: 'FR', units: 11, currency: 'EUR' })

    expect(atThreshold.amount).toBe(0)
    expect(aboveThreshold.amount).toBe(0)
  })

  it('falls back to the zone flagged isDefault for an unrecognised country', () => {
    const quote = calculateShipping(zones, { countryCode: 'ZZ', units: 1, currency: 'USD' })
    expect(quote).toEqual({ zoneName: 'שאר העולם', currency: 'USD', amount: 86, allowPickup: false })
  })

  it('refuses to guess an amount for a currency the zone does not quote', () => {
    const shekelOnly: ShippingZone[] = [
      { name: 'ישראל', countries: ['IL'], tiers: [{ minUnits: 0, amounts: [{ currency: 'ILS', amount: 30 }] }], freeAboveUnits: null, allowPickup: true, isDefault: true },
    ]

    expect(() => calculateShipping(shekelOnly, { countryCode: 'IL', units: 1, currency: 'EUR' })).toThrow(/EUR/)
  })
})

describe('zoneServesCurrency', () => {
  it('is true when every tier carries an amount in the currency', () => {
    expect(zoneServesCurrency({ tiers: [{ minUnits: 0, amounts: amounts(1, 1, 1) }, { minUnits: 5, amounts: amounts(1, 1, 1) }] }, 'EUR')).toBe(true)
  })

  it('is false when any tier lacks the currency, since some carts would be unpriced', () => {
    const tiers = [
      { minUnits: 0, amounts: amounts(1, 1, 1) },
      { minUnits: 5, amounts: [{ currency: 'ILS' as const, amount: 1 }] },
    ]

    expect(zoneServesCurrency({ tiers }, 'ILS')).toBe(true)
    expect(zoneServesCurrency({ tiers }, 'EUR')).toBe(false)
  })
})
