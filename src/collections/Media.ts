import { refuseReadOnlyMediaDelete, refuseReadOnlyMediaUpload } from './hooks/refuseReadOnlyMediaWrites.ts'
import { revalidateStorefront } from './hooks/revalidateStorefront.ts'

import type { CollectionConfig } from 'payload'

// Where the files live is decided in payload.config.ts — local disk, an
// S3-compatible bucket when the S3_* variables are set, or read-only when only
// S3_PUBLIC_URL is (src/lib/mediaStorage.ts). The collection's shape
// is the same either way.
export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: 'קובץ מדיה',
    plural: 'קבצי מדיה',
  },
  admin: {
    group: 'מערכת',
  },
  // Payload's default is "signed-in users only", which makes every cover a
  // 403 for an anonymous visitor — and invisible to a developer who is logged
  // into /admin in the same browser. Uploaded files are public by nature;
  // writing stays restricted to signed-in users.
  access: {
    read: () => true,
  },
  hooks: {
    afterChange: [revalidateStorefront],
    afterDelete: [revalidateStorefront],
    beforeChange: [refuseReadOnlyMediaUpload],
    beforeDelete: [refuseReadOnlyMediaDelete],
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
