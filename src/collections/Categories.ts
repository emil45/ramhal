import { localizedDisplayTitleFields } from './fields/localizedDisplayTitleFields.ts'
import { computeDisplayTitleBeforeChange } from './hooks/displayTitle.ts'
import { generateSlugFromTitle } from './hooks/generateSlugFromTitle.ts'
import { requiredInAtLeastOneLocale } from './validators/requiredInAtLeastOneLocale.ts'

import type { CollectionConfig } from 'payload'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: {
    singular: 'קטגוריה',
    plural: 'קטגוריות',
  },
  admin: {
    group: 'חנות',
    useAsTitle: 'displayTitle',
    defaultColumns: ['displayTitle', 'displayTitleLocale'],
    description:
      'קטגוריה מתארת את סוג החיבור (למשל: סידורים ומחזורים) — לא את השפה. שפת הספר נקבעת בשדה ׳שפת החיבור׳ שבכל ספר.',
  },
  hooks: {
    beforeChange: [computeDisplayTitleBeforeChange('categories')],
  },
  fields: [
    ...localizedDisplayTitleFields(),
    {
      name: 'title',
      type: 'text',
      label: 'כותרת',
      required: false, // enforced by validate below, in at least one locale, not this one
      localized: true,
      validate: requiredInAtLeastOneLocale('categories'),
    },
    {
      name: 'slug',
      type: 'text',
      label: 'כתובת (Slug)',
      required: true,
      unique: true,
      admin: {
        description: 'נוצרת אוטומטית מהכותרת. שינוי ידני משנה גם את כתובת האתר הציבורית של הקטגוריה.',
      },
      hooks: {
        beforeValidate: [generateSlugFromTitle],
      },
    },
  ],
}
