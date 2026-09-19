import type { CollectionConfig } from 'payload'

import { PAYMENT_STATUSES } from '../lib/orderStatus.ts'

/**
 * One row per confirmation a payment provider has told us about. The UNIQUE
 * constraint on `providerEventId` is what makes handling a confirmation
 * idempotent: every real provider retries, and two deliveries of the same
 * event can race, so "have we seen this?" must be answered by the database,
 * not by application code that reads then writes (src/lib/payment/orderPayment.ts).
 * An audit trail as much as a lock — read-only to everyone, written only by
 * the server.
 */
export const PaymentEvents: CollectionConfig = {
  slug: 'paymentEvents',
  labels: {
    singular: 'אירוע תשלום',
    plural: 'אירועי תשלום',
  },
  admin: {
    useAsTitle: 'providerEventId',
    defaultColumns: ['providerEventId', 'provider', 'order', 'status', 'createdAt'],
    group: 'מערכת',
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    {
      name: 'providerEventId',
      type: 'text',
      label: 'מזהה אירוע אצל הספק',
      required: true,
      unique: true,
    },
    { name: 'provider', type: 'text', label: 'ספק תשלום', required: true },
    { name: 'order', type: 'relationship', label: 'הזמנה', relationTo: 'orders', required: true },
    {
      name: 'status',
      type: 'select',
      label: 'תוצאה שדווחה',
      required: true,
      options: PAYMENT_STATUSES.filter((value) => value !== 'pending').map((value) => ({ label: value, value })),
    },
  ],
}
