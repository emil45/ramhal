import 'server-only'

import config from '@payload-config'
import { getPayload } from 'payload'

import { isEventUpcoming } from '@/lib/events'

import type { Event } from '@/payload-types'
import type { Locale } from '@/lib/locale'

/** Events that have not started yet, soonest first — see isEventUpcoming for
 * why an event that already began drops off on its own. */
export async function getUpcomingEvents(locale: Locale): Promise<Event[]> {
  const payload = await getPayload({ config })
  const result = await payload.find({ collection: 'events', locale, limit: 50, sort: 'startsAt' })
  const now = new Date()
  return result.docs.filter((event) => isEventUpcoming(event, now))
}
