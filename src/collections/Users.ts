import { allowOnlyListedAdmins } from './hooks/allowOnlyListedAdmins.ts'

import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: 'משתמש',
    plural: 'משתמשים',
  },
  // Local (email+password) login is disabled — Google sign-in is the only
  // way in. enableFields keeps the password columns in the schema (no
  // migration to drop them) even though nothing can use them for login
  // anymore. See docs/DECISIONS.md §19: this was originally a deliberate
  // break-glass path, reversed on 22 September 2026 at Emanuel's explicit
  // instruction after production briefly carried a real password.
  auth: { disableLocalStrategy: { enableFields: true } },
  admin: {
    group: 'מערכת',
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
