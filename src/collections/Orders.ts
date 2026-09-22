import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'

import { CURRENCIES } from '../lib/currency.ts'
import { LOCALES } from '../lib/locale.ts'
import { FULFILMENT_STATUSES, PAYMENT_STATUSES } from '../lib/orderStatus.ts'
import { formatPrice } from '../lib/price.ts'

/**
 * A sale, as it was at the moment of sale. Written only by the server
 * (src/lib/placeOrder.ts and src/lib/payment/orderPayment.ts) — the son
 * reads orders and moves them through fulfilment; he never creates one or
 * edits what was sold and for how much. Every money field is a major-unit
 * amount (shekels/dollars/euros), and every line snapshots its book instead
 * of pointing at it (docs/DECISIONS.md §16).
 */

// Nobody edits these through the admin or the REST API. The server's Local
// API bypasses access control, so it can still write them.
function setByServerOnly(description?: string) {
  return { access: { update: () => false }, admin: { readOnly: true, description } }
}

const MAJOR_UNITS_NOTE = 'סכום בשקלים/דולרים/יורו — עד שתי ספרות עשרוניות.'

/** Hebrew labels for the two statuses' options. Kept beside the option lists
 * so a new status cannot be added without one. */
const PAYMENT_STATUS_LABELS: Record<(typeof PAYMENT_STATUSES)[number], string> = {
  pending: 'ממתין לתשלום',
  paid: 'שולם',
  failed: 'התשלום נכשל',
  cancelled: 'בוטל',
}

const FULFILMENT_STATUS_LABELS: Record<(typeof FULFILMENT_STATUSES)[number], string> = {
  new: 'חדשה',
  packed: 'ארוזה',
  posted: 'נשלחה',
  collected: 'נאספה',
}

const LOCALE_LABELS: Record<(typeof LOCALES)[number], string> = { he: 'עברית', en: 'English', fr: 'Français' }

// Field access already stops the admin and the REST API; this stops server
// code too, because a changed total would silently rewrite what a customer
// was charged.
const refuseChangingTotal: CollectionBeforeChangeHook = ({ data, operation, originalDoc }) => {
  if (operation === 'update' && originalDoc && data.total !== undefined && data.total !== originalDoc.total) {
    throw new Error('An order total can never be changed after the order is placed.')
  }
  return data
}

export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: {
    singular: 'הזמנה',
    plural: 'הזמנות',
  },
  admin: {
    useAsTitle: 'id',
    defaultColumns: ['orderNumber', 'createdAt', 'customer.name', 'formattedTotal', 'paymentStatus', 'fulfilmentStatus'],
    listSearchableFields: ['id', 'customer.name', 'customer.email', 'customer.phone'],
    components: {
      beforeListTable: ['/components/admin/OrderQuickFilters#OrderQuickFilters'],
    },
  },
  defaultSort: '-createdAt',
  access: {
    read: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    create: () => false,
    delete: () => false,
  },
  hooks: {
    beforeChange: [refuseChangingTotal],
  },
  fields: [
    {
      // The order's own id, started at 1001 by its migration: sequential
      // (Postgres's serial), stable (an id never changes), short enough to
      // read down a phone, and searchable in the admin without a second
      // counter that could race or drift.
      name: 'orderNumber',
      type: 'number',
      label: 'מספר הזמנה',
      virtual: true,
      admin: { readOnly: true },
      hooks: { afterRead: [({ data }) => data?.id ?? null] },
    },
    {
      name: 'paymentStatus',
      type: 'select',
      label: 'סטטוס תשלום',
      required: true,
      defaultValue: 'pending',
      index: true,
      options: PAYMENT_STATUSES.map((value) => ({ label: PAYMENT_STATUS_LABELS[value], value })),
      ...setByServerOnly(),
    },
    {
      // Null until the order is paid: an abandoned checkout is a pending
      // payment, not an order waiting to be packed, and must not appear in
      // the fulfilment lists.
      name: 'fulfilmentStatus',
      type: 'select',
      label: 'סטטוס טיפול',
      index: true,
      options: FULFILMENT_STATUSES.map((value) => ({ label: FULFILMENT_STATUS_LABELS[value], value })),
      admin: {
        condition: (data) => data.paymentStatus === 'paid',
      },
    },
    {
      name: 'customer',
      type: 'group',
      label: 'לקוח',
      fields: [
        { name: 'name', type: 'text', label: 'שם', required: true },
        { name: 'email', type: 'email', label: 'דוא״ל', required: true },
        { name: 'phone', type: 'text', label: 'טלפון', required: true },
        {
          name: 'address',
          type: 'group',
          label: 'כתובת למשלוח',
          fields: [
            { name: 'line1', type: 'text', label: 'רחוב ומספר' },
            { name: 'line2', type: 'text', label: 'כתובת — המשך' },
            { name: 'city', type: 'text', label: 'עיר' },
            { name: 'postalCode', type: 'text', label: 'מיקוד' },
          ],
        },
      ],
    },
    {
      name: 'lines',
      type: 'array',
      label: 'פריטים',
      labels: { singular: 'פריט', plural: 'פריטים' },
      required: true,
      minRows: 1,
      ...setByServerOnly(),
      fields: [
        {
          // Only a convenience link back to the catalogue: the book may be
          // deleted later (the reference then goes blank), and the fields
          // below still say exactly what was sold.
          name: 'book',
          type: 'relationship',
          label: 'ספר',
          relationTo: 'books',
        },
        { name: 'title', type: 'text', label: 'כותרת כפי שנמכרה', required: true },
        {
          name: 'unitPrice',
          type: 'number',
          label: 'מחיר ליחידה ששולם',
          required: true,
          min: 0,
          admin: { description: MAJOR_UNITS_NOTE },
        },
        {
          name: 'currency',
          type: 'select',
          label: 'מטבע',
          required: true,
          options: CURRENCIES.map((currency) => ({ label: currency, value: currency })),
        },
        { name: 'quantity', type: 'number', label: 'כמות', required: true, min: 1 },
        { name: 'shippingUnits', type: 'number', label: 'יחידות משלוח (כפי שנספרו)', required: true, min: 1 },
      ],
    },
    {
      name: 'currency',
      type: 'select',
      label: 'מטבע',
      required: true,
      options: CURRENCIES.map((currency) => ({ label: currency, value: currency })),
      ...setByServerOnly(),
    },
    {
      name: 'subtotal',
      type: 'number',
      label: 'סכום ביניים',
      required: true,
      min: 0,
      ...setByServerOnly(MAJOR_UNITS_NOTE),
    },
    {
      name: 'shippingCost',
      type: 'number',
      label: 'עלות משלוח',
      required: true,
      min: 0,
      ...setByServerOnly(MAJOR_UNITS_NOTE),
    },
    {
      name: 'total',
      type: 'number',
      label: 'סה״כ',
      required: true,
      min: 0,
      ...setByServerOnly(MAJOR_UNITS_NOTE),
    },
    {
      // The total in a form he can read at a glance, with the currency
      // symbol and thousands separators — friendlier than the raw number.
      name: 'formattedTotal',
      type: 'text',
      label: 'סה״כ',
      virtual: true,
      admin: { readOnly: true },
      hooks: {
        afterRead: [({ data }) => (data ? formatPrice(data.total, data.currency, 'he') : null)],
      },
    },
    { name: 'shippingZone', type: 'text', label: 'אזור משלוח', required: true, ...setByServerOnly() },
    { name: 'destinationCountry', type: 'text', label: 'מדינת יעד', required: true, ...setByServerOnly() },
    {
      name: 'isPickup',
      type: 'checkbox',
      label: 'איסוף עצמי',
      defaultValue: false,
      ...setByServerOnly(),
    },
    {
      // The language the customer shopped in — which language to expect when
      // the son calls them.
      name: 'locale',
      type: 'select',
      label: 'שפת הלקוח',
      required: true,
      options: LOCALES.map((value) => ({ label: LOCALE_LABELS[value], value })),
      ...setByServerOnly(),
    },
    { name: 'provider', type: 'text', label: 'ספק תשלום', required: true, ...setByServerOnly() },
    { name: 'providerRef', type: 'text', label: 'מזהה תשלום אצל הספק', index: true, ...setByServerOnly() },
    { name: 'paidAt', type: 'date', label: 'שולם בתאריך', ...setByServerOnly() },
    {
      // The customer-facing key in confirmation URLs: unguessable, so a
      // guest can reopen their own order page and nobody can walk the
      // sequential order numbers to read someone else's.
      name: 'publicToken',
      type: 'text',
      label: 'מפתח ציבורי',
      required: true,
      unique: true,
      access: { update: () => false },
      admin: { hidden: true },
    },
  ],
}
