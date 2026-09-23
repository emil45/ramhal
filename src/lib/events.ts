type DatedEvent = {
  startsAt: string
}

/**
 * "Upcoming" means the event has not started yet — the homepage's events
 * section is about what a visitor could still attend, not a running log of
 * what already happened (docs/DECISIONS.md §8). A hilula or seminar that
 * already began drops off automatically, the same way an announcement
 * expires itself.
 */
export function isEventUpcoming(event: DatedEvent, now: Date): boolean {
  return new Date(event.startsAt) > now
}
