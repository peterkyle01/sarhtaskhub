import type { CollectionConfig } from 'payload'

// Base Users collection: all actors (ADMIN, WORKER, CLIENT)
function generateWorkerCode(): string {
  return 'WK' + Date.now().toString().slice(-6)
}

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
        // Display Tutor instead of Worker (value remains WORKER for backend compatibility)
        { label: 'Tutor', value: 'WORKER' },
        { label: 'Client', value: 'CLIENT' },
      ],
      admin: {
        description: 'Determines access level within the system.',
      },
    },
    // Auto-generated workerId (displayed as Tutor ID in UI) for users whose role is WORKER
    {
      name: 'workerId',
      type: 'text',
      label: 'Tutor ID',
      unique: true,
      index: true,
      admin: {
        readOnly: true,
        description: 'Auto-generated identifier for tutor accounts (e.g., WK123456).',
        condition: (data) => data?.role === 'WORKER',
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
  hooks: {
    beforeChange: [
      async ({ data, operation }) => {
        if ((operation === 'create' || operation === 'update') && data?.role === 'WORKER') {
          if (!data.workerId) {
            data.workerId = generateWorkerCode()
          }
        }
        return data
      },
    ],
  },
}
