import 'server-only'

import config from '@payload-config'
import { getPayload } from 'payload'

import type { Event } from '@/payload-types'
import type { Locale } from '@/lib/locale'

/** Every event, in date order. Editors remove an event by deleting it. */
export async function getEvents(locale: Locale): Promise<Event[]> {
  const payload = await getPayload({ config })
  const result = await payload.find({ collection: 'events', locale, pagination: false, sort: 'startsAt' })
  return result.docs
}
