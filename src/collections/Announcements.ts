import type { CollectionConfig } from 'payload'

// Anything dated expires itself. A stale "coming soon" notice is the commonest
// way an institute site announces that nobody is home — public queries must
// filter on endsAt, not rely on someone remembering to unpublish.
export const Announcements: CollectionConfig = {
  slug: 'announcements',
  labels: {
    singular: 'הודעה',
    plural: 'הודעות',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'startsAt', 'endsAt'],
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
      name: 'startsAt',
      type: 'date',
      label: 'תאריך התחלה',
      required: true,
    },
    {
      name: 'endsAt',
      type: 'date',
      label: 'תאריך סיום',
    },
  ],
}
