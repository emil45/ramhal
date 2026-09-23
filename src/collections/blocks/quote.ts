import type { Block } from 'payload'

// A pull-quote with an optional source citation. `variant` picks one of the
// existing visual treatments (see QuoteBlock.tsx) rather than letting free
// styling creep back into content.
export const QuoteBlock: Block = {
  slug: 'quote',
  labels: { singular: 'ציטוט', plural: 'ציטוטים' },
  fields: [
    {
      name: 'variant',
      type: 'select',
      label: 'סגנון',
      required: true,
      defaultValue: 'boxed',
      options: [
        { label: 'ראשי (בפתיחת העמוד)', value: 'hero' },
        { label: 'ממוסגר', value: 'boxed' },
        { label: 'מסורגל (קו מעל ומתחת)', value: 'ruled' },
        { label: 'מוטבע בטקסט', value: 'inline' },
        { label: 'הדגשה', value: 'highlight' },
      ],
    },
    {
      name: 'label',
      type: 'text',
      label: 'תווית עילית',
      localized: true,
      admin: {
        description: 'שורת טקסט קצרה מעל הציטוט (למשל "במשפט אחד"), במקום ציון מקור.',
      },
    },
    {
      name: 'quote',
      type: 'textarea',
      label: 'הציטוט',
      required: true,
      localized: true,
    },
    {
      name: 'source',
      type: 'text',
      label: 'מקור',
      localized: true,
      admin: {
        description: 'ריק עבור סגנון "הדגשה" או כשיש תווית עילית במקום.',
      },
    },
  ],
}
