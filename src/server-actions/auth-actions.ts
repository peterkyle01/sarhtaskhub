'use server'

import { getPayload } from 'payload'
import { cookies } from 'next/headers'
import config from '@payload-config'
import type { Config } from '@/payload-types'

interface LoginResult {
  success: boolean
  user?: {
    id: number
    email: string
    role?: string
  }
  error: string
}

export async function login(email: string, password: string): Promise<LoginResult> {
  try {
    const payload = await getPayload({ config })

    // Try to authenticate with admins collection first
    try {
      const adminAuth = await payload.login({
        collection: 'admins',
        data: { email, password },
      })

      if (adminAuth.user) {
        return {
          success: true,
          user: {
            id: adminAuth.user.id,
            email: adminAuth.user.email,
            role: 'admin',
          },
          error: '',
        }
      }
    } catch (_adminError) {
      // Continue to try tutors if admin login fails
    }

    // Try to authenticate with tutors collection
    try {
      const tutorAuth = await payload.login({
        collection: 'tutors',
        data: { email, password },
      })

      if (tutorAuth.user) {
        return {
          success: true,
          user: {
            id: tutorAuth.user.id,
            email: tutorAuth.user.email,
            role: 'tutor',
          },
          error: '',
        }
      }
    } catch (_tutorError) {
      // Continue to try superadmins if tutor login fails
    }

    // Try to authenticate with superadmins collection
    try {
      const superAdminAuth = await payload.login({
        collection: 'superadmins',
        data: { email, password },
      })

      if (superAdminAuth.user) {
        return {
          success: true,
          user: {
            id: superAdminAuth.user.id,
            email: superAdminAuth.user.email,
            role: 'admin', // Treat superadmin as admin for routing purposes
          },
          error: '',
        }
      }
    } catch (_superAdminError) {
      // All authentication attempts failed
    }

    return {
      success: false,
      error: 'Invalid email or password. Please check your credentials and try again.',
    }
  } catch (error) {
    console.error('Login error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again later.',
    }
  }
}

export async function getCurrentUser(): Promise<Config['user'] | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('payload-token')?.value

    if (!token) {
      return null
    }

    const payload = await getPayload({ config })

    // Try to decode the JWT token to get user ID
    const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
    const userId = decoded.id || decoded.user?.id || decoded.sub

    if (!userId) {
      return null
    }

    // Try to get user from admins collection first
    try {
      const admin = await payload.findByID({
        collection: 'admins',
        id: userId,
      })

      if (admin) {
        return {
          ...admin,
          collection: 'admins' as const,
        }
      }
    } catch (_adminError) {
      // Continue to try tutors if admin lookup fails
    }

    // Try to get user from tutors collection
    try {
      const tutor = await payload.findByID({
        collection: 'tutors',
        id: userId,
      })

      if (tutor) {
        return {
          ...tutor,
          collection: 'tutors' as const,
        }
      }
    } catch (_tutorError) {
      // Continue to try superadmins if tutor lookup fails
    }

    // Try to get user from superadmins collection
    try {
      const superAdmin = await payload.findByID({
        collection: 'superadmins',
        id: userId,
      })

      if (superAdmin) {
        return {
          ...superAdmin,
          collection: 'superadmins' as const,
        }
      }
    } catch (_superAdminError) {
      // All lookups failed
    }

    return null
  } catch (error) {
    console.error('Failed to get current user:', error)
    return null
  }
}

export async function logout(): Promise<{ success: boolean }> {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('payload-token')
    return { success: true }
  } catch (error) {
    console.error('Logout failed:', error)
    return { success: false }
  }
}
