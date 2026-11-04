import type { GlobalConfig } from 'payload'

import { INLINE_ROWS_CLASS_NAME } from '../collections/fields/inlineRows.ts'
import { revalidateStorefront } from '../collections/hooks/revalidateStorefront.ts'
import { CURRENCIES } from '../lib/shop/currency.ts'
import { validateMoneyAmount } from '../lib/admin/validateMoneyAmount.ts'
import { validateShippingAmounts } from '../lib/admin/validateShippingAmounts.ts'

// The shipping rules engine, editable by the son. Payload's ecommerce plugin
// ships no shipping logic at all (verified — see CLAUDE.md), so
// this is ours. The calculation itself lives in src/lib/shop/shipping.ts as a pure
// function; this global only holds the data it reads.
export const ShippingSettings: GlobalConfig = {
  slug: 'shippingSettings',
  label: 'הגדרות משלוח',
  admin: {
    group: 'הגדרות',
    description:
      'אזורי המשלוח ומחירו לפי מספר הספרים בהזמנה. המדינה נבחרת על ידי הלקוח בתשלום, והמטבע נקבע לפי שפת האתר שבה הוא גולש — לכן לכל מדרגה יש סכום בכל שלושת המטבעות.',
  },
  hooks: {
    afterChange: [revalidateStorefront],
  },
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
            description: 'למשל ישראל, אירופה, שאר העולם.',
          },
        },
        {
          name: 'countries',
          type: 'text',
          label: 'מדינות',
          hasMany: true,
          required: true,
          admin: {
            description: 'קודי מדינה בני שתי אותיות (ISO), למשל IL, FR.',
          },
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
              name: 'amounts',
              type: 'array',
              label: 'סכום משלוח לפי מטבע',
              labels: { singular: 'סכום', plural: 'סכומים' },
              admin: {
                className: INLINE_ROWS_CLASS_NAME,
                description: 'סכום אחד בכל מטבע (שקלים, יורו, דולרים), למשל 30 או 30.50 — עד שתי ספרות עשרוניות.',
              },
              required: true,
              defaultValue: CURRENCIES.map((currency) => ({ currency })),
              validate: validateShippingAmounts,
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
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          name: 'freeAboveUnits',
          type: 'number',
          label: 'משלוח חינם מעל (יחידות)',
          min: 0,
          admin: {
            description: 'משלוח חינם החל ממספר היחידות הזה. אם משאירים ריק — אין משלוח חינם.',
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
            description: 'האזור שחל כשהיעד לא מתאים לאף אזור אחר. יש לסמן אזור אחד בדיוק.',
          },
        },
      ],
    },
  ],
}
