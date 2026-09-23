import type { Block } from 'payload'

// A titled row of short badge chips (the "subjects studied" list).
export const TagListBlock: Block = {
  slug: 'tagList',
  labels: { singular: 'רשימת תגיות', plural: 'רשימות תגיות' },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'כותרת',
      required: true,
      localized: true,
    },
    {
      name: 'tags',
      type: 'array',
      label: 'תגיות',
      labels: { singular: 'תגית', plural: 'תגיות' },
      minRows: 1,
      fields: [
        {
          name: 'label',
          type: 'text',
          label: 'טקסט',
          required: true,
          localized: true,
        },
      ],
    },
  ],
}
