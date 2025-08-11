'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'

const WORKERS_COLLECTION = 'workers' as const
const USERS_COLLECTION = 'users' as const

interface BaseUserRef {
  id: number
  fullName?: string
  email?: string
}
interface WorkerCollectionDoc {
  id: number
  workerId?: string | null
  user?: BaseUserRef | number | null
  performance?: {
    overallScore?: number | null
    tasksCompleted?: number | null
    averageCompletionTime?: number | null
    lastEvaluation?: string | null
    notes?: string | null
  }
  createdAt: string
  updatedAt: string
}

export interface WorkerDoc {
  id: number
  workerId?: string | null
  user?: BaseUserRef | number | null
  fullName: string
  email: string
  performance?: WorkerCollectionDoc['performance']
  createdAt: string
  updatedAt: string
}

function toWorkerDoc(doc: WorkerCollectionDoc): WorkerDoc {
  const userObj = typeof doc.user === 'object' && doc.user !== null ? doc.user : undefined
  return {
    id: doc.id,
    workerId: doc.workerId || undefined,
    user: doc.user || undefined,
    fullName: userObj?.fullName || '',
    email: userObj?.email || '',
    performance: doc.performance,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

export async function listWorkers(): Promise<WorkerDoc[]> {
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: WORKERS_COLLECTION,
    limit: 500,
    sort: '-createdAt',
    depth: 1,
  })
  return (result.docs as WorkerCollectionDoc[]).map(toWorkerDoc)
}

export async function createWorker(data: { userId: number }): Promise<WorkerDoc | null> {
  try {
    const payload = await getPayload({ config })
    const baseUser = await payload.findByID({ collection: USERS_COLLECTION, id: data.userId })
    if (baseUser.role !== 'WORKER') throw new Error('Base user must have role WORKER')

    const created = await payload.create({
      collection: WORKERS_COLLECTION,
      data: { user: data.userId },
      depth: 1,
    })
    return toWorkerDoc(created as WorkerCollectionDoc)
  } catch (e) {
    console.error('Failed to create worker', e)
    return null
  }
}

export async function deleteWorker(id: number): Promise<boolean> {
  try {
    const payload = await getPayload({ config })
    await payload.delete({ collection: WORKERS_COLLECTION, id })
    revalidatePath('/admin-dashboard/workers')
    return true
  } catch (e) {
    console.error('Failed to delete worker', e)
    return false
  }
}
