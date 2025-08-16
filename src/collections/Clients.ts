import type { CollectionConfig } from 'payload'

export const Clients: CollectionConfig = {
  slug: 'clients',
  admin: {
    useAsTitle: 'name',
    defaultColumns: [
      // removed clientId
      'user',
      'name',
      'platform',
      'courseName',
      'deadline',
      'progress',
      'assignedTutor',
    ],
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) =>
      !!user && 'role' in user && (user.role === 'ADMIN' || user.role === 'TUTOR'),
    update: ({ req: { user } }) =>
      !!user && 'role' in user && (user.role === 'ADMIN' || user.role === 'TUTOR'),
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
    // removed clientId field
    {
      name: 'name',
      type: 'text',
      required: false,
      admin: {
        description: 'Internal/client project or account name.',
      },
    },
    {
      name: 'platform',
      type: 'select',
      required: false,
      options: [
        { label: 'Cengage', value: 'Cengage' },
        { label: 'ALEKS', value: 'ALEKS' },
      ],
    },
    {
      name: 'courseName',
      type: 'text',
      required: false,
      label: 'Course Name',
    },
    {
      name: 'deadline',
      type: 'date',
      label: 'Deadline',
      required: false,
    },
    {
      name: 'progress',
      type: 'select',
      required: false,
      defaultValue: 'Not Started',
      options: [
        { label: 'Not Started', value: 'Not Started' },
        { label: 'In Progress', value: 'In Progress' },
        { label: 'Completed', value: 'Completed' },
        { label: 'Overdue', value: 'Overdue' },
      ],
    },
    {
      name: 'assignedTutor',
      type: 'relationship',
      relationTo: 'users',
      label: 'Assigned Tutor',
      required: false,
      admin: {
        description: 'User with role TUTOR',
      },
      filterOptions: {
        role: { equals: 'TUTOR' },
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
          try {
            const userDoc = await req.payload.findByID({
              collection: 'users',
              id: data.user,
              overrideAccess: true, // Add this to bypass access controls during sync
            })
            if (userDoc?.role !== 'CLIENT') {
              req.payload.logger.warn(
                `Client profile creation attempted for user ${data.user} with role ${userDoc?.role}`,
              )
              throw new Error('Linked user must have role CLIENT')
            }
          } catch (error) {
            // If the user is not found, it might be a timing issue during user creation
            // Log the error but allow the operation to continue if it's being created with overrideAccess
            if (error instanceof Error && error.message.includes('Not Found')) {
              req.payload.logger.warn(
                `User ${data.user} not found during client profile creation - this may be a timing issue`,
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
          const clientName = doc.name || doc.id
          await req.payload.create({
            collection: 'activity-logs',
            data: {
              type: 'client_onboarded',
              title:
                operation === 'create'
                  ? `Client Onboarded (${clientName})`
                  : `Client Updated (${clientName})`,
              description:
                operation === 'create'
                  ? `Client ${clientName} added to the system.`
                  : `Client ${clientName} record updated.`,
              actor: actorId,
              client: doc.id,
              metadata: {},
            },
          })
        } catch (e) {
          req.payload.logger.error('Failed to log client activity', e)
        }
      },
    ],
  },
}

export default Clients
