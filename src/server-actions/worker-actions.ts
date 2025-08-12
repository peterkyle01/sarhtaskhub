'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from './user-actions'

// Backend still uses 'workers'; UI may display Tutor instead.
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

// ------------------------------------------------------------
// Additional worker-focused data helpers (replace mock data)
// ------------------------------------------------------------

export interface AssignedClientSummary {
  id: number
  name: string
  platform: string
  courseName: string
  joinDate: string
  taskCounts: {
    total: number
    completed: number
    inProgress: number
    pending: number
    overdue: number
  }
  nextDeadline: string | null
  priority: 'high' | 'medium' | 'low'
  lastActivity: string
}

export interface ClientTaskItem {
  id: number
  taskId?: string
  title: string
  type: string
  status: 'Pending' | 'In Progress' | 'Completed'
  dueDate: string
  score: number | null
  completedDate: string | null
  priority: 'high' | 'medium' | 'low'
}

function relativeTime(fromISO: string): string {
  const then = new Date(fromISO).getTime()
  const now = Date.now()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin} min${diffMin === 1 ? '' : 's'} ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`
}

function classifyDeadline(dueISO: string): 'high' | 'medium' | 'low' {
  const now = Date.now()
  const due = new Date(dueISO).getTime()
  const hoursLeft = (due - now) / 36e5
  if (hoursLeft < 24) return 'high'
  if (hoursLeft < 72) return 'medium'
  return 'low'
}

// List clients assigned to the current worker with aggregated task stats
export async function listAssignedClientsForCurrentWorker(): Promise<AssignedClientSummary[]> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'WORKER') return []
    const payload = await getPayload({ config })
    // Fetch clients assigned to this worker
    type ClientDoc = {
      id: number
      name?: string
      clientId?: string
      platform?: string
      courseName?: string
      createdAt: string
      updatedAt: string
    }
    const clientsRes = await payload.find({
      collection: 'clients',
      where: { assignedWorker: { equals: user.id } },
      limit: 300,
      depth: 1,
      sort: '-updatedAt',
    })
    if (!clientsRes.docs.length) return []
    const clientIds = (clientsRes.docs as ClientDoc[]).map((c) => c.id)
    // Fetch tasks for these clients assigned to this worker
    type TaskDoc = {
      id: number
      client: number | ClientDoc
      status: 'Pending' | 'In Progress' | 'Completed'
      dueDate?: string
      updatedAt: string
    }
    const tasksRes = await payload.find({
      collection: 'tasks',
      where: {
        and: [{ client: { in: clientIds } }, { worker: { equals: user.id } }],
      },
      depth: 0,
      limit: 1000,
    })
    const tasksByClient: Record<number, TaskDoc[]> = {}
    for (const t of tasksRes.docs as TaskDoc[]) {
      const cid = typeof t.client === 'number' ? t.client : (t.client as ClientDoc)?.id
      if (!cid) continue
      ;(tasksByClient[cid] ||= []).push(t)
    }
    const summaries: AssignedClientSummary[] = (clientsRes.docs as ClientDoc[]).map((c) => {
      const tlist: TaskDoc[] = tasksByClient[c.id] || []
      let completed = 0,
        inProgress = 0,
        pending = 0,
        overdue = 0
      let nextDeadline: string | null = null
      for (const t of tlist) {
        switch (t.status) {
          case 'Completed':
            completed++
            break
          case 'In Progress':
            inProgress++
            break
          case 'Pending':
            pending++
            break
        }
        if (t.dueDate) {
          const due = new Date(t.dueDate)
          if (t.status !== 'Completed' && due.getTime() < Date.now()) {
            overdue++
          }
          if (!nextDeadline || new Date(nextDeadline).getTime() > due.getTime()) {
            nextDeadline = t.dueDate
          }
        }
      }
      // Determine priority from earliest active deadline & overdue
      let priority: 'high' | 'medium' | 'low' = 'low'
      if (overdue > 0) priority = 'high'
      else if (nextDeadline) priority = classifyDeadline(nextDeadline)
      return {
        id: c.id,
        name: c.name || c.clientId || `Client ${c.id}`,
        platform: c.platform || 'Cengage',
        courseName: c.courseName || 'Course',
        joinDate: c.createdAt,
        taskCounts: {
          total: tlist.length,
          completed,
          inProgress,
          pending,
          overdue,
        },
        nextDeadline,
        priority,
        lastActivity: relativeTime(c.updatedAt),
      }
    })
    return summaries
  } catch (e) {
    console.error('Failed to list assigned clients', e)
    return []
  }
}

// List tasks for a single client (for modal)
export async function listClientTasksForWorker(clientId: number): Promise<ClientTaskItem[]> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'WORKER') return []
    const payload = await getPayload({ config })
    const tasksRes = await payload.find({
      collection: 'tasks',
      where: {
        and: [{ client: { equals: clientId } }, { worker: { equals: user.id } }],
      },
      depth: 0,
      limit: 200,
      sort: '-dueDate',
    })
    type TaskDoc = {
      id: number
      taskId?: string
      taskType: string
      status: 'Pending' | 'In Progress' | 'Completed'
      dueDate: string
      score?: number | null
      updatedAt: string
    }
    return (tasksRes.docs as TaskDoc[]).map((t) => ({
      id: t.id,
      taskId: t.taskId,
      title: t.taskId || `Task ${t.id}`,
      type: t.taskType,
      status: t.status,
      dueDate: t.dueDate,
      score: t.score ?? null,
      completedDate: t.status === 'Completed' ? t.updatedAt : null,
      priority: classifyDeadline(t.dueDate),
    }))
  } catch (e) {
    console.error('Failed to list client tasks for worker', e)
    return []
  }
}

// List all tasks for current worker (used in submit-task page)
export async function listAssignedTasksForCurrentWorker(): Promise<DashboardTask[]> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'WORKER') return []
    const payload = await getPayload({ config })
    const tasksRes = await payload.find({
      collection: 'tasks',
      where: { worker: { equals: user.id } },
      depth: 2,
      limit: 500,
      sort: '-dueDate',
    })
    const now = new Date()
    type TaskDoc = {
      id: number
      taskType: string
      platform: string
      dueDate: string
      status: 'Completed' | 'In Progress' | 'Pending'
      client?: {
        name?: string
        courseName?: string
      }
    }
    return (tasksRes.docs as TaskDoc[]).map((raw) => {
      const due = raw.dueDate ? new Date(raw.dueDate) : now
      return {
        id: raw.id,
        clientName:
          typeof raw.client === 'object' && raw.client ? raw.client.name || 'Client' : 'Client',
        courseName:
          typeof raw.client === 'object' && raw.client
            ? raw.client.courseName || 'Course'
            : 'Course',
        taskType: raw.taskType,
        platform: raw.platform,
        dueTime: due.toISOString(),
        status: raw.status,
        priority: classifyDeadline(due.toISOString()),
        estimatedTime: '',
      }
    })
  } catch (e) {
    console.error('Failed to list assigned tasks for worker', e)
    return []
  }
}
