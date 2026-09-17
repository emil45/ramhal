import type { CollectionConfig } from 'payload'

import { PARSHIYOT } from './parshiyot.ts'

const HOLIDAYS = [
  'ימים נוראים',
  'סוכות',
  'חנוכה',
  'פורים',
  'פסח',
  'שבועות',
  'ט״ו בשבט',
  'י״ז בתמוז ותשעה באב',
]

// Teaching content: the Hebrew holiday articles and the French parsha essays.
// A parsha article with only a French body is normal, not broken — see
// docs/tasks/TASK-01-payload-setup.md §2 and §4.
export const Articles: CollectionConfig = {
  slug: 'articles',
  labels: {
    singular: 'כתבה',
    plural: 'כתבות',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'parsha', 'holiday', 'publishedAt'],
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
      name: 'body',
      type: 'richText',
      label: 'תוכן',
      localized: true,
      // No fallback: see Books.description for the same reasoning.
    },
    {
      name: 'type',
      type: 'select',
      label: 'סוג',
      required: true,
      options: [
        { label: 'פרשת השבוע', value: 'parsha' },
        { label: 'חג', value: 'holiday' },
        { label: 'כללי', value: 'general' },
      ],
    },
    {
      name: 'parsha',
      type: 'select',
      label: 'פרשה',
      options: PARSHIYOT.map((name) => ({ label: name, value: name })),
      admin: {
        condition: (data) => data?.type === 'parsha',
      },
    },
    {
      name: 'holiday',
      type: 'select',
      label: 'חג',
      options: HOLIDAYS.map((name) => ({ label: name, value: name })),
      admin: {
        condition: (data) => data?.type === 'holiday',
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      label: 'תאריך פרסום',
    },
    {
      name: 'legacyUrls',
      type: 'array',
      label: 'כתובות ישנות',
      labels: { singular: 'כתובת ישנה', plural: 'כתובות ישנות' },
      admin: {
        hidden: true,
      },
      fields: [
        {
          name: 'url',
          type: 'text',
          label: 'כתובת',
          required: true,
        },
      ],
    },
  ],
}
