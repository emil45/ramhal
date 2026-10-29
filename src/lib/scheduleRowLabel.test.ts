import { describe, expect, it } from 'vitest'

import { scheduleRowLabel } from '@/lib/scheduleRowLabel'

describe('scheduleRowLabel', () => {
  it('joins title, days and time', () => {
    expect(scheduleRowLabel({ title: 'דרך ה׳', days: 'א׳–ה׳', time: 'בין מנחה לערבית' }, 'שיעור 1')).toBe('דרך ה׳ · א׳–ה׳ · בין מנחה לערבית')
  })

  it('names a prayer by its name and leaves out the days it does not have', () => {
    expect(scheduleRowLabel({ name: 'שחרית', time: '06:30' }, 'תפילה 1')).toBe('שחרית · 06:30')
  })

  it('skips blank parts', () => {
    expect(scheduleRowLabel({ title: 'אדיר במרום', days: ' ', time: '20:30' }, 'שיעור 2')).toBe('אדיר במרום · 20:30')
  })

  it('falls back to the numbered label while the row is still empty', () => {
    expect(scheduleRowLabel({}, 'שיעור 3')).toBe('שיעור 3')
  })
})
