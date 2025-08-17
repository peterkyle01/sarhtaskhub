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
    const cookieStore = await cookies()

    // Clear any existing authentication token first to prevent conflicts
    cookieStore.delete('payload-token')
    console.log('Cleared existing authentication token')

    // Try to authenticate with admins collection first
    try {
      const adminAuth = await payload.login({
        collection: 'admins',
        data: { email, password },
      })

      if (adminAuth.user && adminAuth.token) {
        // Explicitly set the cookie
        cookieStore.set('payload-token', adminAuth.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
        })

        console.log('Admin login successful, token set:', adminAuth.token.substring(0, 20) + '...')

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
      console.log('Admin login failed:', _adminError)
      // Continue to try tutors if admin login fails
    }

    // Try to authenticate with tutors collection
    try {
      const tutorAuth = await payload.login({
        collection: 'tutors',
        data: { email, password },
      })

      if (tutorAuth.user && tutorAuth.token) {
        // Explicitly set the cookie
        cookieStore.set('payload-token', tutorAuth.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
        })

        console.log('Tutor login successful, token set:', tutorAuth.token.substring(0, 20) + '...')

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
      console.log('Tutor login failed:', _tutorError)
      // Continue to try superadmins if tutor login fails
    }

    // Try to authenticate with superadmins collection
    try {
      const superAdminAuth = await payload.login({
        collection: 'superadmins',
        data: { email, password },
      })

      if (superAdminAuth.user && superAdminAuth.token) {
        // Explicitly set the cookie
        cookieStore.set('payload-token', superAdminAuth.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
        })

        console.log(
          'SuperAdmin login successful, token set:',
          superAdminAuth.token.substring(0, 20) + '...',
        )

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
      console.log('SuperAdmin login failed:', _superAdminError)
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

    console.log('=== AUTH DEBUG ===')
    console.log('Token exists:', !!token)
    console.log('Token preview:', token ? `${token.substring(0, 20)}...` : 'No token')

    if (!token) {
      console.log('No token found in cookies')
      return null
    }

    const payload = await getPayload({ config })

    // Try to decode the JWT token to get user ID
    const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
    console.log('Decoded token:', {
      id: decoded.id,
      collection: decoded.collection,
      email: decoded.email,
      exp: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'No expiry',
    })

    const userId = decoded.id || decoded.user?.id || decoded.sub
    const tokenCollection = decoded.collection
    console.log('Extracted user ID:', userId, 'Collection:', tokenCollection)

    if (!userId) {
      console.log('No user ID found in token')
      return null
    }

    // If token contains collection info, try that collection first
    if (tokenCollection) {
      console.log(`Token indicates user belongs to collection: ${tokenCollection}`)
      try {
        const user = await payload.findByID({
          collection: tokenCollection,
          id: userId,
        })

        if (user) {
          console.log(`Found ${tokenCollection} user:`, {
            id: user.id,
            email: user.email,
            fullName: 'fullName' in user ? user.fullName : undefined,
          })
          return {
            ...user,
            collection: tokenCollection as 'admins' | 'tutors' | 'superadmins',
          }
        }
      } catch (error) {
        console.log(`${tokenCollection} lookup failed:`, error)
      }
    }

    // Fallback: Try all collections if token doesn't specify or lookup failed
    // Try to get user from admins collection first
    try {
      const admin = await payload.findByID({
        collection: 'admins',
        id: userId,
      })

      if (admin) {
        console.log('Found admin user:', { id: admin.id, email: admin.email })
        return {
          ...admin,
          collection: 'admins' as const,
        }
      }
    } catch (_adminError) {
      console.log('Admin lookup failed:', _adminError)
      // Continue to try tutors if admin lookup fails
    }

    // Try to get user from tutors collection
    try {
      const tutor = await payload.findByID({
        collection: 'tutors',
        id: userId,
      })

      if (tutor) {
        console.log('Found tutor user:', {
          id: tutor.id,
          email: tutor.email,
          fullName: tutor.fullName,
        })
        return {
          ...tutor,
          collection: 'tutors' as const,
        }
      }
    } catch (_tutorError) {
      console.log('Tutor lookup failed:', _tutorError)
      // Continue to try superadmins if tutor lookup fails
    }

    // Try to get user from superadmins collection
    try {
      const superAdmin = await payload.findByID({
        collection: 'superadmins',
        id: userId,
      })

      if (superAdmin) {
        console.log('Found superadmin user:', { id: superAdmin.id, email: superAdmin.email })
        return {
          ...superAdmin,
          collection: 'superadmins' as const,
        }
      }
    } catch (_superAdminError) {
      console.log('Superadmin lookup failed:', _superAdminError)
      // All lookups failed
    }

    console.log('No user found in any collection')
    return null
  } catch (error) {
    console.error('Failed to get current user:', error)
    return null
  }
}

export async function requireAdmin() {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('AUTHENTICATION_REQUIRED')
  }

  if (user.collection !== 'admins' && user.collection !== 'superadmins') {
    throw new Error('ADMIN_ACCESS_REQUIRED')
  }

  return user
}

export async function requireTutor() {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('AUTHENTICATION_REQUIRED')
  }

  if (user.collection !== 'tutors') {
    throw new Error('TUTOR_ACCESS_REQUIRED')
  }

  return user
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
