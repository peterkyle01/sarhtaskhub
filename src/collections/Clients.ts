import type { CollectionConfig } from 'payload'

// Utility to generate sequential-like IDs (e.g., CL001) - simplistic, consider a dedicated sequence in production
function generateClientCode(): string {
  // CL + current timestamp base36 slice for uniqueness; could be replaced by a DB backed sequence
  return 'CL' + Date.now().toString().slice(-5)
}

export const Clients: CollectionConfig = {
  slug: 'clients',
  admin: {
    useAsTitle: 'name',
    defaultColumns: [
      'clientId',
      'name',
      'platform',
      'courseName',
      'deadline',
      'progress',
      'assignedWorker',
    ],
  },
  access: {
    read: () => true, // refine later
    create: ({ req: { user } }) =>
      Boolean(user && (user.role === 'ADMIN' || user.role === 'WORKER')),
    update: ({ req: { user } }) =>
      Boolean(user && (user.role === 'ADMIN' || user.role === 'WORKER')),
    delete: ({ req: { user } }) => Boolean(user && user.role === 'ADMIN'),
  },
  fields: [
    {
      name: 'clientId',
      type: 'text',
      label: 'Client ID',
      unique: true,
      index: true,
      admin: {
        description: 'Auto-generated if left blank (e.g., CL12345)',
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
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
      async ({ data, operation }) => {
        if (operation === 'create') {
          if (!data.clientId) {
            data.clientId = generateClientCode()
          }
        }
        return data
      },
    ],
  },
}

export default Clients
