'use client'

import { useRowLabel } from '@payloadcms/ui'

import { scheduleRowLabel } from '../../lib/scheduleRowLabel.ts'

type ScheduleRow = { title?: string; days?: string; time?: string; name?: string }

/** What a collapsed row of the schedule says, instead of "שיעור 01". Used for both lessons and prayers. */
export function ScheduleRowLabel() {
  const { data } = useRowLabel<ScheduleRow>()
  return <span>{scheduleRowLabel(data, 'שורה חדשה')}</span>
}
