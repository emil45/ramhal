import { revalidateStorefront } from './hooks/revalidateStorefront.ts'

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
    // Nothing on the site reads this collection, and the sync job that would fill
    // it is not built (docs/DECISIONS.md §6). Hidden so the editor is not offered
    // a menu entry that changes nothing; the courses are managed in Series.
    hidden: true,
    group: 'תוכן',
    useAsTitle: 'title',
    defaultColumns: ['title', 'series', 'recordedAt', 'language'],
  },
  hooks: {
    afterChange: [revalidateStorefront],
    afterDelete: [revalidateStorefront],
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
        description: 'מפתח הקובץ באחסון האובייקטים — לא הקובץ עצמו.',
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
        description: 'חותמת הזמן במקור הסנכרון; מונעת עדכון כפול בסנכרון חוזר.',
      },
    },
  ],
}
