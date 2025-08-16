'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from './user-actions'

// Backend collection slug (collection file named Tutors.ts but slug remains 'tutors')
const TUTORS_COLLECTION = 'tutors' as const
const USERS_COLLECTION = 'users' as const

interface BaseUserRef {
  id: number
  fullName?: string
  email?: string
}
interface TutorCollectionDoc {
  id: number
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

export interface TutorDoc {
  id: number
  tutorId?: string | null
  user?: BaseUserRef | number | null
  fullName: string
  email: string
  performance?: TutorCollectionDoc['performance']
  createdAt: string
  updatedAt: string
}

export async function listTutors(): Promise<TutorDoc[]> {
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: TUTORS_COLLECTION,
    limit: 500,
    sort: '-createdAt',
    depth: 2, // Increase depth to get User data including tutorId
  })

  return (result.docs as TutorCollectionDoc[]).map((doc) => {
    const userObj =
      typeof doc.user === 'object' && doc.user !== null ? (doc.user as BaseUserRef) : undefined
    return {
      id: doc.id,
      tutorId: `TU${doc.id}`, // Use Tutor document ID as display ID
      user: doc.user || undefined,
      fullName: userObj?.fullName || '',
      email: userObj?.email || '',
      performance: doc.performance,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    }
  })
}

export async function createTutor(data: { userId: number }): Promise<TutorDoc | null> {
  try {
    const payload = await getPayload({ config })
    const baseUser = await payload.findByID({ collection: USERS_COLLECTION, id: data.userId })
    if (baseUser.role !== 'TUTOR') throw new Error('Base user must have role TUTOR')

    const created = await payload.create({
      collection: TUTORS_COLLECTION,
      data: { user: data.userId },
      depth: 2,
    })

    const createdDoc = created as TutorCollectionDoc
    const userObj =
      typeof createdDoc.user === 'object' && createdDoc.user !== null
        ? (createdDoc.user as BaseUserRef)
        : undefined

    return {
      id: createdDoc.id,
      tutorId: `TU${createdDoc.id}`, // Use Tutor document ID as display ID
      user: createdDoc.user || undefined,
      fullName: userObj?.fullName || '',
      email: userObj?.email || '',
      performance: createdDoc.performance,
      createdAt: createdDoc.createdAt,
      updatedAt: createdDoc.updatedAt,
    }
  } catch (e) {
    console.error('Failed to create tutor', e)
    return null
  }
}

export async function deleteTutor(id: number): Promise<boolean> {
  try {
    const payload = await getPayload({ config })
    await payload.delete({ collection: TUTORS_COLLECTION, id })
    revalidatePath('/admin-dashboard/tutors')
    return true
  } catch (e) {
    console.error('Failed to delete tutor', e)
    return false
  }
}

export async function getCurrentTutorStats(): Promise<{
  userName: string
  totalTasks: number
  completedTasks: number
  pendingTasks: number
} | null> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'TUTOR') return null
    const payload = await getPayload({ config })
    const tasksRes = await payload.find({
      collection: 'tasks',
      where: { tutor: { equals: user.id } },
      limit: 500,
      sort: '-createdAt',
    })
    const tasks = (tasksRes.docs || []) as { status?: string }[]
    const completedTasks = tasks.filter((t) => t.status === 'Completed').length
    const totalTasks = tasks.length
    const pendingTasks = totalTasks - completedTasks
    return {
      userName: user.fullName || user.email || 'Tutor',
      totalTasks,
      completedTasks,
      pendingTasks,
    }
  } catch (e) {
    console.error('Failed to get current tutor stats', e)
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

export interface TutorDashboardData {
  stats: {
    userName: string
    totalTasks: number
    completedTasks: number
    pendingTasks: number
  }
  todayTasks: DashboardTask[]
  upcomingDeadlines: DeadlineItem[]
}

export async function getTutorDashboardData(): Promise<TutorDashboardData | null> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'TUTOR') return null
    const payload = await getPayload({ config })
    const tasksRes = await payload.find({
      collection: 'tasks',
      where: { tutor: { equals: user.id } },
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
        userName: user.fullName || user.email || 'Tutor',
        totalTasks,
        completedTasks,
        pendingTasks,
      },
      todayTasks,
      upcomingDeadlines: upcomingDeadlines.slice(0, 6),
    }
  } catch (e) {
    console.error('Failed to get tutor dashboard data', e)
    return null
  }
}

// ------------------------------------------------------------
// Additional tutor-focused data helpers (replace mock data)
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

// List clients assigned to the current tutor with aggregated task stats
export async function listAssignedClientsForCurrentTutor(): Promise<AssignedClientSummary[]> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'TUTOR') return []
    const payload = await getPayload({ config })
    // Fetch clients assigned to this tutor
    type ClientDoc = {
      id: number
      name?: string
      platform?: string
      courseName?: string
      createdAt: string
      updatedAt: string
    }
    const clientsRes = await payload.find({
      collection: 'clients',
      where: { assignedTutor: { equals: user.id } },
      limit: 300,
      depth: 1,
      sort: '-updatedAt',
    })
    if (!clientsRes.docs.length) return []
    const clientIds = (clientsRes.docs as ClientDoc[]).map((c) => c.id)
    // Fetch tasks for these clients assigned to this tutor
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
        and: [{ client: { in: clientIds } }, { tutor: { equals: user.id } }],
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
        name: c.name || `Client ${c.id}`,
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
export async function listClientTasksForTutor(clientId: number): Promise<ClientTaskItem[]> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'TUTOR') return []
    const payload = await getPayload({ config })
    const tasksRes = await payload.find({
      collection: 'tasks',
      where: {
        and: [{ client: { equals: clientId } }, { tutor: { equals: user.id } }],
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
    console.error('Failed to list client tasks for tutor', e)
    return []
  }
}

// List all tasks for current tutor (used in submit-task page)
export async function listAssignedTasksForCurrentTutor(): Promise<DashboardTask[]> {
  try {
    const user = await getCurrentUser()
    if (!user || user.role !== 'TUTOR') return []
    const payload = await getPayload({ config })
    const tasksRes = await payload.find({
      collection: 'tasks',
      where: { tutor: { equals: user.id } },
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
    console.error('Failed to list assigned tasks for tutor', e)
    return []
  }
}
