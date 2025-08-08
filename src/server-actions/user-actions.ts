'use server'

import { cookies } from 'next/headers'
import { getPayload, type GeneratedTypes } from 'payload'
import payloadConfig from '../payload.config'

const COOKIE_NAME = 'payload-token'

export interface AuthResult {
  user?: GeneratedTypes['user']
  error?: string
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
