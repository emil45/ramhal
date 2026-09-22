import { allowOnlyListedAdmins } from './hooks/allowOnlyListedAdmins.ts'

import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: 'משתמש',
    plural: 'משתמשים',
  },
  auth: true,
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'role'],
  },
  hooks: {
    // Covers password login, the Google callback and REST /api/users/login
    // alike — see the hook's own comment and docs/DECISIONS.md §19.
    beforeLogin: [allowOnlyListedAdmins],
  },
  access: {
    // Only admins manage user accounts; editors can see who else has access.
    create: ({ req: { user } }) => user?.role === 'admin',
    update: ({ req: { user } }) => user?.role === 'admin',
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      label: 'תפקיד',
      required: true,
      defaultValue: 'editor',
      options: [
        { label: 'מנהל', value: 'admin' },
        { label: 'עורך', value: 'editor' },
      ],
    },
  ],
}
