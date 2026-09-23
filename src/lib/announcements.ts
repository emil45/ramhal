type DatedAnnouncement = {
  startsAt: string
  endsAt?: string | null
}

/**
 * An announcement is live exactly while `now` is on or after `startsAt` and
 * — when `endsAt` is set — on or before it. No `endsAt` means it never
 * expires on its own; the son must still remove it by hand, but the common
 * case (a dated notice left in place) can never go stale on the page — see
 * docs/DECISIONS.md §8.
 */
export function isAnnouncementActive(announcement: DatedAnnouncement, now: Date): boolean {
  const startsAt = new Date(announcement.startsAt)
  if (now < startsAt) return false
  if (!announcement.endsAt) return true
  return now <= new Date(announcement.endsAt)
}
