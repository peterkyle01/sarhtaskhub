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
