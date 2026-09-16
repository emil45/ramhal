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
