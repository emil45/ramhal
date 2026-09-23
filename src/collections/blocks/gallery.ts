import type { Block } from 'payload'

// A carousel of photos, each with its own caption.
export const GalleryBlock: Block = {
  slug: 'gallery',
  labels: { singular: 'גלריה', plural: 'גלריות' },
  fields: [
    {
      name: 'items',
      type: 'array',
      label: 'תמונות',
      labels: { singular: 'תמונה', plural: 'תמונות' },
      minRows: 1,
      fields: [
        {
          name: 'image',
          type: 'upload',
          label: 'תמונה',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'caption',
          type: 'text',
          label: 'כיתוב',
          required: true,
          localized: true,
        },
      ],
    },
  ],
}
