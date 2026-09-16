import type { Currency } from '@/lib/currency'

export type ShippingTier = {
  minUnits: number
  amount: number
}

export type ShippingZone = {
  name: string
  countries: string[]
  currency: Currency
  tiers: ShippingTier[]
  freeAboveUnits: number | null
  allowPickup: boolean
  isDefault: boolean
}

export type ShippingQuote = {
  zoneName: string
  currency: Currency
  amount: number
  allowPickup: boolean
}

/**
 * Resolves the shipping cost for a cart. The matching zone is the one whose
 * `countries` includes the destination; an unrecognised country falls back to
 * the zone flagged `isDefault`. Within a zone, the matching tier is the
 * highest `minUnits` that does not exceed the cart's unit count, unless the
 * cart clears `freeAboveUnits`, in which case shipping is free.
 */
export function calculateShipping(
  zones: ShippingZone[],
  destination: { countryCode: string; units: number },
): ShippingQuote {
  const zone =
    zones.find((candidate) => candidate.countries.includes(destination.countryCode)) ??
    zones.find((candidate) => candidate.isDefault)

  if (!zone) {
    throw new Error('No shipping zone matched the destination, and none is flagged as the default.')
  }

  if (zone.freeAboveUnits !== null && destination.units >= zone.freeAboveUnits) {
    return { zoneName: zone.name, currency: zone.currency, amount: 0, allowPickup: zone.allowPickup }
  }

  const tier = [...zone.tiers]
    .sort((a, b) => a.minUnits - b.minUnits)
    .filter((candidate) => candidate.minUnits <= destination.units)
    .at(-1)

  if (!tier) {
    throw new Error(`Zone "${zone.name}" has no tier covering ${destination.units} unit(s).`)
  }

  return { zoneName: zone.name, currency: zone.currency, amount: tier.amount, allowPickup: zone.allowPickup }
}
