import WorkersClient from './tutors-client'
import { getPayload } from 'payload'
import config from '@payload-config'
import { listWorkers } from '@/server-actions/worker-actions'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

interface BaseWorkerUser {
  id: number
  fullName?: string
  email?: string
  workerId?: string // newly added field from Users collection
  createdAt: string
  updatedAt: string
}

export default async function WorkersPage() {
  const payload = await getPayload({ config })

  // All base users that have role WORKER (displayed as Tutor in UI)
  const baseUsersRes = await payload.find({
    collection: 'users',
    where: { role: { equals: 'WORKER' } },
    limit: 500,
    sort: '-createdAt',
  })

  // Existing worker profile documents (may be a subset)
  const workerProfiles = await listWorkers()

  // Map existing profiles by their related base user id
  const profileByUserId = new Map<number, (typeof workerProfiles)[number]>()
  for (const p of workerProfiles) {
    const userId =
      typeof p.user === 'object' && p.user
        ? p.user.id
        : typeof p.user === 'number'
          ? p.user
          : undefined
    if (userId) profileByUserId.set(userId, p)
  }

  // Combine: every base user becomes a worker entry (even without a profile)
  const allWorkers = (baseUsersRes.docs as BaseWorkerUser[]).map((u) => {
    const profile = profileByUserId.get(u.id)
    const combinedWorkerId = profile?.workerId || u.workerId // prefer profile workerId, fallback to base user
    if (profile) {
      return {
        id: profile.id,
        workerId: combinedWorkerId,
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
      workerId: combinedWorkerId,
      user: u.id,
      fullName: u.fullName || '',
      email: u.email || '',
      performance: undefined,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }
  })

  return (
    <WorkersClient
      // Show every base user with role WORKER
      initialWorkers={allWorkers}
      // Empty availableUsers disables add-worker UI in client component
      availableUsers={[]}
    />
  )
}
