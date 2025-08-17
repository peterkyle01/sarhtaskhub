'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { Tutor, Task, Client } from '@/payload-types'

export type TutorDoc = Tutor

export async function listTutors(): Promise<TutorDoc[]> {
  try {
    const payload = await getPayload({ config })

    const result = await payload.find({
      collection: 'tutors',
      limit: 500,
      sort: '-createdAt',
      depth: 2, // Include relationships like subjects
    })

    console.log('Tutors found:', result.totalDocs)
    console.log(
      'Tutor docs:',
      result.docs.map((t) => ({
        id: t.id,
        fullName: t.fullName,
        email: t.email,
        subjects: t.subjects,
        phone: t.phone,
      })),
    )

    return result.docs
  } catch (error) {
    console.error('Error listing tutors:', error)
    return []
  }
}

export async function createTutor(data: {
  fullName: string
  email: string
  phone?: string
}): Promise<TutorDoc | null> {
  try {
    const payload = await getPayload({ config })

    // Create the tutor account with auth
    const result = await payload.create({
      collection: 'tutors',
      data: {
        ...data,
        password: 'temp123!', // They'll need to reset this
        role: 'tutor',
      },
    })

    return result
  } catch (error) {
    console.error('Error creating tutor:', error)
    return null
  }
}

export async function updateTutor(
  id: number,
  data: Partial<{
    fullName: string
    phone: string
    subjects: number[]
  }>,
): Promise<TutorDoc | null> {
  try {
    const payload = await getPayload({ config })

    const result = await payload.update({
      collection: 'tutors',
      id,
      data,
    })

    return result
  } catch (error) {
    console.error('Error updating tutor:', error)
    return null
  }
}

export async function deleteTutor(id: number): Promise<boolean> {
  try {
    const payload = await getPayload({ config })

    await payload.delete({
      collection: 'tutors',
      id,
    })

    return true
  } catch (error) {
    console.error('Error deleting tutor:', error)
    return false
  }
}

export async function getTutorStats() {
  try {
    const payload = await getPayload({ config })

    const result = await payload.find({
      collection: 'tutors',
      limit: 0, // Just get count
    })

    // Get tutors with subjects count
    const tutorsWithSubjects = await payload.find({
      collection: 'tutors',
      where: {
        subjects: {
          exists: true,
        },
      },
      limit: 0,
    })

    // Get subjects count
    const subjectsResult = await payload.find({
      collection: 'subjects',
      limit: 0,
    })

    const total = result.totalDocs
    const withSubjects = tutorsWithSubjects.totalDocs
    const withoutSubjects = total - withSubjects
    const totalSubjects = subjectsResult.totalDocs

    return {
      total,
      withSubjects,
      withoutSubjects,
      totalSubjects,
    }
  } catch (error) {
    console.error('Error getting tutor stats:', error)
    return {
      total: 0,
      withSubjects: 0,
      withoutSubjects: 0,
      totalSubjects: 0,
    }
  }
}

export async function listSubjects() {
  try {
    const payload = await getPayload({ config })

    const result = await payload.find({
      collection: 'subjects',
      limit: 500,
      sort: 'name',
    })

    return result.docs
  } catch (error) {
    console.error('Error listing subjects:', error)
    return []
  }
}

// Dashboard data function for tutor dashboard
export async function getTutorDashboardData() {
  try {
    const { getCurrentUser } = await import('./auth-actions')
    const user = await getCurrentUser()

    if (!user || user.collection !== 'tutors') {
      return null
    }

    const payload = await getPayload({ config })

    // Get all tasks for this tutor
    const tasksResult = await payload.find({
      collection: 'tasks',
      where: {
        tutor: { equals: user.id },
      },
      depth: 2,
      limit: 500,
    })

    const allTasks = tasksResult.docs

    // Calculate overall stats
    const totalTasks = allTasks.length
    const completedTasks = allTasks.filter((task) => task.status === 'completed').length
    const pendingTasks = totalTasks - completedTasks

    // Get today's tasks (within next 24 hours)
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    const todayTasks = allTasks
      .filter((task) => {
        if (!task.dueDate) return false
        const dueDate = new Date(task.dueDate)
        return dueDate >= now && dueDate <= tomorrow
      })
      .map((task) => {
        const client = typeof task.client === 'object' ? task.client : null
        const topic = typeof task.topic === 'object' ? task.topic : null
        const subject = topic && typeof topic.subject === 'object' ? topic.subject : null

        return {
          id: task.id as number,
          clientName: client?.name || 'Unknown Client',
          courseName: subject?.name || 'Unknown Subject',
          taskType: topic?.name || 'Unknown Topic',
          platform: 'Remote', // Default platform
          dueTime: task.dueDate
            ? new Date(task.dueDate).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })
            : 'No due time',
          status:
            task.status === 'completed'
              ? ('Completed' as const)
              : task.status === 'pending'
                ? ('Pending' as const)
                : ('In Progress' as const),
          priority: 'medium' as const, // Default priority
          estimatedTime: '2h', // Default estimated time
        }
      })

    // Get upcoming deadlines (next 7 days)
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const upcomingDeadlines = allTasks
      .filter((task) => {
        if (!task.dueDate || task.status === 'completed') return false
        const dueDate = new Date(task.dueDate)
        return dueDate > tomorrow && dueDate <= nextWeek
      })
      .map((task) => {
        const client = typeof task.client === 'object' ? task.client : null
        const topic = typeof task.topic === 'object' ? task.topic : null
        const subject = topic && typeof topic.subject === 'object' ? topic.subject : null
        const dueDate = new Date(task.dueDate!)
        const hoursLeft = Math.round((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60))

        return {
          id: task.id as number,
          clientName: client?.name || 'Unknown Client',
          courseName: subject?.name || 'Unknown Subject',
          dueDate: task.dueDate!,
          hoursLeft,
          priority:
            hoursLeft < 48
              ? ('high' as const)
              : hoursLeft < 96
                ? ('medium' as const)
                : ('low' as const),
        }
      })
      .sort((a, b) => a.hoursLeft - b.hoursLeft)

    const tutorUser = user as Tutor

    return {
      stats: {
        userName: tutorUser.fullName || user.email || 'Tutor',
        totalTasks,
        completedTasks,
        pendingTasks,
      },
      todayTasks,
      upcomingDeadlines,
    }
  } catch (error) {
    console.error('Error getting tutor dashboard data:', error)
    return null
  }
}

// Types for client management
export interface AssignedClientSummary {
  id: number
  name: string
  courseName: string
  platform: string
  priority: 'high' | 'medium' | 'low'
  joinDate: string
  lastActivity: string
  taskCounts: {
    total: number
    completed: number
    inProgress: number
    pending: number
    overdue: number
  }
  nextDeadline?: string
}

export interface ClientTaskItem {
  id: number
  title: string
  type: string
  status: string
  dueDate: string
  score: number | null
  completedDate: string | null
}

// Function to get assigned clients for current tutor
export async function listAssignedClientsForCurrentTutor(): Promise<AssignedClientSummary[]> {
  try {
    const { getCurrentUser } = await import('./auth-actions')
    const user = await getCurrentUser()

    if (!user || user.collection !== 'tutors') {
      return []
    }

    const payload = await getPayload({ config })

    // Get all tasks assigned to this tutor
    const tasksResult = await payload.find({
      collection: 'tasks',
      where: {
        tutor: { equals: user.id },
      },
      depth: 2,
      limit: 500,
    })

    const tasks = tasksResult.docs

    // Group tasks by client
    const clientMap = new Map<
      number,
      {
        client: Client
        tasks: Task[]
      }
    >()

    tasks.forEach((task) => {
      const client = typeof task.client === 'object' ? task.client : null
      if (!client) return

      const clientId = client.id as number
      if (!clientMap.has(clientId)) {
        clientMap.set(clientId, {
          client,
          tasks: [],
        })
      }
      clientMap.get(clientId)?.tasks.push(task)
    })

    // Convert to AssignedClientSummary format
    const now = new Date()

    return Array.from(clientMap.values()).map(({ client, tasks }) => {
      const completedTasks = tasks.filter((t) => t.status === 'completed')
      const pendingTasks = tasks.filter((t) => t.status === 'pending')
      const inProgressTasks = tasks.filter(
        (t) => t.status !== 'completed' && t.status !== 'pending',
      )

      // Calculate overdue tasks
      const overdueTasks = tasks.filter((t) => {
        if (t.status === 'completed' || !t.dueDate) return false
        return new Date(t.dueDate) < now
      })

      // Find next deadline
      const upcomingTasks = tasks
        .filter((t) => t.status !== 'completed' && t.dueDate)
        .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())

      const nextDeadline =
        upcomingTasks.length > 0 ? upcomingTasks[0].dueDate || undefined : undefined

      // Get course name from first task with topic/subject
      const taskWithSubject = tasks.find((t) => {
        const topic = typeof t.topic === 'object' ? t.topic : null
        return topic && typeof topic.subject === 'object'
      })

      const courseName = taskWithSubject
        ? typeof taskWithSubject.topic === 'object' &&
          typeof taskWithSubject.topic.subject === 'object'
          ? taskWithSubject.topic.subject.name
          : 'Unknown Course'
        : 'Unknown Course'

      return {
        id: client.id as number,
        name: client.name || 'Unknown Client',
        courseName,
        platform: 'Remote', // Default platform
        priority:
          overdueTasks.length > 0
            ? ('high' as const)
            : pendingTasks.length > 2
              ? ('medium' as const)
              : ('low' as const),
        joinDate: client.createdAt || new Date().toISOString(),
        lastActivity:
          tasks.length > 0
            ? tasks.sort(
                (a, b) =>
                  new Date(b.updatedAt || b.createdAt).getTime() -
                  new Date(a.updatedAt || a.createdAt).getTime(),
              )[0].updatedAt ||
              tasks[0].createdAt ||
              'Unknown'
            : 'No activity',
        taskCounts: {
          total: tasks.length,
          completed: completedTasks.length,
          inProgress: inProgressTasks.length,
          pending: pendingTasks.length,
          overdue: overdueTasks.length,
        },
        nextDeadline,
      }
    })
  } catch (error) {
    console.error('Error getting assigned clients:', error)
    return []
  }
}

// Function to get tasks for a specific client
export async function listClientTasksForTutor(clientId: number): Promise<ClientTaskItem[]> {
  try {
    const { getCurrentUser } = await import('./auth-actions')
    const user = await getCurrentUser()

    if (!user || user.collection !== 'tutors') {
      return []
    }

    const payload = await getPayload({ config })

    // Get tasks for this client assigned to current tutor
    const tasksResult = await payload.find({
      collection: 'tasks',
      where: {
        and: [{ tutor: { equals: user.id } }, { client: { equals: clientId } }],
      },
      depth: 2,
      limit: 500,
      sort: '-dueDate',
    })

    return tasksResult.docs.map((task) => {
      const topic = typeof task.topic === 'object' ? task.topic : null

      return {
        id: task.id as number,
        title: task.name || 'Untitled Task',
        type: topic?.name || 'General',
        status:
          task.status === 'completed'
            ? 'Completed'
            : task.status === 'pending'
              ? 'Pending'
              : 'In Progress',
        dueDate: task.dueDate || new Date().toISOString(),
        score: task.score || null,
        completedDate: task.status === 'completed' ? task.updatedAt || null : null,
      }
    })
  } catch (error) {
    console.error('Error getting client tasks:', error)
    return []
  }
}

// Types for task submission page
export interface AssignedTask {
  id: number
  clientName: string
  courseName: string
  taskType: string
  description: string | null
  platform: string
  dueTime: string // ISO full datetime
  dueDate: string // derived date part
  status: 'Completed' | 'In Progress' | 'Pending'
  priority: 'high' | 'medium' | 'low'
  estimatedTime: string
  score: number | null
}

// Function to get all assigned tasks for current tutor (for task submission page)
export async function listAssignedTasksForCurrentTutor(): Promise<AssignedTask[]> {
  try {
    const { getCurrentUser } = await import('./auth-actions')
    const user = await getCurrentUser()

    if (!user) {
      throw new Error('AUTHENTICATION_REQUIRED')
    }

    if (user.collection !== 'tutors') {
      throw new Error('TUTOR_ACCESS_REQUIRED')
    }

    const payload = await getPayload({ config })

    // Get all tasks assigned to this tutor
    const tasksResult = await payload.find({
      collection: 'tasks',
      where: {
        tutor: { equals: user.id },
      },
      depth: 2,
      limit: 500,
      sort: '-dueDate',
    })

    const now = new Date()

    return tasksResult.docs.map((task) => {
      const client = typeof task.client === 'object' ? task.client : null
      const topic = typeof task.topic === 'object' ? task.topic : null
      const subject = topic && typeof topic.subject === 'object' ? topic.subject : null

      // Calculate priority based on due date and status
      let priority: 'high' | 'medium' | 'low' = 'medium'
      if (task.dueDate) {
        const dueDate = new Date(task.dueDate)
        const timeDiff = dueDate.getTime() - now.getTime()
        const daysDiff = timeDiff / (1000 * 60 * 60 * 24)

        if (daysDiff < 0 || daysDiff <= 1) {
          priority = 'high' // Overdue or due within 1 day
        } else if (daysDiff <= 3) {
          priority = 'medium' // Due within 3 days
        } else {
          priority = 'low' // Due later
        }
      }

      // Convert status
      let status: 'Completed' | 'In Progress' | 'Pending'
      if (task.status === 'completed') {
        status = 'Completed'
      } else if (task.status === 'pending') {
        status = 'Pending'
      } else {
        status = 'In Progress'
      }

      const dueDateTime = task.dueDate || new Date().toISOString()

      return {
        id: task.id as number,
        clientName: client?.name || 'Unknown Client',
        courseName: subject?.name || 'Unknown Course',
        taskType: topic?.name || 'General Task',
        description: task.description || null,
        platform: 'Remote', // Default platform
        dueTime: dueDateTime,
        dueDate: dueDateTime.split('T')[0],
        status,
        priority,
        estimatedTime: '2h', // Default estimated time
        score: task.score || null,
      }
    })
  } catch (error) {
    console.error('Error getting assigned tasks:', error)
    if (
      error instanceof Error &&
      (error.message === 'AUTHENTICATION_REQUIRED' || error.message === 'TUTOR_ACCESS_REQUIRED')
    ) {
      throw error
    }
    return []
  }
}

// Debug function to check all tasks and tutors
export async function debugTasksAndTutors() {
  try {
    const { getCurrentUser } = await import('./auth-actions')
    const user = await getCurrentUser()
    const payload = await getPayload({ config })

    console.log('=== DEBUG: Current User ===')
    console.log(
      'User:',
      user ? { id: user.id, collection: user.collection, email: user.email } : 'No user',
    )

    // Get all tasks
    const allTasks = await payload.find({
      collection: 'tasks',
      depth: 2,
      limit: 100,
    })

    // Get all tutors
    const allTutors = await payload.find({
      collection: 'tutors',
      limit: 100,
    })

    console.log('\n=== DEBUG: All Tasks ===')
    console.log(`Total tasks: ${allTasks.totalDocs}`)
    allTasks.docs.forEach((task) => {
      const tutorInfo =
        typeof task.tutor === 'object' ? `${task.tutor?.id} (${task.tutor?.fullName})` : task.tutor
      console.log(`Task ${task.id}: "${task.name}" assigned to tutor ${tutorInfo}`)
    })

    console.log('\n=== DEBUG: All Tutors ===')
    console.log(`Total tutors: ${allTutors.totalDocs}`)
    allTutors.docs.forEach((tutor) => {
      console.log(`Tutor ${tutor.id}: ${tutor.fullName} (${tutor.email})`)
    })

    // Check specifically for current user's tasks
    if (user && user.collection === 'tutors') {
      console.log(`\n=== DEBUG: Tasks for current tutor (ID: ${user.id}) ===`)
      const userTasks = allTasks.docs.filter((task) => {
        const tutorId = typeof task.tutor === 'object' ? task.tutor?.id : task.tutor
        return tutorId == user.id // Using == for loose comparison
      })
      console.log(`Found ${userTasks.length} tasks for current tutor`)
      userTasks.forEach((task) => {
        console.log(`- Task ${task.id}: "${task.name}"`)
      })
    }

    return {
      tasks: allTasks.docs,
      tutors: allTutors.docs,
      currentUser: user,
    }
  } catch (error) {
    console.error('Debug error:', error)
    return { tasks: [], tutors: [], currentUser: null }
  }
}
