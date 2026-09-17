import type { CollectionConfig } from 'payload'

import { generateSlugFromTitle } from './hooks/generateSlugFromTitle.ts'

// Institutional pages: about the institute, Beit Ramhal, contact, donations.
export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: {
    singular: 'עמוד',
    plural: 'עמודים',
  },
  admin: {
    useAsTitle: 'title',
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
    },
    {
      name: 'slug',
      type: 'text',
      label: 'כתובת (Slug)',
      required: true,
      unique: true,
      hooks: {
        beforeValidate: [generateSlugFromTitle],
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
