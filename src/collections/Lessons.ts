import type { CollectionConfig } from 'payload'

// One shiur. Populated by a sync job in a later task — this defines the shape.
// Never store video or audio in Postgres: YouTube hosts the video, audio lands
// in object storage (audioKey is a key into that storage, not the file itself).
export const Lessons: CollectionConfig = {
  slug: 'lessons',
  labels: {
    singular: 'שיעור',
    plural: 'שיעורים',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'series', 'recordedAt', 'language'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'כותרת',
      required: true,
    },
    {
      name: 'series',
      type: 'relationship',
      label: 'סדרה',
      relationTo: 'series',
      required: true,
    },
    {
      name: 'youtubeId',
      type: 'text',
      label: 'מזהה יוטיוב',
    },
    {
      name: 'audioKey',
      type: 'text',
      label: 'מפתח קובץ שמע',
      admin: {
        description: 'Object-storage key for the audio file, not the file itself.',
      },
    },
    {
      name: 'recordedAt',
      type: 'date',
      label: 'תאריך הקלטה',
    },
    {
      name: 'language',
      type: 'select',
      label: 'שפה',
      options: [
        { label: 'עברית', value: 'he' },
        { label: 'Français', value: 'fr' },
      ],
    },
    {
      name: 'durationSeconds',
      type: 'number',
      label: 'משך (שניות)',
    },
    {
      name: 'sourceUpdatedAt',
      type: 'date',
      label: 'עדכון אחרון במקור',
      admin: {
        description: 'Timestamp from the sync source, used to make re-syncing idempotent.',
      },
    },
  ],
}
