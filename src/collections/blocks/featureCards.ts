import { PAGE_ICON_OPTIONS } from '../../lib/pageIcons.ts'

import type { Block } from 'payload'

// A row of icon + title + body cards (the "one home, three circles" section).
export const FeatureCardsBlock: Block = {
  slug: 'featureCards',
  labels: { singular: 'כרטיסי תכונה', plural: 'כרטיסי תכונה' },
  fields: [
    {
      name: 'items',
      type: 'array',
      label: 'כרטיסים',
      labels: { singular: 'כרטיס', plural: 'כרטיסים' },
      minRows: 1,
      fields: [
        {
          name: 'icon',
          type: 'select',
          label: 'סמל',
          required: true,
          options: [...PAGE_ICON_OPTIONS],
        },
        {
          name: 'title',
          type: 'text',
          label: 'כותרת',
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
