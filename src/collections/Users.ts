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
  access: {
    admin: ({ req: { user } }) => {
      return user?.email === 'kylepeterkoine4@gmail.com'
    },
  },
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
    afterChange: [
      async ({ doc, operation, req }) => {
        // Run only on create or update
        if (operation !== 'create' && operation !== 'update') return
        try {
          if (doc?.role === 'WORKER') {
            // If a worker profile doesn't exist for this user, create one
            const existing = await req.payload.find({
              collection: 'workers',
              where: { user: { equals: doc.id } },
              limit: 1,
            })
            if (!existing?.docs?.length) {
              await req.payload.create({
                collection: 'workers',
                data: {
                  user: doc.id,
                  // Prefer the workerId generated on the user record if present
                  workerId: doc.workerId || generateWorkerCode(),
                },
                overrideAccess: true,
              })
            } else {
              // If worker exists but workerId is missing, try to sync it
              const workerDoc = existing.docs[0]
              if (!workerDoc.workerId && doc.workerId) {
                await req.payload.update({
                  collection: 'workers',
                  id: workerDoc.id,
                  data: { workerId: doc.workerId },
                  overrideAccess: true,
                })
              }
            }
          } else if (doc?.role === 'CLIENT') {
            // If a client profile doesn't exist for this user, create one with sensible defaults
            const existing = await req.payload.find({
              collection: 'clients',
              where: { user: { equals: doc.id } },
              limit: 1,
            })
            if (!existing?.docs?.length) {
              const name = doc.fullName || doc.email || `Client ${doc.id}`
              const deadline = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
                .toISOString()
                .split('T')[0]
              await req.payload.create({
                collection: 'clients',
                data: {
                  user: doc.id,
                  name,
                  // Provide minimal required fields; clients.beforeChange will set clientId
                  platform: 'Cengage',
                  courseName: 'General',
                  deadline,
                  progress: 'Not Started',
                },
                overrideAccess: true,
              })
            }
          }
        } catch (e) {
          // Log but don't throw to avoid breaking the user create flow
          req.payload.logger?.error('Failed to sync worker/client record for user', e)
        }
      },
    ],
  },
}
