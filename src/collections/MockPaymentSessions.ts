import type { CollectionConfig } from 'payload'

import { CURRENCIES } from '../lib/currency.ts'
import { LOCALES } from '../lib/locale.ts'
import { MOCK_PAYMENT_DECISIONS } from '../lib/payment/mockPaymentDecision.ts'

/**
 * The mock payment provider's side of the conversation — what a real
 * processor would remember on its own servers. Exists only so
 * `confirmPayment` has something to ask that is not the customer's browser.
 * Delete this collection with src/lib/payment/mockPaymentProvider.ts when a
 * real provider replaces the mock. Server-only: no external access at all.
 */
export const MockPaymentSessions: CollectionConfig = {
  slug: 'mockPaymentSessions',
  labels: {
    singular: 'סשן תשלום מדומה',
    plural: 'סשנים של תשלום מדומה',
  },
  admin: {
    hidden: true,
  },
  access: {
    read: () => false,
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    { name: 'providerRef', type: 'text', label: 'מזהה תשלום', required: true, unique: true },
    { name: 'orderNumber', type: 'number', label: 'מספר הזמנה', required: true },
    { name: 'currency', type: 'select', label: 'מטבע', required: true, options: CURRENCIES.map((value) => ({ label: value, value })) },
    { name: 'total', type: 'number', label: 'סכום', required: true, min: 0 },
    { name: 'locale', type: 'select', label: 'שפה', required: true, options: LOCALES.map((value) => ({ label: value, value })) },
    { name: 'returnUrl', type: 'text', label: 'כתובת חזרה', required: true },
    {
      name: 'decision',
      type: 'select',
      label: 'החלטת הלקוח',
      required: true,
      defaultValue: 'awaiting',
      options: ['awaiting', ...MOCK_PAYMENT_DECISIONS].map((value) => ({ label: value, value })),
    },
    { name: 'providerEventId', type: 'text', label: 'מזהה אירוע', unique: true },
  ],
}
