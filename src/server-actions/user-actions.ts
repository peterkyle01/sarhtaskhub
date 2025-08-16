'use server'

import { cookies } from 'next/headers'
import { getPayload, type GeneratedTypes } from 'payload'
import payloadConfig from '../payload.config'
import { revalidatePath } from 'next/cache'

const COOKIE_NAME = 'payload-token'

export interface AuthResult {
  user?: GeneratedTypes['user']
  error?: string
}

export interface CreateUserData {
  email: string
  password: string
  fullName: string
  role: 'ADMIN' | 'TUTOR' | 'CLIENT'
  phone: string
}

export interface CreateUserResult {
  user?: GeneratedTypes['user']
  error?: string
  success?: boolean
}

export async function login(email: string, password: string): Promise<AuthResult> {
  if (!email || !password) return { error: 'Email and password are required' }
  try {
    const payload = await getPayload({ config: payloadConfig })
    const result = (await payload.login({
      collection: 'users',
      data: { email, password },
    })) as unknown as { token?: string; user?: GeneratedTypes['user'] }

    if (!result?.token) return { error: 'Invalid login response' }

    const secure = process.env.NODE_ENV === 'production'
    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAME, result.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      path: '/',
    })

    return { user: result.user }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Login failed'
    return { error: message }
  }
}

export async function logout(): Promise<{ success: boolean }> {
  try {
    const cookieStore = await cookies()
    cookieStore.delete(COOKIE_NAME)
    return { success: true }
  } catch {
    return { success: false }
  }
}

export async function getCurrentUser(): Promise<GeneratedTypes['user'] | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (!token) return null

    const payload = await getPayload({ config: payloadConfig })

    // Try to decode the JWT token to get user ID
    const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
    const userId = decoded.id || decoded.user?.id || decoded.sub

    if (!userId) return null

    // Fetch the user by ID
    const user = await payload.findByID({
      collection: 'users',
      id: userId,
    })

    return (user as GeneratedTypes['user']) || null
  } catch (error) {
    console.error('Failed to get current user:', error)
    return null
  }
}

export async function getAllUsers(): Promise<GeneratedTypes['user'][]> {
  try {
    const payload = await getPayload({ config: payloadConfig })

    const result = await payload.find({
      collection: 'users',
      limit: 1000, // Adjust as needed
      sort: '-createdAt',
    })

    return result.docs as GeneratedTypes['user'][]
  } catch (error) {
    console.error('Failed to fetch users:', error)
    return []
  }
}

export async function createUser(userData: CreateUserData): Promise<CreateUserResult> {
  try {
    const payload = await getPayload({ config: payloadConfig })

    const newUser = await payload.create({
      collection: 'users',
      data: {
        email: userData.email,
        password: userData.password,
        fullName: userData.fullName,
        phone: userData.phone,
        role: userData.role,
      },
    })

    revalidatePath('/admin-dashboard/users')

    return {
      user: newUser as GeneratedTypes['user'],
      success: true,
    }
  } catch (error: unknown) {
    console.error('Failed to create user:', error)
    const message = error instanceof Error ? error.message : 'Failed to create user'
    return { error: message, success: false }
  }
}

export async function updateUserRole(
  userId: number,
  role: 'ADMIN' | 'TUTOR' | 'CLIENT',
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = await getPayload({ config: payloadConfig })

    await payload.update({
      collection: 'users',
      id: userId,
      data: { role },
    })

    revalidatePath('/admin-dashboard/users')

    return { success: true }
  } catch (error: unknown) {
    console.error('Failed to update user role:', error)
    const message = error instanceof Error ? error.message : 'Failed to update user role'
    return { success: false, error: message }
  }
}

export async function resetUserPassword(
  userId: number,
  newPassword: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = await getPayload({ config: payloadConfig })

    await payload.update({
      collection: 'users',
      id: userId,
      data: { password: newPassword },
    })

    revalidatePath('/admin-dashboard/users')

    return { success: true }
  } catch (error: unknown) {
    console.error('Failed to reset password:', error)
    const message = error instanceof Error ? error.message : 'Failed to reset password'
    return { success: false, error: message }
  }
}

export async function sendUserEmail(
  to: string,
  subject: string,
  message: string,
  userName: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    // For now, we'll just log the email (implement actual email sending later)
    console.log('Email sent to:', to)
    console.log('Subject:', subject)
    console.log('Message:', message)
    console.log('User Name:', userName)

    // In a real implementation, you would use a service like:
    // - Nodemailer
    // - SendGrid
    // - AWS SES
    // - Resend

    return { success: true }
  } catch (error: unknown) {
    console.error('Failed to send email:', error)
    const message = error instanceof Error ? error.message : 'Failed to send email'
    return { success: false, error: message }
  }
}

export async function sendWelcomeEmailAction(formData: FormData): Promise<void> {
  const email = formData.get('email') as string | null
  const name = formData.get('name') as string | null
  if (!email || !name) return
  await sendUserEmail(email, 'Welcome to Sarh Task Hub', 'Welcome to our platform!', name)
}

function generateTempPassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*'
  let pwd = ''
  for (let i = 0; i < length; i++) pwd += chars[Math.floor(Math.random() * chars.length)]
  return pwd
}

export async function resetPasswordAction(formData: FormData): Promise<void> {
  const userIdRaw = formData.get('userId') as string | null
  if (!userIdRaw) return
  const userId = parseInt(userIdRaw, 10)
  if (Number.isNaN(userId)) return
  const tempPassword = generateTempPassword()
  const result = await resetUserPassword(userId, tempPassword)
  if (result.success) {
    console.log(`Temporary password for user ${userId}: ${tempPassword}`)
  }
}

export async function updateUserDetails(
  userId: number,
  data: { fullName?: string; phone?: string; role?: 'ADMIN' | 'TUTOR' | 'CLIENT' },
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = await getPayload({ config: payloadConfig })
    await payload.update({
      collection: 'users',
      id: userId,
      data: {
        ...(data.fullName ? { fullName: data.fullName } : {}),
        ...(data.phone ? { phone: data.phone } : {}),
        ...(data.role ? { role: data.role } : {}),
      },
    })
    revalidatePath('/admin-dashboard/users')
    return { success: true }
  } catch (e: unknown) {
    console.error('Failed to update user details:', e)
    return { success: false, error: e instanceof Error ? e.message : 'Failed to update user' }
  }
}

export async function setUserPassword(
  userId: number,
  password: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = await getPayload({ config: payloadConfig })
    await payload.update({
      collection: 'users',
      id: userId,
      data: { password },
    })
    revalidatePath('/admin-dashboard/users')
    return { success: true }
  } catch (e: unknown) {
    console.error('Failed to set user password:', e)
    return { success: false, error: e instanceof Error ? e.message : 'Failed to set password' }
  }
}

export async function updateUserDetailsAction(formData: FormData): Promise<void> {
  const idRaw = formData.get('userId') as string | null
  if (!idRaw) return
  const userId = parseInt(idRaw, 10)
  if (Number.isNaN(userId)) return
  const fullName = (formData.get('fullName') as string | null) || undefined
  const phone = (formData.get('phone') as string | null) || undefined
  const roleRaw = (formData.get('role') as string | null) || undefined
  const role = roleRaw as 'ADMIN' | 'TUTOR' | 'CLIENT' | undefined
  await updateUserDetails(userId, { fullName, phone, role })
}

export async function setUserPasswordAction(formData: FormData): Promise<void> {
  const idRaw = formData.get('userId') as string | null
  const password = formData.get('password') as string | null
  if (!idRaw || !password) return
  const userId = parseInt(idRaw, 10)
  if (Number.isNaN(userId)) return
  await setUserPassword(userId, password)
}

export async function deleteUser(userId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = await getPayload({ config: payloadConfig })

    // Remove related tutor or client profiles first to avoid orphaned records
    try {
      const tutor = await payload.find({
        collection: 'tutors',
        where: { user: { equals: userId } },
        limit: 1,
      })
      if (tutor?.docs?.length) {
        await payload.delete({ collection: 'tutors', id: tutor.docs[0].id, overrideAccess: true })
      }
    } catch (e) {
      // ignore tutor deletion failure, continue
      console.error('Failed to delete linked tutor profile:', e)
    }

    try {
      const client = await payload.find({
        collection: 'clients',
        where: { user: { equals: userId } },
        limit: 1,
      })
      if (client?.docs?.length) {
        await payload.delete({ collection: 'clients', id: client.docs[0].id, overrideAccess: true })
      }
    } catch (e) {
      console.error('Failed to delete linked client profile:', e)
    }

    await payload.delete({ collection: 'users', id: userId, overrideAccess: true })

    revalidatePath('/admin-dashboard/users')
    return { success: true }
  } catch (e: unknown) {
    console.error('Failed to delete user:', e)
    return { success: false, error: e instanceof Error ? e.message : 'Failed to delete user' }
  }
}

export async function deleteUserAction(formData: FormData): Promise<void> {
  const idRaw = formData.get('userId') as string | null
  if (!idRaw) return
  const userId = parseInt(idRaw, 10)
  if (Number.isNaN(userId)) return
  await deleteUser(userId)
}
