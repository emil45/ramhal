import type { CollectionConfig } from 'payload'

// Local disk storage for now. Swapping to Cloudflare R2 later only means adding
// @payloadcms/storage-s3 to the plugins array — this collection's shape does not change.
export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: 'קובץ מדיה',
    plural: 'קבצי מדיה',
  },
  upload: {
    imageSizes: [
      { name: 'thumbnail', width: 400 },
      { name: 'card', width: 800 },
      { name: 'full', width: 1600 },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'טקסט חלופי',
      localized: true,
    },
  ],
}
