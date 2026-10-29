import { localizedDisplayTitleFields } from './fields/localizedDisplayTitleFields.ts'
import { computeDisplayTitleBeforeChange } from './hooks/displayTitle.ts'
import { revalidateStorefront } from './hooks/revalidateStorefront.ts'
import { requiredInAtLeastOneLocale } from './validators/requiredInAtLeastOneLocale.ts'
import {
  normalisePlaylistReference,
  normaliseVideoReference,
  validatePlaylistReference,
  validateVideoReference,
} from '../lib/youtubeLinks.ts'

import type { CollectionConfig } from 'payload'

// One complete course of lessons on a work. It feeds both the /courses page and
// the "lessons on this book" box on the book's own page, so a course is entered
// once. Labelled "שיעורים" because that is what the editor looks for in the menu.
export const Series: CollectionConfig = {
  slug: 'series',
  labels: {
    singular: 'סדרת שיעורים',
    plural: 'שיעורים',
  },
  // Drag-and-drop in the list sets the order the courses appear on the site.
  orderable: true,
  admin: {
    group: 'תוכן',
    description: 'סדרות השיעורים שמופיעות בעמוד השיעורים ובעמוד הספר. גוררים שורה כדי לשנות את הסדר באתר.',
    useAsTitle: 'displayTitle',
    defaultColumns: ['displayTitle', 'displayTitleLocale', 'relatedBooks', 'lessonCount'],
  },
  hooks: {
    afterChange: [revalidateStorefront],
    afterDelete: [revalidateStorefront],
    beforeChange: [computeDisplayTitleBeforeChange('series')],
  },
  fields: [
    ...localizedDisplayTitleFields(),
    {
      name: 'title',
      type: 'text',
      label: 'שם הסדרה',
      required: false, // enforced by validate below, in at least one locale, not this one
      localized: true,
      validate: requiredInAtLeastOneLocale('series'),
    },
    {
      name: 'relatedBooks',
      type: 'relationship',
      label: 'הספר בחנות',
      relationTo: 'books',
      hasMany: true,
      admin: {
        description:
          'הספר שהסדרה מלמדת. בחרו כל מהדורה של הספר (עברית, צרפתית) — בעמוד הספר יופיע תיבת השיעורים, ובעמוד השיעורים יוצג הספר שמתאים לשפת הגולש.',
      },
    },
    {
      name: 'youtubePlaylistId',
      type: 'text',
      label: 'קישור לפלייליסט ביוטיוב',
      required: true,
      validate: validatePlaylistReference,
      hooks: { beforeValidate: [({ value }) => normalisePlaylistReference(value)] },
      admin: {
        description: 'מדביקים את הקישור כפי שהוא מופיע בשורת הכתובת של היוטיוב. הוא נשמר כמזהה בלבד.',
      },
    },
    {
      name: 'firstLessonYoutubeId',
      type: 'text',
      label: 'קישור לשיעור הראשון',
      required: true,
      validate: validateVideoReference,
      hooks: { beforeValidate: [({ value }) => normaliseVideoReference(value)] },
      admin: {
        description: 'הקישור לסרטון הראשון בסדרה. ממנו נלקחת התמונה בכרטיס הסדרה.',
      },
    },
    {
      name: 'lessonCount',
      type: 'number',
      label: 'מספר השיעורים',
      required: true,
      min: 1,
      admin: {
        step: 1,
        description: 'כמה סרטונים יש בפלייליסט. כשמעלים שיעורים חדשים — מעדכנים כאן.',
      },
    },
  ],
}
