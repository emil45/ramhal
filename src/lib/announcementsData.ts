import 'server-only'

import config from '@payload-config'
import { getPayload } from 'payload'

import type { Announcement } from '@/payload-types'
import type { Locale } from '@/lib/locale'

/** Every announcement, newest first. Editors remove an announcement by deleting it. */
export async function getAnnouncements(locale: Locale): Promise<Announcement[]> {
  const payload = await getPayload({ config })
  const result = await payload.find({ collection: 'announcements', locale, pagination: false, sort: '-startsAt' })
  return result.docs
}
