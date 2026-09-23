import { localizedDisplayTitleFields } from './fields/localizedDisplayTitleFields.ts'
import { computeDisplayTitleBeforeChange } from './hooks/displayTitle.ts'
import { generateSlugFromTitle } from './hooks/generateSlugFromTitle.ts'
import { requiredInAtLeastOneLocale } from './validators/requiredInAtLeastOneLocale.ts'
import { CURRENCIES } from '../lib/currency.ts'
import { validateMoneyAmount } from '../lib/validateMoneyAmount.ts'

import type { CollectionConfig } from 'payload'

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
    group: 'חנות',
    // he -> fr -> en, whichever exists — see localizedDisplayTitleFields.
    // Fixes the list, the relationship picker AND the document header at
    // once, since Payload renders useAsTitle in all three places.
    useAsTitle: 'displayTitle',
    defaultColumns: ['cover', 'displayTitle', 'displayTitleLocale', 'category', 'prices', 'inStock'],
    components: {
      beforeListTable: ['/components/admin/BookQuickFilters#BookQuickFilters'],
    },
  },
  hooks: {
    beforeChange: [computeDisplayTitleBeforeChange('books')],
  },
  fields: [
    ...localizedDisplayTitleFields(),
    {
      type: 'tabs',
      tabs: [
        {
          label: 'פרטי הספר',
          fields: [
            {
              name: 'title',
              type: 'text',
              label: 'כותרת',
              required: false, // enforced by validate below, in at least one locale, not this one
              localized: true,
              validate: requiredInAtLeastOneLocale('books'),
              admin: {
                description: 'כותרת הספר. אם הספר קיים רק בשפה אחת (למשל צרפתית בלבד), אפשר להשאיר את שאר השפות ריקות.',
              },
            },
            {
              name: 'subtitle',
              type: 'text',
              label: 'כותרת משנה',
              localized: true,
            },
            {
              type: 'collapsible',
              label: 'פרטים ביבליוגרפיים',
              admin: {
                initCollapsed: true,
              },
              fields: [
                {
                  name: 'creatorCredit',
                  type: 'text',
                  label: 'מחבר / עורך',
                  localized: true,
                  admin: {
                    description: 'השם או הקרדיט המדויק שיופיע בעמוד הספר, למשל הרב בצלאל נאור.',
                  },
                },
                {
                  name: 'publicationPlace',
                  type: 'text',
                  label: 'מקום הוצאה',
                  localized: true,
                  admin: {
                    description: 'עיר ההוצאה לאור, אם היא ידועה.',
                  },
                },
                {
                  name: 'publisherName',
                  type: 'text',
                  label: 'הוצאה לאור',
                  localized: true,
                  admin: {
                    description: 'השאירו ריק כאשר ההוצאה היא מכון רמח״ל בלבד; מלאו כאשר יש שם אחר או הוצאה משותפת.',
                  },
                },
                {
                  name: 'extent',
                  type: 'text',
                  label: 'היקף הספר',
                  localized: true,
                  admin: {
                    description: 'למשל 256 עמ׳ בעברית; 3 עמ׳ באנגלית (תקציר).',
                  },
                },
                {
                  name: 'endorsementCredits',
                  type: 'text',
                  label: 'הסכמות / המלצות',
                  localized: true,
                  admin: {
                    description: 'שמות נותני ההסכמות או ההמלצות, כפי שיופיעו בעמוד הספר.',
                  },
                },
              ],
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
              name: 'cover',
              type: 'upload',
              label: 'עטיפה',
              relationTo: 'media',
              admin: {
                components: { Cell: '/components/admin/CoverThumbnail#CoverThumbnail' },
              },
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
              name: 'publishedAt',
              type: 'date',
              label: 'תאריך פרסום',
              admin: {
                description: 'קובע את הופעת הספר תחת "חדש באתר". השאירו ריק אם תאריך הפרסום האמיתי אינו ידוע.',
              },
            },
            {
              name: 'hebrewYear',
              type: 'text',
              label: 'שנה עברית',
              admin: {
                description: 'למשל תשפ״ו.',
              },
            },
            {
              name: 'isbn',
              type: 'text',
              label: 'מספר ISBN',
              admin: {
                description: 'אם קיים לספר מספר ISBN מודפס.',
              },
            },
            {
              name: 'relatedSeries',
              type: 'relationship',
              label: 'סדרות שיעורים קשורות',
              relationTo: 'series',
              hasMany: true,
              admin: {
                description: 'סדרות שיעורים המבוססות על ספר זה, לקישור מעמוד הספר.',
              },
            },
          ],
        },
        {
          label: 'מחיר ומלאי',
          fields: [
            {
              name: 'prices',
              type: 'array',
              label: 'מחירים',
              labels: { singular: 'מחיר', plural: 'מחירים' },
              required: true,
              minRows: 1,
              admin: {
                components: { Cell: '/components/admin/PriceList#PriceList' },
              },
              fields: [
                {
                  type: 'row',
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
                        description: 'עד שתי ספרות עשרוניות, למשל 55 או 55.50.',
                      },
                    },
                  ],
                },
              ],
            },
            {
              name: 'shippingUnits',
              type: 'number',
              label: 'יחידות משלוח',
              required: true,
              defaultValue: 1,
              min: 1,
              admin: {
                description: 'כמה יחידות משלוח סופר הספר הזה בחישוב עלות המשלוח (בדרך כלל 1).',
              },
            },
          ],
        },
        {
          label: 'מתקדם',
          description: 'שדות טכניים — נדרשים רק לעיתים רחוקות.',
          fields: [
            {
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
              name: 'needsReview',
              type: 'checkbox',
              label: 'דורש בדיקה',
              defaultValue: false,
              admin: {
                description: 'סומן אוטומטית בייבוא הנתונים כשמשהו בספר זה לא היה ודאי. ראו את סיבות הבדיקה למטה.',
              },
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
                description: 'למשל, כותרת הספר המקביל שההתאמה אליו לא הייתה ודאית.',
              },
            },
          ],
        },
      ],
    },
    {
      // The language the book is WRITTEN in — not the locale it is described in.
      // See docs/tasks/TASK-01-payload-setup.md §3.
      name: 'bookLanguage',
      type: 'select',
      label: 'שפת החיבור',
      required: true,
      options: BOOK_LANGUAGES,
      admin: { position: 'sidebar' },
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
      admin: { position: 'sidebar' },
    },
    {
      name: 'inStock',
      type: 'checkbox',
      label: 'במלאי',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        components: { Cell: '/components/admin/StockBadge#StockBadge' },
      },
    },
    {
      // Legacy, per-locale slug — kept for redirecting old locale-scoped URLs,
      // never read for routing any more (see urlSlug above and
      // docs/reports/TASK-07.md §A1). Import plumbing, not something the son
      // ever needs to fill in — not required, and out of his way.
      // `unique: true` here is per-locale (Postgres enforces
      // UNIQUE(slug, _locale)), which is exactly the bug that made two books
      // collapse onto one cross-locale public URL — uniqueness for the
      // public URL is urlSlug's job now, not this field's.
      name: 'slug',
      type: 'text',
      label: 'כתובת ישנה (Slug, לכל שפה)',
      unique: true,
      localized: true,
      hooks: {
        beforeValidate: [generateSlugFromTitle],
      },
      admin: {
        hidden: true,
      },
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
