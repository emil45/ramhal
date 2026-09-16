import type { GlobalConfig } from 'payload'

import { CURRENCIES } from '@/lib/currency'

// Contact details, social links, the currency shown per locale.
export const SiteSettings: GlobalConfig = {
  slug: 'siteSettings',
  label: 'הגדרות האתר',
  fields: [
    {
      name: 'contact',
      type: 'group',
      label: 'יצירת קשר',
      fields: [
        {
          name: 'address',
          type: 'text',
          label: 'כתובת',
          localized: true,
        },
        {
          name: 'phone',
          type: 'text',
          label: 'טלפון',
        },
        {
          name: 'email',
          type: 'email',
          label: 'דוא"ל',
        },
      ],
    },
    {
      name: 'socialLinks',
      type: 'array',
      label: 'קישורי רשתות חברתיות',
      labels: { singular: 'קישור', plural: 'קישורים' },
      fields: [
        {
          name: 'platform',
          type: 'text',
          label: 'פלטפורמה',
          required: true,
        },
        {
          name: 'url',
          type: 'text',
          label: 'כתובת',
          required: true,
        },
      ],
    },
    {
      name: 'currencyByLocale',
      type: 'array',
      label: 'מטבע לפי שפה',
      labels: { singular: 'מטבע', plural: 'מטבעות' },
      admin: {
        description: 'The currency shown by default for each locale.',
      },
      fields: [
        {
          name: 'locale',
          type: 'select',
          label: 'שפה',
          required: true,
          options: [
            { label: 'עברית', value: 'he' },
            { label: 'English', value: 'en' },
            { label: 'Français', value: 'fr' },
          ],
        },
        {
          name: 'currency',
          type: 'select',
          label: 'מטבע',
          required: true,
          options: CURRENCIES.map((currency) => ({ label: currency, value: currency })),
        },
      ],
    },
  ],
}
