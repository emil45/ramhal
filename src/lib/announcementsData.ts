import 'server-only'

import config from '@payload-config'
import { getPayload } from 'payload'

import { isAnnouncementActive } from '@/lib/announcements'

import type { Announcement } from '@/payload-types'
import type { Locale } from '@/lib/locale'

/** Announcements currently within their [startsAt, endsAt] window, soonest
 * first — see isAnnouncementActive for why nothing dated can go stale here. */
export async function getActiveAnnouncements(locale: Locale): Promise<Announcement[]> {
  const payload = await getPayload({ config })
  const result = await payload.find({ collection: 'announcements', locale, limit: 50, sort: 'startsAt' })
  const now = new Date()
  return result.docs.filter((announcement) => isAnnouncementActive(announcement, now))
}
