import { describe, expect, it } from 'vitest'

import { calculateShipping, type ShippingZone } from '@/lib/shipping'

// Seeded from docs/tasks/TASK-01-payload-setup.md §5: Israel ₪30 with free
// self-pickup, Europe €50, rest of world $86, free shipping above 10 units
// everywhere.
const zones: ShippingZone[] = [
  {
    name: 'ישראל',
    countries: ['IL'],
    currency: 'ILS',
    tiers: [{ minUnits: 0, amount: 3000 }],
    freeAboveUnits: 10,
    allowPickup: true,
    isDefault: false,
  },
  {
    name: 'אירופה',
    countries: ['FR', 'DE', 'GB'],
    currency: 'EUR',
    tiers: [{ minUnits: 0, amount: 5000 }],
    freeAboveUnits: 10,
    allowPickup: false,
    isDefault: false,
  },
  {
    name: 'שאר העולם',
    countries: ['US', 'CA'],
    currency: 'USD',
    tiers: [{ minUnits: 0, amount: 8600 }],
    freeAboveUnits: 10,
    allowPickup: false,
    isDefault: true,
  },
]

describe('calculateShipping', () => {
  it('charges the tier amount below the free threshold', () => {
    const quote = calculateShipping(zones, { countryCode: 'IL', units: 1 })
    expect(quote).toEqual({ zoneName: 'ישראל', currency: 'ILS', amount: 3000, allowPickup: true })
  })

  it('picks the highest tier whose minUnits does not exceed the cart, at the boundary', () => {
    const tieredZones: ShippingZone[] = [
      {
        name: 'ישראל',
        countries: ['IL'],
        currency: 'ILS',
        tiers: [
          { minUnits: 0, amount: 3000 },
          { minUnits: 5, amount: 2000 },
        ],
        freeAboveUnits: 10,
        allowPickup: true,
        isDefault: true,
      },
    ]

    expect(calculateShipping(tieredZones, { countryCode: 'IL', units: 4 }).amount).toBe(3000)
    expect(calculateShipping(tieredZones, { countryCode: 'IL', units: 5 }).amount).toBe(2000)
  })

  it('is free at and above freeAboveUnits', () => {
    const atThreshold = calculateShipping(zones, { countryCode: 'FR', units: 10 })
    const aboveThreshold = calculateShipping(zones, { countryCode: 'FR', units: 11 })

    expect(atThreshold.amount).toBe(0)
    expect(aboveThreshold.amount).toBe(0)
  })

  it('falls back to the zone flagged isDefault for an unrecognised country', () => {
    const quote = calculateShipping(zones, { countryCode: 'ZZ', units: 1 })
    expect(quote).toEqual({ zoneName: 'שאר העולם', currency: 'USD', amount: 8600, allowPickup: false })
  })
})
