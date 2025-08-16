import type { CollectionConfig } from 'payload'

// Base Users collection: all actors (ADMIN, TUTOR, CLIENT)

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
    create: ({ req: { user } }) => {
      // Allow admins to create users
      return user?.role === 'ADMIN'
    },
    read: ({ req: { user } }) => {
      // Allow admins to read all users, others can only read their own profile
      if (user?.role === 'ADMIN') return true
      return {
        id: {
          equals: user?.id,
        },
      }
    },
    update: ({ req: { user } }) => {
      // Allow admins to update any user, others can only update their own profile
      if (user?.role === 'ADMIN') return true
      return {
        id: {
          equals: user?.id,
        },
      }
    },
    delete: ({ req: { user } }) => {
      // Only allow admins to delete users
      return user?.role === 'ADMIN'
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
      defaultValue: 'TUTOR',
      options: [
        { label: 'Admin', value: 'ADMIN' },
        { label: 'Tutor', value: 'TUTOR' },
        { label: 'Client', value: 'CLIENT' },
      ],
      admin: {
        description: 'Determines access level within the system.',
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
      async ({ data }) => {
        // No special logic needed for tutorId generation
        return data
      },
    ],
    afterChange: [
      async ({ doc, operation, req }) => {
        // Run only on create or update
        if (operation !== 'create' && operation !== 'update') return

        // Add more detailed logging for debugging
        req.payload.logger?.info(
          `User sync hook - Operation: ${operation}, User ID: ${doc.id}, Role: ${doc?.role}`,
        )

        // Helper function to wait for user to be available with retry logic
        const waitForUserAndCreateProfile = async (
          userId: number,
          role: 'TUTOR' | 'CLIENT',
          maxRetries = 10,
          baseDelay = 50,
        ) => {
          for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
              // First, verify the user exists and is accessible
              const userExists = await req.payload.findByID({
                collection: 'users',
                id: userId,
                overrideAccess: true,
              })

              if (!userExists) {
                throw new Error(`User ${userId} not found`)
              }

              req.payload.logger?.info(`User ${userId} confirmed available on attempt ${attempt}`)

              if (role === 'TUTOR') {
                // Check if tutor profile already exists
                const existing = await req.payload.find({
                  collection: 'tutors',
                  where: { user: { equals: userId } },
                  limit: 1,
                  overrideAccess: true,
                })

                if (!existing?.docs?.length) {
                  req.payload.logger?.info(`Creating tutor profile for user ${userId}`)
                  await req.payload.create({
                    collection: 'tutors',
                    data: { user: userId },
                    overrideAccess: true,
                    context: { skipUserValidation: true },
                  })
                  req.payload.logger?.info(`Successfully created tutor profile for user ${userId}`)
                } else {
                  req.payload.logger?.info(`Tutor profile already exists for user ${userId}`)
                }
              } else if (role === 'CLIENT') {
                // Check if client profile already exists
                const existing = await req.payload.find({
                  collection: 'clients',
                  where: { user: { equals: userId } },
                  limit: 1,
                  overrideAccess: true,
                })

                if (!existing?.docs?.length) {
                  const name = doc.fullName || doc.email || `Client ${userId}`
                  const deadline = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
                    .toISOString()
                    .split('T')[0]
                  req.payload.logger?.info(`Creating client profile for user ${userId}`)
                  await req.payload.create({
                    collection: 'clients',
                    data: {
                      user: userId,
                      name,
                      platform: 'Cengage',
                      courseName: 'General',
                      deadline,
                      progress: 'Not Started',
                    },
                    overrideAccess: true,
                    context: { skipUserValidation: true },
                  })
                  req.payload.logger?.info(`Successfully created client profile for user ${userId}`)
                } else {
                  req.payload.logger?.info(`Client profile already exists for user ${userId}`)
                }
              }

              // If we get here, the operation was successful
              return
            } catch (error) {
              const isLastAttempt = attempt === maxRetries
              const delay = baseDelay * Math.pow(2, attempt - 1) // Exponential backoff

              if (isLastAttempt) {
                // On final attempt, log the error and give up
                const errorMsg =
                  error instanceof Error ? `${error.name}: ${error.message}` : String(error)
                req.payload.logger?.error(
                  `Failed to sync ${role.toLowerCase()} profile for user ${userId} after ${maxRetries} attempts: ${errorMsg}`,
                )
                return
              }

              // Log the retry attempt
              req.payload.logger?.warn(
                `Attempt ${attempt}/${maxRetries} failed for user ${userId} ${role.toLowerCase()} profile creation. Retrying in ${delay}ms...`,
              )

              // Wait before retrying
              await new Promise((resolve) => setTimeout(resolve, delay))
            }
          }
        }

        // Run profile creation asynchronously without blocking the main operation
        if (doc?.role === 'TUTOR' || doc?.role === 'CLIENT') {
          // Don't await this - let it run in the background
          waitForUserAndCreateProfile(doc.id, doc.role as 'TUTOR' | 'CLIENT').catch((e) => {
            req.payload.logger?.error(`Background profile creation failed for user ${doc.id}:`, e)
          })
        }
      },
    ],
  },
}
