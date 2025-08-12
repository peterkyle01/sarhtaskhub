import type { CollectionConfig } from 'payload'

// Workers profile extension: extra fields for users with role WORKER.
// Link back to base user via required relationship.
export const Workers: CollectionConfig = {
  slug: 'workers',
  admin: {
    useAsTitle: 'user',
    defaultColumns: ['user', 'workerId', 'performance.overallScore'],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => !!user && 'role' in user && user.role === 'ADMIN',
    update: ({ req: { user } }) => !!user && 'role' in user && user.role === 'ADMIN',
    delete: ({ req: { user } }) => !!user && 'role' in user && user.role === 'ADMIN',
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      unique: true,
      admin: {
        description: 'Base user record (must have role WORKER).',
      },
      filterOptions: {
        role: { equals: 'WORKER' },
      },
    },
    {
      name: 'workerId',
      type: 'text',
      // Display Tutor ID label while keeping backend field name workerId
      label: 'Tutor ID',
      unique: true,
      index: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'tasksAssigned',
      label: 'Tasks Assigned',
      type: 'relationship',
      relationTo: 'clients',
      hasMany: true,
      required: false,
    },
    {
      name: 'performance',
      type: 'group',
      label: 'Performance Metrics',
      fields: [
        { name: 'overallScore', type: 'number', min: 0, max: 100, defaultValue: 0 },
        { name: 'tasksCompleted', type: 'number', defaultValue: 0 },
        { name: 'averageCompletionTime', type: 'number', defaultValue: 0 },
        { name: 'lastEvaluation', type: 'date' },
        { name: 'notes', type: 'textarea' },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        if ((operation === 'create' || operation === 'update') && data.user) {
          // Ensure linked user has role WORKER
          const userDoc = await req.payload.findByID({ collection: 'users', id: data.user })
          if (userDoc?.role !== 'WORKER') throw new Error('Linked user must have role WORKER')
          if (!data.workerId) {
            data.workerId = 'WK' + Date.now().toString().slice(-6)
          }
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, operation, req }) => {
        try {
          const actorId =
            req.user && 'id' in req.user ? (req.user as unknown as { id: number }).id : undefined
          await req.payload.create({
            collection: 'activity-logs',
            data: {
              type: operation === 'create' ? 'worker_added' : 'worker_edited',
              title:
                operation === 'create'
                  ? `Tutor Added (${doc.workerId || doc.id})`
                  : `Tutor Updated (${doc.workerId || doc.id})`,
              description:
                operation === 'create'
                  ? `New tutor profile ${doc.workerId || doc.id} created.`
                  : `Tutor profile ${doc.workerId || doc.id} updated.`,
              actor: actorId,
              worker: doc.id,
              metadata: {},
            },
          })
        } catch (e) {
          req.payload.logger.error('Failed to log worker activity', e)
        }
      },
    ],
  },
}
export default Workers
