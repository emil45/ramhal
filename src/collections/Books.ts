import type { CollectionConfig } from 'payload'

import { generateSlugFromTitle } from './hooks/generateSlugFromTitle.ts'
import { CURRENCIES } from '../lib/currency.ts'
import { validateIntegerAmount } from '../lib/validateIntegerAmount.ts'

const BOOK_LANGUAGES = [
  { label: 'עברית', value: 'he' },
  { label: 'Français', value: 'fr' },
  { label: 'English', value: 'en' },
  { label: 'עברית/צרפתית', value: 'he-fr' },
  { label: 'ארמית/צרפתית', value: 'aramaic-fr' },
]

// Each book is a work, not a SKU — see docs/DECISIONS.md §1.
export const Books: CollectionConfig = {
  slug: 'books',
  labels: {
    singular: 'ספר',
    plural: 'ספרים',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'bookLanguage', 'category', 'inStock'],
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
      name: 'slug',
      type: 'text',
      label: 'כתובת (Slug)',
      required: true,
      unique: true,
      localized: true,
      hooks: {
        beforeValidate: [generateSlugFromTitle],
      },
    },
    {
      name: 'subtitle',
      type: 'text',
      label: 'כותרת משנה',
      localized: true,
    },
    {
      name: 'description',
      type: 'richText',
      label: 'תיאור',
      localized: true,
      // No fallback: a missing translation must read as absent, not backfilled
      // with Hebrew prose. See docs/tasks/TASK-01-payload-setup.md §2.
    },
    {
      // The language the book is WRITTEN in — not the locale it is described in.
      // See docs/tasks/TASK-01-payload-setup.md §3.
      name: 'bookLanguage',
      type: 'select',
      label: 'שפת החיבור',
      required: true,
      options: BOOK_LANGUAGES,
    },
    {
      name: 'category',
      type: 'relationship',
      label: 'קטגוריה',
      relationTo: 'categories',
      required: true,
    },
    {
      name: 'prices',
      type: 'array',
      label: 'מחירים',
      labels: { singular: 'מחיר', plural: 'מחירים' },
      required: true,
      minRows: 1,
      fields: [
        {
          name: 'currency',
          type: 'select',
          label: 'מטבע',
          required: true,
          options: CURRENCIES.map((currency) => ({ label: currency, value: currency })),
        },
        {
          name: 'amount',
          type: 'number',
          label: 'סכום',
          required: true,
          min: 0,
          validate: validateIntegerAmount,
          admin: {
            description: 'Minor units (agorot/cents) as an integer — never a float.',
          },
        },
      ],
    },
    {
      name: 'cover',
      type: 'upload',
      label: 'עטיפה',
      relationTo: 'media',
    },
    {
      name: 'gallery',
      type: 'array',
      label: 'גלריה',
      labels: { singular: 'תמונה', plural: 'תמונות' },
      fields: [
        {
          name: 'image',
          type: 'upload',
          label: 'תמונה',
          relationTo: 'media',
          required: true,
        },
      ],
    },
    {
      name: 'inStock',
      type: 'checkbox',
      label: 'במלאי',
      defaultValue: true,
    },
    {
      // OPEN (docs/tasks/TASK-01-payload-setup.md §4, §9): shipping tiers count
      // items, not weight — whether a multi-volume set counts as more than 1
      // unit is still to be confirmed with the client. Field ships with a safe
      // default; the counting rule for sets is a data-entry question, not a
      // schema one.
      name: 'shippingUnits',
      type: 'number',
      label: 'יחידות משלוח',
      required: true,
      defaultValue: 1,
      min: 1,
    },
    {
      // Drives "new books" on the homepage automatically — no manual
      // "featured" flag for anyone to forget to clear.
      name: 'publishedAt',
      type: 'date',
      label: 'תאריך פרסום',
      required: true,
    },
    {
      name: 'hebrewYear',
      type: 'text',
      label: 'שנה עברית',
      admin: {
        description: 'e.g. תשפ״ו',
      },
    },
    {
      name: 'isbn',
      type: 'text',
      label: 'מספר ISBN',
    },
    {
      name: 'relatedSeries',
      type: 'relationship',
      label: 'סדרות שיעורים קשורות',
      relationTo: 'series',
      hasMany: true,
    },
    {
      name: 'legacyUrls',
      type: 'array',
      label: 'כתובות ישנות',
      labels: { singular: 'כתובת ישנה', plural: 'כתובות ישנות' },
      admin: {
        hidden: true,
      },
      fields: [
        {
          name: 'url',
          type: 'text',
          label: 'כתובת',
          required: true,
        },
      ],
    },
  ],
}
