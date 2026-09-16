import type { CollectionConfig } from 'payload'

// A course of shiurim on one work.
export const Series: CollectionConfig = {
  slug: 'series',
  labels: {
    singular: 'סדרה',
    plural: 'סדרות',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'language', 'relatedBook', 'order'],
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
      name: 'description',
      type: 'richText',
      label: 'תיאור',
      localized: true,
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
    },
    {
      name: 'order',
      type: 'number',
      label: 'סדר',
    },
  ],
}
