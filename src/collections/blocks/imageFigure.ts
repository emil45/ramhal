import type { Block } from 'payload'

// A single photo with an optional caption. Sizing, cropping and priority are
// fixed per placement in each page's own component (ImageFigureBlock.tsx) —
// an editor changes the photo and caption, never the layout.
export const ImageFigureBlock: Block = {
  slug: 'imageFigure',
  labels: { singular: 'תמונה', plural: 'תמונות' },
  fields: [
    {
      name: 'image',
      type: 'upload',
      label: 'תמונה',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'caption',
      type: 'text',
      label: 'כיתוב',
      localized: true,
    },
  ],
}
