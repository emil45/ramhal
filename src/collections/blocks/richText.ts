import type { Block } from 'payload'

// Prose: paragraphs, bold/italic, links, blockquotes and lists — the default
// Lexical feature set (src/payload.config.ts's editor) is enough for every
// narrative page; none of them need inline images or embeds.
export const RichTextBlock: Block = {
  slug: 'richText',
  labels: { singular: 'טקסט', plural: 'טקסטים' },
  fields: [
    {
      name: 'body',
      type: 'richText',
      label: 'תוכן',
      required: true,
      localized: true,
    },
  ],
}
