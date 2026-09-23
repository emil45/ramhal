import type { CollectionConfig } from 'payload'

/**
 * One document per shopping session, keyed by an httpOnly cookie — see
 * src/lib/cartSession.ts. Never touched by a visitor directly: only the
 * server-side Local API reads or writes it, so every external access path
 * (REST, GraphQL, admin) is closed here.
 * Not an order — order-management is a later task; this is ephemeral,
 * pre-checkout state.
 */
export const Carts: CollectionConfig = {
  slug: 'carts',
  labels: {
    singular: 'עגלה',
    plural: 'עגלות',
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
    {
      name: 'sessionId',
      type: 'text',
      label: 'מזהה עגלה',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'items',
      type: 'array',
      label: 'פריטים',
      labels: { singular: 'פריט', plural: 'פריטים' },
      fields: [
        {
          name: 'book',
          type: 'relationship',
          label: 'ספר',
          relationTo: 'books',
          required: true,
        },
        {
          name: 'quantity',
          type: 'number',
          label: 'כמות',
          required: true,
          min: 1,
          defaultValue: 1,
        },
      ],
    },
  ],
}
