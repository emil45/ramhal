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
      admin: { components: { RowLabel: ROW_LABEL_COMPONENT } },
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
          admin: {
            description: 'למשל א׳–ה׳.',
          },
        },
        {
          name: 'time',
          type: 'text',
          label: 'שעה',
          required: true,
          admin: {
            description: 'טקסט חופשי ולא שעון, ולכן גם "בין מנחה לערבית" תקין.',
          },
        },
      ],
    },
    {
      name: 'prayers',
      type: 'array',
      label: 'תפילות',
      labels: { singular: 'תפילה', plural: 'תפילות' },
      admin: { components: { RowLabel: ROW_LABEL_COMPONENT } },
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
          admin: {
            description: 'טקסט חופשי ולא שעון, ולכן גם "נץ החמה" תקין.',
          },
        },
      ],
    },
  ],
}
