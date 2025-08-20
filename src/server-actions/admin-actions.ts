'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { Admin, Superadmin } from '@/payload-types'

export type AdminDoc = Admin | Superadmin

export async function getCurrentAdminProfile(): Promise<AdminDoc | null> {
  try {
    const { getCurrentUser } = await import('./auth-actions')
    const user = await getCurrentUser()

    if (!user || (user.collection !== 'admins' && user.collection !== 'superadmins')) {
      return null
    }

    const payload = await getPayload({ config })

    const admin = await payload.findByID({
      collection: user.collection,
      id: user.id,
      depth: 2,
    })

    return admin as AdminDoc
  } catch (error) {
    console.error('Error getting current admin profile:', error)
    return null
  }
}

export async function updateCurrentAdminProfile(data: {
  fullName?: string
  phone?: string
  profilePicture?: number
}): Promise<AdminDoc | null> {
  try {
    const { getCurrentUser } = await import('./auth-actions')
    const user = await getCurrentUser()

    if (!user || (user.collection !== 'admins' && user.collection !== 'superadmins')) {
      throw new Error('ADMIN_ACCESS_REQUIRED')
    }

    // SuperAdmins don't have these fields, so only update if it's an admin
    if (user.collection === 'superadmins') {
      throw new Error('SuperAdmins cannot update profile fields')
    }

    const payload = await getPayload({ config })

    const result = await payload.update({
      collection: user.collection,
      id: user.id,
      data,
    })

    return result as AdminDoc
  } catch (error) {
    console.error('Error updating admin profile:', error)
    return null
  }
}

export async function updateCurrentAdminPassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { getCurrentUser } = await import('./auth-actions')
    const user = await getCurrentUser()

    if (!user || (user.collection !== 'admins' && user.collection !== 'superadmins')) {
      return { success: false, error: 'ADMIN_ACCESS_REQUIRED' }
    }

    const payload = await getPayload({ config })

    // First verify the current password by attempting a login
    try {
      await payload.login({
        collection: user.collection,
        data: {
          email: user.email,
          password: currentPassword,
        },
      })
    } catch (_error) {
      return { success: false, error: 'Current password is incorrect' }
    }

    // Update the password
    await payload.update({
      collection: user.collection,
      id: user.id,
      data: {
        password: newPassword,
      },
    })

    return { success: true }
  } catch (error) {
    console.error('Error updating admin password:', error)
    return { success: false, error: 'Failed to update password' }
  }
}

export async function uploadAdminProfilePicture(
  formData: FormData,
): Promise<{ success: boolean; mediaId?: number; error?: string }> {
  try {
    const { getCurrentUser } = await import('./auth-actions')
    const user = await getCurrentUser()

    if (!user || (user.collection !== 'admins' && user.collection !== 'superadmins')) {
      return { success: false, error: 'ADMIN_ACCESS_REQUIRED' }
    }

    const payload = await getPayload({ config })
    const file = formData.get('file') as File

    if (!file) {
      return { success: false, error: 'No file provided' }
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.',
      }
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return {
        success: false,
        error: 'File size too large. Please upload an image smaller than 5MB.',
      }
    }

    // Convert File to Buffer for Payload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Create the file object that Payload expects
    const payloadFile = {
      data: buffer,
      mimetype: file.type,
      name: file.name,
      size: file.size,
    }

    // Upload to media collection
    const result = await payload.create({
      collection: 'media',
      data: {
        alt: `${user.email || 'Admin'} profile picture`,
      },
      file: payloadFile,
    })

    return { success: true, mediaId: result.id as number }
  } catch (error) {
    console.error('Error uploading admin profile picture:', error)
    return { success: false, error: 'Failed to upload image' }
  }
}

// Admin management functions
export async function getAllAdmins(): Promise<Admin[]> {
  try {
    const { getCurrentUser } = await import('./auth-actions')
    const user = await getCurrentUser()

    if (!user || (user.collection !== 'admins' && user.collection !== 'superadmins')) {
      throw new Error('ADMIN_ACCESS_REQUIRED')
    }

    const payload = await getPayload({ config })

    const { docs } = await payload.find({
      collection: 'admins',
      depth: 2,
      limit: 1000,
      sort: '-createdAt',
    })

    return docs as Admin[]
  } catch (error) {
    console.error('Error getting all admins:', error)
    return []
  }
}

export async function createAdmin(data: {
  fullName: string
  email: string
  password: string
  phone?: string
}): Promise<{ success: boolean; error?: string; admin?: Admin }> {
  try {
    const { getCurrentUser } = await import('./auth-actions')
    const user = await getCurrentUser()

    if (!user || (user.collection !== 'admins' && user.collection !== 'superadmins')) {
      return { success: false, error: 'ADMIN_ACCESS_REQUIRED' }
    }

    const payload = await getPayload({ config })

    // Check if email already exists
    const existingAdmin = await payload.find({
      collection: 'admins',
      where: {
        email: {
          equals: data.email,
        },
      },
    })

    if (existingAdmin.docs.length > 0) {
      return { success: false, error: 'An admin with this email already exists' }
    }

    const result = await payload.create({
      collection: 'admins',
      data: {
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        phone: data.phone,
        role: 'admin',
      },
    })

    return { success: true, admin: result as Admin }
  } catch (error) {
    console.error('Error creating admin:', error)
    return { success: false, error: 'Failed to create admin' }
  }
}

export async function updateAdmin(
  id: number,
  data: {
    fullName?: string
    email?: string
    phone?: string
  },
): Promise<{ success: boolean; error?: string; admin?: Admin }> {
  try {
    const { getCurrentUser } = await import('./auth-actions')
    const user = await getCurrentUser()

    if (!user || (user.collection !== 'admins' && user.collection !== 'superadmins')) {
      return { success: false, error: 'ADMIN_ACCESS_REQUIRED' }
    }

    const payload = await getPayload({ config })

    // Check if email already exists for another admin
    if (data.email) {
      const existingAdmin = await payload.find({
        collection: 'admins',
        where: {
          and: [
            {
              email: {
                equals: data.email,
              },
            },
            {
              id: {
                not_equals: id,
              },
            },
          ],
        },
      })

      if (existingAdmin.docs.length > 0) {
        return { success: false, error: 'An admin with this email already exists' }
      }
    }

    const result = await payload.update({
      collection: 'admins',
      id,
      data,
    })

    return { success: true, admin: result as Admin }
  } catch (error) {
    console.error('Error updating admin:', error)
    return { success: false, error: 'Failed to update admin' }
  }
}

export async function updateAdminPassword(
  id: number,
  newPassword: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { getCurrentUser } = await import('./auth-actions')
    const user = await getCurrentUser()

    if (!user || (user.collection !== 'admins' && user.collection !== 'superadmins')) {
      return { success: false, error: 'ADMIN_ACCESS_REQUIRED' }
    }

    const payload = await getPayload({ config })

    await payload.update({
      collection: 'admins',
      id,
      data: {
        password: newPassword,
      },
    })

    return { success: true }
  } catch (error) {
    console.error('Error updating admin password:', error)
    return { success: false, error: 'Failed to update password' }
  }
}

export async function deleteAdmin(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const { getCurrentUser } = await import('./auth-actions')
    const user = await getCurrentUser()

    if (!user || (user.collection !== 'admins' && user.collection !== 'superadmins')) {
      return { success: false, error: 'ADMIN_ACCESS_REQUIRED' }
    }

    // Prevent self-deletion
    if (user.id === id) {
      return { success: false, error: 'Cannot delete your own account' }
    }

    const payload = await getPayload({ config })

    await payload.delete({
      collection: 'admins',
      id,
    })

    return { success: true }
  } catch (error) {
    console.error('Error deleting admin:', error)
    return { success: false, error: 'Failed to delete admin' }
  }
}

export async function getAdminStats(): Promise<{
  total: number
  recentlyCreated: number
}> {
  try {
    const { getCurrentUser } = await import('./auth-actions')
    const user = await getCurrentUser()

    if (!user || (user.collection !== 'admins' && user.collection !== 'superadmins')) {
      return { total: 0, recentlyCreated: 0 }
    }

    const payload = await getPayload({ config })

    // Get total count
    const totalResult = await payload.count({
      collection: 'admins',
    })

    // Get recently created (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentResult = await payload.count({
      collection: 'admins',
      where: {
        createdAt: {
          greater_than: thirtyDaysAgo.toISOString(),
        },
      },
    })

    return {
      total: totalResult.totalDocs,
      recentlyCreated: recentResult.totalDocs,
    }
  } catch (error) {
    console.error('Error getting admin stats:', error)
    return { total: 0, recentlyCreated: 0 }
  }
}
