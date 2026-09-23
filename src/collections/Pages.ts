import { PAGE_CONTENT_BLOCKS } from './blocks/index.ts'
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
      name: 'eyebrow',
      type: 'text',
      label: 'תווית עילית',
      localized: true,
      admin: {
        description: 'שורת טקסט קצרה מעל הכותרת הראשית.',
      },
    },
    {
      name: 'lead',
      type: 'textarea',
      label: 'פתיח',
      localized: true,
    },
    {
      name: 'metaDescription',
      type: 'textarea',
      label: 'תיאור למנועי חיפוש',
      localized: true,
    },
    {
      name: 'heroImage',
      type: 'upload',
      label: 'תמונה ראשית',
      relationTo: 'media',
    },
    {
      name: 'location',
      type: 'text',
      label: 'מיקום',
      localized: true,
      admin: {
        description: 'שורת כתובת המוצגת ליד סמל מיקום. רלוונטי לעמודים בעלי כתובת פיזית בלבד.',
      },
    },
    {
      name: 'content',
      type: 'blocks',
      label: 'תוכן',
      localized: true,
      blocks: PAGE_CONTENT_BLOCKS,
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
