import { localizedDisplayTitleFields } from './fields/localizedDisplayTitleFields.ts'
import { computeDisplayTitleBeforeChange } from './hooks/displayTitle.ts'
import { requiredInAtLeastOneLocale } from './validators/requiredInAtLeastOneLocale.ts'

import type { CollectionConfig } from 'payload'

import { validateNewsLinkUrl } from '@/lib/newsLink'

// Anything dated expires itself. A stale "coming soon" notice is the commonest
// way an institute site announces that nobody is home — public queries must
// filter on endsAt, not rely on someone remembering to unpublish.
export const Announcements: CollectionConfig = {
  slug: 'announcements',
  labels: {
    singular: 'הודעה',
    plural: 'הודעות',
  },
  admin: {
    group: 'תוכן',
    useAsTitle: 'displayTitle',
    defaultColumns: ['displayTitle', 'displayTitleLocale', 'startsAt', 'endsAt'],
  },
  defaultSort: '-startsAt',
  hooks: {
    beforeChange: [computeDisplayTitleBeforeChange('announcements')],
  },
  fields: [
    ...localizedDisplayTitleFields(),
    {
      type: 'tabs',
      tabs: [
        {
          label: 'תוכן',
          fields: [
            {
              name: 'title',
              type: 'text',
              label: 'כותרת',
              required: false, // enforced by validate below, in at least one locale, not this one
              localized: true,
              validate: requiredInAtLeastOneLocale('announcements'),
            },
            {
              name: 'body',
              type: 'richText',
              label: 'תוכן',
              localized: true,
            },
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              label: 'תמונה',
            },
            {
              name: 'link',
              type: 'group',
              label: 'קישור',
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'label',
                      type: 'text',
                      label: 'טקסט הקישור',
                      localized: true,
                    },
                    {
                      name: 'url',
                      type: 'text',
                      label: 'כתובת',
                      validate: validateNewsLinkUrl,
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'startsAt',
      type: 'date',
      label: 'תאריך התחלה',
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'endsAt',
      type: 'date',
      label: 'תאריך סיום',
      admin: {
        position: 'sidebar',
        description: 'ההודעה תיעלם מהאתר אוטומטית אחרי תאריך זה. השאירו ריק כדי שתישאר ללא הגבלת זמן.',
      },
    },
  ],
}
