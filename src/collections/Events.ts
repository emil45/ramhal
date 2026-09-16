import type { CollectionConfig } from 'payload'

// One-off events — a hilula, a seminar. Recurring shiurim are NOT events; they
// live in the schedule global. The two look alike on the page and are nothing
// alike in the admin — see docs/tasks/TASK-01-payload-setup.md §4.
export const Events: CollectionConfig = {
  slug: 'events',
  labels: {
    singular: 'אירוע',
    plural: 'אירועים',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'startsAt', 'endsAt', 'location'],
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
    {
      name: 'location',
      type: 'text',
      label: 'מיקום',
      localized: true,
    },
  ],
}
