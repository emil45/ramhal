import 'server-only'

import config from '@payload-config'
import { getPayload } from 'payload'

import type { ShippingZone } from '@/lib/shipping'

export async function getShippingZones(): Promise<ShippingZone[]> {
  const payload = await getPayload({ config })
  const settings = await payload.findGlobal({ slug: 'shippingSettings' })

  return settings.zones.map((zone) => ({
    name: zone.name,
    countries: zone.countries,
    currency: zone.currency,
    tiers: zone.tiers,
    freeAboveUnits: zone.freeAboveUnits ?? null,
    allowPickup: zone.allowPickup ?? false,
    isDefault: zone.isDefault ?? false,
  }))
}
