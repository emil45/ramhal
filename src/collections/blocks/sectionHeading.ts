import type { Block } from 'payload'

// Marks the start of a titled section within a page's content. Everything
// after it, up to the next sectionHeading block, belongs to that section —
// grouping is by position, not nesting, so editors reorder content the same
// way for every block type (src/lib/pageSections.ts does the grouping).
export const SectionHeadingBlock: Block = {
  slug: 'sectionHeading',
  labels: { singular: 'כותרת פרק', plural: 'כותרות פרק' },
  fields: [
    {
      name: 'style',
      type: 'select',
      label: 'סגנון',
      required: true,
      defaultValue: 'standard',
      options: [
        { label: 'רגיל', value: 'standard' },
        { label: 'מאמר (עם ניקוב ותוכן עניינים)', value: 'article' },
        { label: 'וידאו', value: 'video' },
        { label: 'סיכום (רצועה כהה בסוף העמוד)', value: 'concluding' },
      ],
    },
    {
      name: 'heading',
      type: 'text',
      label: 'כותרת',
      required: true,
      localized: true,
    },
    {
      name: 'kicker',
      type: 'text',
      label: 'תווית עילית',
      localized: true,
      admin: {
        description: 'שורת טקסט קצרה מעל הכותרת. רלוונטי לסגנון "מאמר" ו"וידאו" בלבד.',
      },
    },
    {
      name: 'ornament',
      type: 'text',
      label: 'סימן קישוט',
      localized: true,
      maxLength: 2,
      admin: {
        description: 'תו יחיד (כגון אות עברית) המוצג מעל הכותרת. רלוונטי לסגנון "מאמר" בלבד.',
      },
    },
  ],
}
