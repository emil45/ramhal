import { INLINE_ROWS_CLASS_NAME } from '../collections/fields/inlineRows.ts'
import { revalidateStorefront } from '../collections/hooks/revalidateStorefront.ts'

import type { GlobalConfig } from 'payload'

const ROW_LABEL_COMPONENT = '/components/admin/ScheduleRowLabel#ScheduleRowLabel'

// The standing timetable, currently hardcoded into every legacy page.
export const Schedule: GlobalConfig = {
  slug: 'schedule',
  label: 'לוח זמנים',
  admin: { group: 'תוכן', description: 'זמני השיעורים והתפילות שמופיעים באתר.' },
  hooks: {
    afterChange: [revalidateStorefront],
  },
  fields: [
    {
      name: 'shiurim',
      type: 'array',
      label: 'שיעורים',
      labels: { singular: 'שיעור', plural: 'שיעורים' },
      admin: {
        className: INLINE_ROWS_CLASS_NAME,
        components: { RowLabel: ROW_LABEL_COMPONENT },
        description: 'בשדה "ימים" כותבים למשל א׳–ה׳. בשדה "שעה" אפשר לכתוב גם טקסט חופשי, למשל "בין מנחה לערבית".',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          label: 'כותרת',
          required: true,
          localized: true,
        },
        {
          name: 'days',
          type: 'text',
          label: 'ימים',
          required: true,
          localized: true,
        },
        {
          name: 'time',
          type: 'text',
          label: 'שעה',
          required: true,
        },
      ],
    },
    {
      name: 'prayers',
      type: 'array',
      label: 'תפילות',
      labels: { singular: 'תפילה', plural: 'תפילות' },
      admin: {
        className: INLINE_ROWS_CLASS_NAME,
        components: { RowLabel: ROW_LABEL_COMPONENT },
        description: 'בשדה "שעה" אפשר לכתוב גם טקסט חופשי, למשל "נץ החמה".',
      },
      fields: [
        {
          name: 'name',
          type: 'text',
          label: 'שם',
          required: true,
          localized: true,
        },
        {
          name: 'time',
          type: 'text',
          label: 'שעה',
          required: true,
        },
      ],
    },
  ],
}
