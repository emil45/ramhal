import { revalidateStorefront } from '../collections/hooks/revalidateStorefront.ts'

import type { GlobalConfig } from 'payload'

// The standing timetable, currently hardcoded into every legacy page.
export const Schedule: GlobalConfig = {
  slug: 'schedule',
  label: 'לוח זמנים',
  hooks: {
    afterChange: [revalidateStorefront],
  },
  fields: [
    {
      name: 'shiurim',
      type: 'array',
      label: 'שיעורים',
      labels: { singular: 'שיעור', plural: 'שיעורים' },
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
            description: 'e.g. א׳–ה׳',
          },
        },
        {
          name: 'time',
          type: 'text',
          label: 'שעה',
          required: true,
          admin: {
            description: 'Free text, not a time field — "בין מנחה לערבית" is a valid value.',
          },
        },
      ],
    },
    {
      name: 'prayers',
      type: 'array',
      label: 'תפילות',
      labels: { singular: 'תפילה', plural: 'תפילות' },
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
            description: 'Free text, not a time field — "נץ החמה" is a valid value.',
          },
        },
      ],
    },
  ],
}
