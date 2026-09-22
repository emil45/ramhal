import { localizedDisplayTitleFields } from './fields/localizedDisplayTitleFields.ts'
import { computeDisplayTitleBeforeChange } from './hooks/displayTitle.ts'
import { requiredInAtLeastOneLocale } from './validators/requiredInAtLeastOneLocale.ts'

import type { CollectionConfig } from 'payload'

// A course of shiurim on one work.
export const Series: CollectionConfig = {
  slug: 'series',
  labels: {
    singular: 'סדרה',
    plural: 'סדרות',
  },
  admin: {
    group: 'תוכן',
    useAsTitle: 'displayTitle',
    defaultColumns: ['displayTitle', 'displayTitleLocale', 'language', 'relatedBook', 'order'],
  },
  hooks: {
    beforeChange: [computeDisplayTitleBeforeChange('series')],
  },
  fields: [
    ...localizedDisplayTitleFields(),
    {
      type: 'tabs',
      tabs: [
        {
          label: 'פרטים',
          fields: [
            {
              name: 'title',
              type: 'text',
              label: 'כותרת',
              required: false, // enforced by validate below, in at least one locale, not this one
              localized: true,
              validate: requiredInAtLeastOneLocale('series'),
            },
            {
              name: 'description',
              type: 'richText',
              label: 'תיאור',
              localized: true,
            },
            {
              name: 'relatedBook',
              type: 'relationship',
              label: 'ספר קשור',
              relationTo: 'books',
            },
            {
              name: 'youtubePlaylistId',
              type: 'text',
              label: 'מזהה פלייליסט ביוטיוב',
              admin: {
                description: 'מזהה הפלייליסט מכתובת היוטיוב, לא הכתובת המלאה.',
              },
            },
          ],
        },
      ],
    },
    {
      name: 'language',
      type: 'select',
      label: 'שפה',
      required: true,
      options: [
        { label: 'עברית', value: 'he' },
        { label: 'Français', value: 'fr' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'order',
      type: 'number',
      label: 'סדר',
      admin: {
        position: 'sidebar',
        description: 'קובע את סדר הופעת הסדרות ברשימה. השאירו ריק לסדר ברירת מחדל.',
      },
    },
  ],
}
