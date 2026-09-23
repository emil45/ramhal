import 'server-only'

import config from '@payload-config'
import { getPayload } from 'payload'

import type { Schedule } from '@/payload-types'
import type { Locale } from '@/lib/locale'

/** The standing shiur/prayer timetable — one global, not a collection, since
 * there is exactly one of it (docs/DECISIONS.md §8). */
export async function getSchedule(locale: Locale): Promise<Schedule> {
  const payload = await getPayload({ config })
  return payload.findGlobal({ slug: 'schedule', locale })
}
