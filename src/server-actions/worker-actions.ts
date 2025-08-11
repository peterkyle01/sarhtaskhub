'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'

const WORKERS_COLLECTION = 'workers' as const

export interface WorkerDoc {
  id: number
  workerId?: string | null
  fullName: string
  email: string
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

export async function listWorkers(): Promise<WorkerDoc[]> {
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: WORKERS_COLLECTION,
    limit: 500,
    sort: '-createdAt',
  })
  return result.docs as WorkerDoc[]
}

export async function createWorker(data: {
  fullName: string
  email: string
  password: string
}): Promise<WorkerDoc | null> {
  try {
    const payload = await getPayload({ config })
    const doc = await payload.create({ collection: WORKERS_COLLECTION, data })
    revalidatePath('/admin-dashboard/workers')
    return doc as WorkerDoc
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
