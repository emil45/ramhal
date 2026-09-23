import type { Media } from '@/payload-types'
import type { RichTextContent } from '@/lib/richText'

type NewsLink = {
  label?: string | null
  url?: string | null
}

type StreamAnnouncement = {
  id: string | number
  title?: string | null
  // Never blank in practice once a document has been saved at least once —
  // the fallback below is for the requested locale specifically having no
  // title, not for a title
  // missing everywhere.
  displayTitle?: string | null
  body?: RichTextContent | null
  image?: number | Media | null
  link?: NewsLink | null
  startsAt: string
}

type StreamEvent = {
  id: string | number
  title?: string | null
  displayTitle?: string | null
  description?: RichTextContent | null
  image?: number | Media | null
  link?: NewsLink | null
  startsAt: string
  location?: string | null
}

export type NewsItem = {
  id: string
  kind: 'announcement' | 'event'
  title: string
  body: RichTextContent | null
  image: Media | null
  link: { label: string; url: string } | null
  date: string
  location: string | null
}

function resolveImage(image: number | Media | null | undefined): Media | null {
  return typeof image === 'object' && image !== null ? image : null
}

function resolveLink(link: NewsLink | null | undefined): NewsItem['link'] {
  const label = link?.label?.trim()
  const url = link?.url?.trim()
  return label && url ? { label, url } : null
}

/** Upcoming dates lead, nearest first; dates that have already begun follow,
 * newest first. `now` is supplied so the ordering stays deterministic. */
export function buildNewsStream(
  announcements: StreamAnnouncement[],
  events: StreamEvent[],
  now: Date,
): NewsItem[] {
  const items: NewsItem[] = [
    ...announcements.map((announcement) => ({
      id: String(announcement.id),
      kind: 'announcement' as const,
      title: announcement.title ?? announcement.displayTitle ?? '',
      body: announcement.body ?? null,
      image: resolveImage(announcement.image),
      link: resolveLink(announcement.link),
      date: announcement.startsAt,
      location: null,
    })),
    ...events.map((event) => ({
      id: String(event.id),
      kind: 'event' as const,
      title: event.title ?? event.displayTitle ?? '',
      body: event.description ?? null,
      image: resolveImage(event.image),
      link: resolveLink(event.link),
      date: event.startsAt,
      location: event.location ?? null,
    })),
  ]

  const nowTimestamp = now.getTime()
  return items.sort((first, second) => {
    const firstTimestamp = new Date(first.date).getTime()
    const secondTimestamp = new Date(second.date).getTime()
    const firstIsFuture = firstTimestamp > nowTimestamp
    const secondIsFuture = secondTimestamp > nowTimestamp

    if (firstIsFuture !== secondIsFuture) return firstIsFuture ? -1 : 1
    return firstIsFuture ? firstTimestamp - secondTimestamp : secondTimestamp - firstTimestamp
  })
}
