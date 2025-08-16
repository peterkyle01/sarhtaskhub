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
      'tutor',
      'dueDate',
      'score',
    ],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => {
      if (!user) return false
      const u = user as User
      return u.role === 'ADMIN' || u.role === 'TUTOR'
    },
    update: ({ req: { user } }) => {
      if (!user) return false
      const u = user as User
      return u.role === 'ADMIN' || u.role === 'TUTOR'
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
      name: 'tutor',
      label: 'Tutor',
      type: 'relationship',
      relationTo: 'users',
      required: false,
      admin: {
        description: 'Assigned tutor (user with role TUTOR)',
      },
      filterOptions: {
        role: { equals: 'TUTOR' },
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
    afterChange: [
      async ({ doc, previousDoc, operation, req }) => {
        try {
          const actorId =
            req.user && 'id' in req.user ? (req.user as unknown as { id: number }).id : undefined
          type LogType =
            | 'task_created'
            | 'task_updated'
            | 'task_assigned'
            | 'task_completed'
            | 'client_onboarded'
            | 'tutor_added'
            | 'tutor_edited'
          const base: {
            collection: 'activity-logs'
            data: {
              type: LogType
              title: string
              description: string
              actor?: number
              task: number
              metadata: Record<string, unknown>
            }
          } = {
            collection: 'activity-logs',
            data: {
              type: operation === 'create' ? 'task_created' : 'task_updated',
              title:
                operation === 'create'
                  ? `Task Created (${doc.taskId || doc.id})`
                  : `Task Updated (${doc.taskId || doc.id})`,
              description:
                operation === 'create'
                  ? `New task ${doc.taskId || doc.id} created.`
                  : `Task ${doc.taskId || doc.id} updated.`,
              actor: actorId,
              task: doc.id,
              metadata: {},
            },
          }
          // Detect assignment change
          if (operation === 'update' && previousDoc) {
            if (previousDoc.tutor !== doc.tutor) {
              base.data.type = 'task_assigned'
              base.data.title = `Task Assigned (${doc.taskId || doc.id})`
              base.data.description = `Task ${doc.taskId || doc.id} assigned to tutor #${doc.tutor}`
              base.data.metadata.tutorId = doc.tutor as unknown as number
            } else if (previousDoc.status !== doc.status && doc.status === 'Completed') {
              base.data.type = 'task_completed'
              base.data.title = `Task Completed (${doc.taskId || doc.id})`
              base.data.description = `Task ${doc.taskId || doc.id} marked completed.`
            }
          }
          await req.payload.create(base)
        } catch (e) {
          req.payload.logger.error('Failed to log task activity', e)
        }
      },
    ],
  },
}

export default Tasks
