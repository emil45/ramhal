import type { Currency } from '@/lib/shop/currency'

export type ShippingAmount = {
  currency: Currency
  amount: number
}

export type ShippingTier = {
  minUnits: number
  /** One amount per currency the zone ships in; see `zoneServesCurrency`. */
  amounts: ShippingAmount[]
}

export type ShippingZone = {
  name: string
  countries: string[]
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

function amountInCurrency(tier: ShippingTier, currency: Currency): number | null {
  const match = tier.amounts.find((candidate) => candidate.currency === currency)
  return match ? match.amount : null
}

/**
 * Whether the zone can quote shipping in this currency. Every tier must carry
 * an amount for it: a tier without one would leave some carts unpriced. The
 * currency is the customer's (it follows the site language), the zone is the
 * destination's, so the two are independent.
 */
export function zoneServesCurrency(zone: Pick<ShippingZone, 'tiers'>, currency: Currency): boolean {
  return zone.tiers.every((tier) => amountInCurrency(tier, currency) !== null)
}

/**
 * Resolves the shipping cost for a cart, in the currency the customer pays in.
 * The matching zone is the one whose `countries` includes the destination; an
 * unrecognised country falls back to the zone flagged `isDefault`. Within a
 * zone, the matching tier is the highest `minUnits` that does not exceed the
 * cart's unit count, unless the cart clears `freeAboveUnits`, in which case
 * shipping is free.
 */
export function calculateShipping(
  zones: ShippingZone[],
  destination: { countryCode: string; units: number; currency: Currency },
): ShippingQuote {
  const zone =
    zones.find((candidate) => candidate.countries.includes(destination.countryCode)) ??
    zones.find((candidate) => candidate.isDefault)

  if (!zone) {
    throw new Error('No shipping zone matched the destination, and none is flagged as the default.')
  }

  const { currency } = destination

  if (zone.freeAboveUnits !== null && destination.units >= zone.freeAboveUnits) {
    return { zoneName: zone.name, currency, amount: 0, allowPickup: zone.allowPickup }
  }

  const tier = [...zone.tiers]
    .sort((a, b) => a.minUnits - b.minUnits)
    .filter((candidate) => candidate.minUnits <= destination.units)
    .at(-1)

  if (!tier) {
    throw new Error(`Zone "${zone.name}" has no tier covering ${destination.units} unit(s).`)
  }

  const amount = amountInCurrency(tier, currency)
  if (amount === null) {
    throw new Error(`Zone "${zone.name}" has no ${currency} shipping amount for ${destination.units} unit(s).`)
  }

  return { zoneName: zone.name, currency, amount, allowPickup: zone.allowPickup }
}
