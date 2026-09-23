import type { Block } from 'payload'

// A short label paired with a body of text, repeated. `layout` covers both
// shapes seen today: a grid of ornamented cards (an ordinal list of points)
// and a stacked definition list (a glossary of works).
export const LabeledListBlock: Block = {
  slug: 'labeledList',
  labels: { singular: 'רשימה מתויגת', plural: 'רשימות מתויגות' },
  fields: [
    {
      name: 'layout',
      type: 'select',
      label: 'פריסה',
      required: true,
      defaultValue: 'stacked',
      options: [
        { label: 'רשת', value: 'grid' },
        { label: 'טור', value: 'stacked' },
      ],
    },
    {
      name: 'items',
      type: 'array',
      label: 'פריטים',
      labels: { singular: 'פריט', plural: 'פריטים' },
      minRows: 1,
      fields: [
        {
          name: 'marker',
          type: 'text',
          label: 'סימן',
          localized: true,
          maxLength: 2,
          admin: {
            description: 'תו יחיד (כגון אות עברית). רלוונטי לפריסת "רשת" בלבד.',
          },
        },
        {
          name: 'label',
          type: 'text',
          label: 'תווית',
          required: true,
          localized: true,
        },
        {
          name: 'body',
          type: 'textarea',
          label: 'תיאור',
          required: true,
          localized: true,
        },
      ],
    },
  ],
}
