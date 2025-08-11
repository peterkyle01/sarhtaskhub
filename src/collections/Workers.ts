import type { CollectionConfig } from 'payload'

// Workers collection capturing core worker data & performance metrics.
// Password hashing handled automatically by Payload when auth: true.

function generateWorkerCode(): string {
  return 'WK' + Date.now().toString().slice(-6)
}

export const Workers: CollectionConfig = {
  slug: 'workers',
  auth: {
    tokenExpiration: 60 * 60 * 24 * 7, // 7 days
  },
  admin: {
    useAsTitle: 'fullName',
    defaultColumns: ['workerId', 'fullName', 'email', 'tasksAssigned', 'performance.overallScore'],
  },
  access: {
    read: () => true, // refine later
    create: ({ req: { user } }) => {
      if (!user) return false
      if ('role' in user) return user.role === 'ADMIN'
      return false
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      if ('role' in user) return user.role === 'ADMIN'
      return false
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      if ('role' in user) return user.role === 'ADMIN'
      return false
    },
  },
  fields: [
    {
      name: 'workerId',
      type: 'text',
      label: 'Worker ID',
      unique: true,
      index: true,
      required: false,
      admin: {
        readOnly: true,
        description: 'Auto-generated (e.g., WK123456)',
      },
    },
    {
      name: 'fullName',
      label: 'Full Name',
      type: 'text',
      required: true,
    },
    // email & password handled by auth; email field auto-added by Payload when auth true unless we explicitly define
    {
      name: 'tasksAssigned',
      label: 'Tasks Assigned',
      type: 'relationship',
      relationTo: 'clients', // placeholder until a tasks collection is added
      hasMany: true,
      required: false,
    },
    {
      name: 'performance',
      type: 'group',
      label: 'Performance Metrics',
      fields: [
        {
          name: 'overallScore',
          type: 'number',
          label: 'Overall Score',
          min: 0,
          max: 100,
          defaultValue: 0,
        },
        {
          name: 'tasksCompleted',
          type: 'number',
          label: 'Tasks Completed',
          defaultValue: 0,
        },
        {
          name: 'averageCompletionTime',
          type: 'number',
          label: 'Avg Completion Time (hrs)',
          defaultValue: 0,
        },
        {
          name: 'lastEvaluation',
          type: 'date',
          label: 'Last Evaluation Date',
        },
        {
          name: 'notes',
          type: 'textarea',
          label: 'Performance Notes',
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation }) => {
        if (operation === 'create') {
          if (!data.workerId) data.workerId = generateWorkerCode()
        }
        return data
      },
    ],
  },
}

export default Workers
