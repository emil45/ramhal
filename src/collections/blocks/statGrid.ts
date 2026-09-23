import type { Block } from 'payload'

// A row of number+label cells (floor count, building area, and so on).
export const StatGridBlock: Block = {
  slug: 'statGrid',
  labels: { singular: 'רצועת נתונים', plural: 'רצועות נתונים' },
  fields: [
    {
      name: 'items',
      type: 'array',
      label: 'נתונים',
      labels: { singular: 'נתון', plural: 'נתונים' },
      minRows: 1,
      fields: [
        {
          name: 'value',
          type: 'text',
          label: 'ערך',
          required: true,
          localized: true,
        },
        {
          name: 'label',
          type: 'text',
          label: 'תווית',
          required: true,
          localized: true,
        },
      ],
    },
  ],
}
