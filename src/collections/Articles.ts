import { localizedDisplayTitleFields } from './fields/localizedDisplayTitleFields.ts'
import { computeDisplayTitleBeforeChange } from './hooks/displayTitle.ts'
import { revalidateStorefront } from './hooks/revalidateStorefront.ts'
import { requiredInAtLeastOneLocale } from './validators/requiredInAtLeastOneLocale.ts'
import { PARSHIYOT } from './parshiyot.ts'

import type { CollectionConfig } from 'payload'

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
// A parsha article with only a French body is normal, not broken.
export const Articles: CollectionConfig = {
  slug: 'articles',
  labels: {
    singular: 'כתבה',
    plural: 'כתבות',
  },
  admin: {
    group: 'תוכן',
    useAsTitle: 'displayTitle',
    defaultColumns: ['displayTitle', 'displayTitleLocale', 'type', 'parsha', 'holiday', 'publishedAt'],
  },
  hooks: {
    afterChange: [revalidateStorefront],
    afterDelete: [revalidateStorefront],
    beforeChange: [computeDisplayTitleBeforeChange('articles')],
  },
  fields: [
    ...localizedDisplayTitleFields(),
    {
      type: 'tabs',
      tabs: [
        {
          label: 'תוכן',
          fields: [
            {
              name: 'title',
              type: 'text',
              label: 'כותרת',
              required: false, // enforced by validate below, in at least one locale, not this one
              localized: true,
              validate: requiredInAtLeastOneLocale('articles'),
              admin: {
                description: 'רבים ממאמרי הפרשה בצרפתית קיימים רק בצרפתית — אין צורך למלא כותרת בעברית אם הכתבה מעולם לא נכתבה בעברית.',
              },
            },
            {
              name: 'body',
              type: 'richText',
              label: 'תוכן',
              localized: true,
              // No fallback: see Books.description for the same reasoning.
            },
            {
              name: 'publishedAt',
              type: 'date',
              label: 'תאריך פרסום',
            },
          ],
        },
      ],
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
      admin: { position: 'sidebar' },
    },
    {
      name: 'parsha',
      type: 'select',
      label: 'פרשה',
      options: PARSHIYOT.map((name) => ({ label: name, value: name })),
      admin: {
        position: 'sidebar',
        condition: (data) => data?.type === 'parsha',
      },
    },
    {
      name: 'holiday',
      type: 'select',
      label: 'חג',
      options: HOLIDAYS.map((name) => ({ label: name, value: name })),
      admin: {
        position: 'sidebar',
        condition: (data) => data?.type === 'holiday',
      },
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
