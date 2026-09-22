import type { GlobalConfig } from 'payload'

import { CURRENCIES } from '../lib/currency.ts'
import { validateMoneyAmount } from '../lib/validateMoneyAmount.ts'

// The shipping rules engine, editable by the son. Payload's ecommerce plugin
// ships no shipping logic at all (verified — see docs/DECISIONS.md §5), so
// this is ours. The calculation itself lives in src/lib/shipping.ts as a pure
// function; this global only holds the data it reads.
export const ShippingSettings: GlobalConfig = {
  slug: 'shippingSettings',
  label: 'הגדרות משלוח',
  fields: [
    {
      name: 'zones',
      type: 'array',
      label: 'אזורי משלוח',
      labels: { singular: 'אזור', plural: 'אזורים' },
      required: true,
      minRows: 1,
      fields: [
        {
          name: 'name',
          type: 'text',
          label: 'שם',
          required: true,
          admin: {
            description: 'e.g. ישראל, אירופה, שאר העולם',
          },
        },
        {
          name: 'countries',
          type: 'text',
          label: 'מדינות',
          hasMany: true,
          required: true,
          admin: {
            description: 'ISO country codes.',
          },
        },
        {
          name: 'currency',
          type: 'select',
          label: 'מטבע',
          required: true,
          options: CURRENCIES.map((currency) => ({ label: currency, value: currency })),
        },
        {
          name: 'tiers',
          type: 'array',
          label: 'מדרגות מחיר',
          labels: { singular: 'מדרגה', plural: 'מדרגות' },
          required: true,
          minRows: 1,
          fields: [
            {
              name: 'minUnits',
              type: 'number',
              label: 'יחידות מינימום',
              required: true,
              min: 0,
            },
            {
              name: 'amount',
              type: 'number',
              label: 'סכום',
              required: true,
              min: 0,
              validate: validateMoneyAmount,
              admin: {
                description: 'סכום בשקלים/דולרים/יורו (למשל 30 או 30.50) — עד שתי ספרות עשרוניות.',
              },
            },
          ],
        },
        {
          name: 'freeAboveUnits',
          type: 'number',
          label: 'משלוח חינם מעל (יחידות)',
          min: 0,
          admin: {
            description: 'Free shipping at or above this many units. Leave blank for no free tier.',
          },
        },
        {
          name: 'allowPickup',
          type: 'checkbox',
          label: 'איסוף עצמי מותר',
          defaultValue: false,
        },
        {
          name: 'isDefault',
          type: 'checkbox',
          label: 'ברירת מחדל',
          defaultValue: false,
          admin: {
            description: 'The zone used when a destination matches no other zone. Flag exactly one.',
          },
        },
      ],
    },
  ],
}
