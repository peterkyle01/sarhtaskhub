'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from './user-actions'

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

export async function getCurrentWorkerStats(): Promise<{
  userName: string
  totalTasks: number
  completedTasks: number
  pendingTasks: number
} | null> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'WORKER') return null
    const payload = await getPayload({ config })
    const tasksRes = await payload.find({
      collection: 'tasks',
      where: { worker: { equals: user.id } },
      limit: 500,
      sort: '-createdAt',
    })
    const tasks = (tasksRes.docs || []) as { status?: string }[]
    const completedTasks = tasks.filter((t) => t.status === 'Completed').length
    const totalTasks = tasks.length
    const pendingTasks = totalTasks - completedTasks
    return {
      userName: user.fullName || user.email || 'Worker',
      totalTasks,
      completedTasks,
      pendingTasks,
    }
  } catch (e) {
    console.error('Failed to get current worker stats', e)
    return null
  }
}

export interface DashboardTask {
  id: number
  clientName: string
  courseName: string
  taskType: string
  platform: string
  dueTime: string
  status: 'Completed' | 'In Progress' | 'Pending'
  priority: 'high' | 'medium' | 'low'
  estimatedTime: string
}

export interface DeadlineItem {
  id: number
  clientName: string
  courseName: string
  dueDate: string
  hoursLeft: number
  priority: 'high' | 'medium' | 'low'
}

function computePriority(hoursLeft: number): 'high' | 'medium' | 'low' {
  if (hoursLeft < 24) return 'high'
  if (hoursLeft < 72) return 'medium'
  return 'low'
}

export interface WorkerDashboardData {
  stats: {
    userName: string
    totalTasks: number
    completedTasks: number
    pendingTasks: number
  }
  todayTasks: DashboardTask[]
  upcomingDeadlines: DeadlineItem[]
}

export async function getWorkerDashboardData(): Promise<WorkerDashboardData | null> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'WORKER') return null
    const payload = await getPayload({ config })
    const tasksRes = await payload.find({
      collection: 'tasks',
      where: { worker: { equals: user.id } },
      depth: 2,
      limit: 500,
      sort: '-createdAt',
    })
    const now = new Date()
    const todayStr = now.toISOString().slice(0, 10)
    const todayTasks: DashboardTask[] = []
    const upcomingDeadlines: DeadlineItem[] = []
    for (const raw of tasksRes.docs as {
      id: number
      dueDate?: string
      client?: unknown
      taskType: string
      platform: string
      status: 'Completed' | 'In Progress' | 'Pending'
    }[]) {
      const dueDateISO: string | undefined = raw.dueDate
      if (!dueDateISO) continue
      const due = new Date(dueDateISO)
      const dateStr = due.toISOString().slice(0, 10)
      const hoursLeft = (due.getTime() - now.getTime()) / 36e5
      const clientDoc = (typeof raw.client === 'object' && raw.client) as
        | { name?: string; courseName?: string }
        | undefined
      const clientName = clientDoc?.name || 'Client'
      const courseName = clientDoc?.courseName || 'Course'
      const baseTask: DashboardTask = {
        id: raw.id,
        clientName,
        courseName,
        taskType: raw.taskType,
        platform: raw.platform,
        dueTime: due.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        status: raw.status,
        priority: computePriority(hoursLeft),
        estimatedTime: '',
      }
      if (dateStr === todayStr) {
        todayTasks.push(baseTask)
      } else if (hoursLeft > 0) {
        upcomingDeadlines.push({
          id: raw.id,
          clientName,
          courseName,
          dueDate: dueDateISO,
          hoursLeft: Math.round(hoursLeft),
          priority: computePriority(hoursLeft),
        })
      }
    }
    upcomingDeadlines.sort((a, b) => a.hoursLeft - b.hoursLeft)
    const completedTasks = (tasksRes.docs as { status?: string }[]).filter(
      (t) => t.status === 'Completed',
    ).length
    const totalTasks = tasksRes.docs.length
    const pendingTasks = totalTasks - completedTasks
    return {
      stats: {
        userName: user.fullName || user.email || 'Worker',
        totalTasks,
        completedTasks,
        pendingTasks,
      },
      todayTasks,
      upcomingDeadlines: upcomingDeadlines.slice(0, 6),
    }
  } catch (e) {
    console.error('Failed to get worker dashboard data', e)
    return null
  }
}
