import type { CollectionConfig } from 'payload'
import type { User } from '../payload-types'

function generateTaskCode(): string {
  return 'TK' + Date.now().toString().slice(-6)
}

export const Tasks: CollectionConfig = {
  slug: 'tasks',
  admin: {
    useAsTitle: 'taskId',
    defaultColumns: [
      'taskId',
      'client',
      'platform',
      'taskType',
      'status',
      'worker',
      'dueDate',
      'score',
    ],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => {
      if (!user) return false
      const u = user as User
      return u.role === 'ADMIN' || u.role === 'WORKER'
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      const u = user as User
      return u.role === 'ADMIN' || u.role === 'WORKER'
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      const u = user as User
      return u.role === 'ADMIN'
    },
  },
  fields: [
    {
      name: 'taskId',
      label: 'Task ID',
      type: 'text',
      unique: true,

      index: true,
      admin: {
        readOnly: true,
        description: 'Auto-generated (e.g., TK123456)',
      },
    },
    {
      name: 'client',
      label: 'Client',
      type: 'relationship',
      relationTo: 'clients',
      required: true,
      admin: {
        description: 'Reference to the associated client',
      },
    },
    {
      name: 'platform',
      label: 'Platform',
      type: 'select',
      required: true,
      options: [
        { label: 'Cengage', value: 'Cengage' },
        { label: 'ALEKS', value: 'ALEKS' },
        { label: 'MATLAB', value: 'MATLAB' },
      ],
    },
    {
      name: 'taskType',
      label: 'Task Type',
      type: 'select',
      required: true,
      options: [
        { label: 'Assignment', value: 'Assignment' },
        { label: 'Quiz', value: 'Quiz' },
        { label: 'Course', value: 'Course' },
      ],
    },
    {
      name: 'dueDate',
      label: 'Due Date',
      type: 'date',
      required: true,
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      defaultValue: 'Pending',
      options: [
        { label: 'Pending', value: 'Pending' },
        { label: 'In Progress', value: 'In Progress' },
        { label: 'Completed', value: 'Completed' },
      ],
    },
    {
      name: 'worker',
      label: 'Worker',
      type: 'relationship',
      relationTo: 'users',
      required: false,
      admin: {
        description: 'Assigned worker (user with role WORKER)',
      },
      filterOptions: {
        role: { equals: 'WORKER' },
      },
    },
    {
      name: 'score',
      label: 'Score',
      type: 'number',
      required: false,
      admin: {
        description: 'Score / grade if applicable',
      },
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea',
      required: false,
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation }) => {
        if (operation === 'create') {
          if (!data.taskId) {
            data.taskId = generateTaskCode()
          }
        }
        return data
      },
    ],
  },
}

export default Tasks
