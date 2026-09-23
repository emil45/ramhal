import type { Block } from 'payload'

// An embedded YouTube video. The institute only ever links its own channel,
// so there is no separate provider field to choose — see VideoBlock.tsx.
export const VideoBlock: Block = {
  slug: 'video',
  labels: { singular: 'וידאו', plural: 'וידאו' },
  fields: [
    {
      name: 'videoId',
      type: 'text',
      label: 'מזהה סרטון ביוטיוב',
      required: true,
      admin: {
        description: 'המזהה בכתובת הסרטון, למשל heJLjGQZhsY.',
      },
    },
    {
      name: 'title',
      type: 'text',
      label: 'כותרת נגישה לסרטון',
      required: true,
      localized: true,
    },
  ],
}
