import type { CollectionConfig } from 'payload'

import { generateSlugFromTitle } from './hooks/generateSlugFromTitle.ts'
import { CURRENCIES } from '../lib/currency.ts'
import { validateMoneyAmount } from '../lib/validateIntegerAmount.ts'

const BOOK_LANGUAGES = [
  { label: 'עברית', value: 'he' },
  { label: 'Français', value: 'fr' },
  { label: 'English', value: 'en' },
  { label: 'עברית/צרפתית', value: 'he-fr' },
  { label: 'ארמית/צרפתית', value: 'aramaic-fr' },
  // A Latin-script title with no shelf category is genuinely ambiguous
  // between French and English — script detection cannot tell them apart.
  // See docs/reviews/REVIEW-01-findings.md #7: guessing "English" here
  // corrupted the French catalogue. This value preserves that uncertainty.
  { label: 'לא ידוע (דורש בדיקה)', value: 'unknown' },
]

// Why each book might need a human look before it's trusted — see
// scripts/scrape/reconcile.mjs, which computes these before import.
const REVIEW_REASONS = [
  { label: 'חסר תיאור', value: 'missing-description' },
  { label: 'פער מחירים', value: 'price-mismatch' },
  { label: 'לא קיים בעברית', value: 'absent-from-hebrew' },
  { label: 'התאמה לא ודאית', value: 'ambiguous-match' },
  { label: 'שפה לא ודאית', value: 'language-uncertain' },
  { label: 'מחיר אפס', value: 'zero-price' },
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
    defaultColumns: ['title', 'bookLanguage', 'category', 'inStock', 'needsReview'],
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
      // Legacy, per-locale slug — kept for redirecting old locale-scoped URLs,
      // never read for routing any more (see urlSlug below and
      // docs/reports/TASK-07.md §A1). `unique: true` here is per-locale
      // (Postgres enforces UNIQUE(slug, _locale)), which is exactly the bug
      // that made two books collapse onto one cross-locale public URL —
      // uniqueness for the public URL is urlSlug's job now, not this field's.
      name: 'slug',
      type: 'text',
      label: 'כתובת ישנה (Slug, לכל שפה)',
      required: true,
      unique: true,
      localized: true,
      hooks: {
        beforeValidate: [generateSlugFromTitle],
      },
    },
    {
      // The one canonical public URL for this book — one work, one address,
      // the same in every locale (docs/DECISIONS.md §1: a book is a work,
      // not a SKU). Not localized, so `unique: true` is a real
      // UNIQUE(url_slug) constraint across the whole catalogue: two books
      // can never resolve to the same page. Auto-filled from the title in
      // whichever locale the book is first created (generateSlugFromTitle
      // reads data.title the same way it does for `slug` above), then
      // stable — an editor can override it, but never re-generates once set.
      // See docs/reports/TASK-07.md §A1 for why this exists and how the
      // small number of pre-existing title collisions were resolved.
      name: 'urlSlug',
      type: 'text',
      label: 'כתובת קנונית (URL)',
      required: true,
      unique: true,
      hooks: {
        beforeValidate: [generateSlugFromTitle],
      },
      admin: {
        description: 'כתובת ה-URL הציבורית והיחידה של הספר, זהה בכל שפה. נוצרת אוטומטית מהכותרת; שינוי ידני אפשרי אך חייב להישאר ייחודי בכל הקטלוג.',
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
      // Not required: a book imported with an uncertain bookLanguage (see
      // above) has no honest category to fall back to either — the legacy
      // sites' own category names are exactly hebrew-books/french-books/
      // english-books, so inventing one would repeat the same guess. Left
      // blank and flagged (language-uncertain) instead.
      name: 'category',
      type: 'relationship',
      label: 'קטגוריה',
      relationTo: 'categories',
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
          validate: validateMoneyAmount,
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
      // "featured" flag for anyone to forget to clear. Left blank means
      // genuinely unknown (most of the legacy catalogue): a fabricated date
      // would make historical stock read as newly published. See importedAt
      // below for when the record was brought into this system, which is a
      // different fact and must never be confused with this one.
      name: 'publishedAt',
      type: 'date',
      label: 'תאריך פרסום',
      admin: {
        description: 'השאירו ריק אם תאריך הפרסום האמיתי אינו ידוע.',
      },
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
    {
      // Migration-era fields: the reconciliation of the three legacy
      // catalogues (scripts/scrape/reconcile.mjs) found that most imported
      // books need a human decision, not a few exceptions — this is the
      // admin's ordinary worklist for that, not a one-time flag.
      name: 'needsReview',
      type: 'checkbox',
      label: 'דורש בדיקה',
      defaultValue: false,
    },
    {
      name: 'reviewReasons',
      type: 'select',
      label: 'סיבות לבדיקה',
      hasMany: true,
      options: REVIEW_REASONS,
    },
    {
      name: 'reviewNote',
      type: 'textarea',
      label: 'הערת בדיקה',
      admin: {
        description: 'For example, an ambiguous-match counterpart\'s title.',
      },
    },
    {
      name: 'importKey',
      type: 'text',
      label: 'מפתח ייבוא',
      unique: true,
      admin: {
        hidden: true,
      },
    },
    {
      // The one fact publishedAt must never be filled in with: when the
      // legacy-site import created this record. Audit trail, not editorial
      // content — set once at creation, never shown or edited.
      name: 'importedAt',
      type: 'date',
      label: 'תאריך יבוא',
      defaultValue: () => new Date().toISOString(),
      admin: {
        hidden: true,
      },
    },
  ],
}
