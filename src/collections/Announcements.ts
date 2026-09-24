import { localizedDisplayTitleFields } from './fields/localizedDisplayTitleFields.ts'
import { computeDisplayTitleBeforeChange } from './hooks/displayTitle.ts'
import { revalidateStorefront } from './hooks/revalidateStorefront.ts'
import { requiredInAtLeastOneLocale } from './validators/requiredInAtLeastOneLocale.ts'

import type { CollectionConfig } from 'payload'

import { validateNewsLinkUrl } from '@/lib/newsLink'

// Visibility is manual: the storefront shows every announcement that exists,
// and the son deletes one when it is over (docs/DECISIONS.md §8). startsAt is
// the date shown with it and the order it is listed in, not a schedule.
export const Announcements: CollectionConfig = {
  slug: 'announcements',
  labels: {
    singular: 'הודעה',
    plural: 'הודעות',
  },
  admin: {
    group: 'תוכן',
    useAsTitle: 'displayTitle',
    defaultColumns: ['displayTitle', 'displayTitleLocale', 'startsAt'],
  },
  defaultSort: '-startsAt',
  hooks: {
    afterChange: [revalidateStorefront],
    afterDelete: [revalidateStorefront],
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
      label: 'תאריך',
      required: true,
      admin: { position: 'sidebar' },
    },
  ],
}
