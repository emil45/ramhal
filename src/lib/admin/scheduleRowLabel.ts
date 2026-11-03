type ScheduleRow = { title?: string; days?: string; time?: string; name?: string }

const SEPARATOR = ' · '

/** What a collapsed schedule row shows: the lesson or prayer, its days and its time, in the order a reader looks for them. */
export function scheduleRowLabel(row: ScheduleRow, fallback: string): string {
  const parts = [row.title ?? row.name, row.days, row.time].filter((part): part is string => typeof part === 'string' && part.trim() !== '')
  return parts.length > 0 ? parts.join(SEPARATOR) : fallback
}
