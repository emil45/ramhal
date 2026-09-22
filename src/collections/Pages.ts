import { localizedDisplayTitleFields } from './fields/localizedDisplayTitleFields.ts'
import { computeDisplayTitleBeforeChange } from './hooks/displayTitle.ts'
import { generateSlugFromTitle } from './hooks/generateSlugFromTitle.ts'
import { requiredInAtLeastOneLocale } from './validators/requiredInAtLeastOneLocale.ts'

import type { CollectionConfig } from 'payload'

// Institutional pages: about the institute, Beit Ramhal, contact, donations.
export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: {
    singular: 'עמוד',
    plural: 'עמודים',
  },
  admin: {
    group: 'תוכן',
    useAsTitle: 'displayTitle',
    defaultColumns: ['displayTitle', 'displayTitleLocale'],
  },
  hooks: {
    beforeChange: [computeDisplayTitleBeforeChange('pages')],
  },
  fields: [
    ...localizedDisplayTitleFields(),
    {
      name: 'title',
      type: 'text',
      label: 'כותרת',
      required: false, // enforced by validate below, in at least one locale, not this one
      localized: true,
      validate: requiredInAtLeastOneLocale('pages'),
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
      admin: {
        hidden: true,
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
