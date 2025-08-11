import type { CollectionConfig } from 'payload'

// Utility to generate sequential-like IDs (e.g., CL001) - simplistic, consider a dedicated sequence in production
function generateClientCode(): string {
  return 'CL' + Date.now().toString().slice(-5)
}

export const Clients: CollectionConfig = {
  slug: 'clients',
  admin: {
    useAsTitle: 'name',
    defaultColumns: [
      'clientId',
      'user',
      'name',
      'platform',
      'courseName',
      'deadline',
      'progress',
      'assignedWorker',
    ],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) =>
      !!user && 'role' in user && (user.role === 'ADMIN' || user.role === 'WORKER'),
    update: ({ req: { user } }) =>
      !!user && 'role' in user && (user.role === 'ADMIN' || user.role === 'WORKER'),
    delete: ({ req: { user } }) => !!user && 'role' in user && user.role === 'ADMIN',
  },
  fields: [
    // Link to base user (must have role CLIENT)
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      unique: true,
      admin: {
        description: 'Base user record (must have role CLIENT).',
      },
      filterOptions: {
        role: { equals: 'CLIENT' },
      },
    },
    {
      name: 'clientId',
      type: 'text',
      label: 'Client ID',
      unique: true,
      index: true,
      admin: {
        readOnly: true,
        description: 'Auto-generated (e.g., CL12345)',
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Internal/client project or account name.',
      },
    },
    {
      name: 'platform',
      type: 'select',
      required: true,
      options: [
        { label: 'Cengage', value: 'Cengage' },
        { label: 'ALEKS', value: 'ALEKS' },
      ],
    },
    {
      name: 'courseName',
      type: 'text',
      required: true,
      label: 'Course Name',
    },
    {
      name: 'deadline',
      type: 'date',
      label: 'Deadline',
      required: true,
    },
    {
      name: 'progress',
      type: 'select',
      required: true,
      defaultValue: 'Not Started',
      options: [
        { label: 'Not Started', value: 'Not Started' },
        { label: 'In Progress', value: 'In Progress' },
        { label: 'Completed', value: 'Completed' },
        { label: 'Overdue', value: 'Overdue' },
      ],
    },
    {
      name: 'assignedWorker',
      type: 'relationship',
      relationTo: 'users',
      label: 'Assigned Worker',
      required: false,
      admin: {
        description: 'User with role WORKER',
      },
      filterOptions: {
        role: { equals: 'WORKER' },
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      required: false,
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        if ((operation === 'create' || operation === 'update') && data.user) {
          const userDoc = await req.payload.findByID({ collection: 'users', id: data.user })
          if (userDoc?.role !== 'CLIENT') throw new Error('Linked user must have role CLIENT')
        }
        if (operation === 'create' && !data.clientId) {
          data.clientId = generateClientCode()
        }
        return data
      },
    ],
  },
}

export default Clients
