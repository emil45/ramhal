import { localizedDisplayTitleFields } from './fields/localizedDisplayTitleFields.ts'
import { computeDisplayTitleBeforeChange } from './hooks/displayTitle.ts'
import { revalidateStorefront } from './hooks/revalidateStorefront.ts'
import { requiredInAtLeastOneLocale } from './validators/requiredInAtLeastOneLocale.ts'

import type { CollectionConfig } from 'payload'

import { validateNewsLinkUrl } from '@/lib/newsLink'

// One-off events — a hilula, a seminar. Recurring shiurim are NOT events; they
// live in the schedule global. The two look alike on the page and are
// nothing alike in the admin (docs/DECISIONS.md §8).
export const Events: CollectionConfig = {
  slug: 'events',
  labels: {
    singular: 'אירוע',
    plural: 'אירועים',
  },
  admin: {
    group: 'תוכן',
    useAsTitle: 'displayTitle',
    defaultColumns: ['displayTitle', 'displayTitleLocale', 'startsAt', 'location'],
  },
  defaultSort: '-startsAt',
  hooks: {
    afterChange: [revalidateStorefront],
    afterDelete: [revalidateStorefront],
    beforeChange: [computeDisplayTitleBeforeChange('events')],
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
              validate: requiredInAtLeastOneLocale('events'),
            },
            {
              name: 'description',
              type: 'richText',
              label: 'תיאור',
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
      name: 'location',
      type: 'text',
      label: 'מיקום',
      localized: true,
      admin: { position: 'sidebar' },
    },
  ],
}
