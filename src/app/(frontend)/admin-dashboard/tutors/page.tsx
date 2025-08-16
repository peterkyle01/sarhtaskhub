import TutorsClient from './tutors-client'
import { getPayload } from 'payload'
import config from '@payload-config'
import { listTutors } from '@/server-actions/tutors-actions'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

interface BaseTutorUser {
  id: number
  fullName?: string
  email?: string
  createdAt: string
  updatedAt: string
}

export default async function TutorsPage() {
  const payload = await getPayload({ config })

  // All base users that have role TUTOR
  const baseUsersRes = await payload.find({
    collection: 'users',
    where: { role: { equals: 'TUTOR' } },
    limit: 500,
    sort: '-createdAt',
  })

  // Existing tutor profile documents (may be a subset)
  const tutorProfiles = await listTutors()

  // Map existing profiles by their related base user id
  const profileByUserId = new Map<number, (typeof tutorProfiles)[number]>()
  for (const p of tutorProfiles) {
    const userId =
      typeof p.user === 'object' && p.user
        ? p.user.id
        : typeof p.user === 'number'
          ? p.user
          : undefined
    if (userId) profileByUserId.set(userId, p)
  }

  // Combine: every base user becomes a tutor entry (even without a profile)
  const allTutors = (baseUsersRes.docs as BaseTutorUser[]).map((u) => {
    const profile = profileByUserId.get(u.id)
    if (profile) {
      return {
        id: profile.id,
        tutorId: profile.tutorId, // Use the tutorId from the profile (TU{id})
        user: profile.user,
        fullName: profile.fullName || u.fullName || '',
        email: profile.email || u.email || '',
        performance: profile.performance,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      }
    }
    return {
      id: -u.id,
      tutorId: `TU${u.id}`, // For users without profiles, use user ID
      user: u.id,
      fullName: u.fullName || '',
      email: u.email || '',
      performance: undefined,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }
  })

  return (
    <TutorsClient
      // Show every base user with role TUTOR
      initialTutors={allTutors}
      // Empty availableUsers disables add-tutor UI in client component
      availableUsers={[]}
    />
  )
}
