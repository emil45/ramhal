import type { CollectionConfig } from 'payload'

import { generateSlugFromTitle } from '@/collections/hooks/generateSlugFromTitle'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: {
    singular: 'קטגוריה',
    plural: 'קטגוריות',
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
      // Structural field: shown in admin lists, so a missing translation
      // may fall back to the default locale rather than reading as absent.
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
  ],
}
