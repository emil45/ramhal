import { revalidateStorefront } from '../collections/hooks/revalidateStorefront.ts'

import type { GlobalConfig } from 'payload'

// The heading and introduction of /courses. Localized without a fallback like
// every other prose field, so each language is written, not backfilled with Hebrew.
export const CoursesPage: GlobalConfig = {
  slug: 'coursesPage',
  label: 'כותרת עמוד השיעורים',
  admin: {
    group: 'תוכן',
    description: 'הכותרת והפתיח בראש עמוד השיעורים. את הסדרות עצמן מנהלים בעמוד ׳שיעורים׳.',
  },
  hooks: {
    afterChange: [revalidateStorefront],
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
      name: 'lead',
      type: 'textarea',
      label: 'פתיח',
      localized: true,
    },
    {
      name: 'metaDescription',
      type: 'textarea',
      label: 'תיאור למנועי חיפוש',
      localized: true,
    },
  ],
}
