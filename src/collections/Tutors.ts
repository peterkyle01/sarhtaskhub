import type { CollectionConfig } from 'payload'

// Tutors profile extension: extra fields for users with role TUTOR.
// Link back to base user via required relationship.
export const Tutors: CollectionConfig = {
  slug: 'tutors',
  admin: {
    useAsTitle: 'user',
    defaultColumns: ['user', 'performance.overallScore'],
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
        description: 'Base user record (must have role TUTOR).',
      },
      filterOptions: {
        role: { equals: 'TUTOR' },
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
      required: false,
      fields: [
        {
          name: 'overallScore',
          type: 'number',
          min: 0,
          max: 100,
          defaultValue: 0,
          required: false,
        },
        { name: 'tasksCompleted', type: 'number', defaultValue: 0, required: false },
        { name: 'averageCompletionTime', type: 'number', defaultValue: 0, required: false },
        { name: 'lastEvaluation', type: 'date', required: false },
        { name: 'notes', type: 'textarea', required: false },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        if ((operation === 'create' || operation === 'update') && data.user) {
          try {
            // Ensure linked user has role TUTOR
            const userDoc = await req.payload.findByID({
              collection: 'users',
              id: data.user,
              overrideAccess: true, // Add this to bypass access controls during sync
            })
            if (userDoc?.role !== 'TUTOR') {
              req.payload.logger.warn(
                `Tutor profile creation attempted for user ${data.user} with role ${userDoc?.role}`,
              )
              throw new Error('Linked user must have role TUTOR')
            }
          } catch (error) {
            // If the user is not found, it might be a timing issue during user creation
            // Log the error but allow the operation to continue if it's being created with overrideAccess
            if (error instanceof Error && error.message.includes('Not Found')) {
              req.payload.logger.warn(
                `User ${data.user} not found during tutor profile creation - this may be a timing issue`,
              )
              // Only throw if this is not an automated sync operation
              if (!req.context?.skipUserValidation) {
                throw error
              }
            } else {
              throw error
            }
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
              type: operation === 'create' ? 'tutor_added' : 'tutor_edited',
              title:
                operation === 'create' ? `Tutor Added (${doc.id})` : `Tutor Updated (${doc.id})`,
              description:
                operation === 'create'
                  ? `New tutor profile ${doc.id} created.`
                  : `Tutor profile ${doc.id} updated.`,
              actor: actorId,
              tutor: doc.id,
              metadata: {},
            },
          })
        } catch (e) {
          req.payload.logger.error('Failed to log tutor activity', e)
        }
      },
    ],
  },
}
