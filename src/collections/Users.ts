import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  fields: [
    {
      name: 'fullName',
      type: 'text',
      label: 'Full Name',
      required: true,
    },
    {
      name: 'phone',
      type: 'text',
      label: 'Phone Number',
      required: true,
      admin: {
        description: 'Include country code, e.g. +1 555 123 4567',
      },
      validate: (value: string | string[] | null | undefined) => {
        if (!value) return 'Phone number is required'
        if (Array.isArray(value)) return 'Invalid phone number format'
        const regex = /^\+?[0-9()\-\s]{7,20}$/
        return regex.test(value) || 'Invalid phone number format'
      },
    },
    {
      name: 'role',
      type: 'select',
      label: 'Role',
      required: true,
      defaultValue: 'WORKER',
      options: [
        { label: 'Admin', value: 'ADMIN' },
        { label: 'Worker', value: 'WORKER' },
      ],
      admin: {
        description: 'Determines access level within the system.',
      },
    },
    {
      name: 'profilePicture',
      label: 'Profile Picture',
      type: 'upload',
      relationTo: 'media',
      required: false,
    },
  ],
}
