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
  password: string
}): Promise<TutorDoc | null> {
  try {
    const payload = await getPayload({ config })

    // Create the tutor account with auth
    const result = await payload.create({
      collection: 'tutors',
      data: {
        ...data,
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

export async function resetTutorPassword(id: number, newPassword: string): Promise<boolean> {
  try {
    const payload = await getPayload({ config })

    await payload.update({
      collection: 'tutors',
      id,
      data: {
        password: newPassword,
      },
    })

    return true
  } catch (error) {
    console.error('Error resetting tutor password:', error)
    return false
  }
}

export async function getCurrentTutorProfile(): Promise<TutorDoc | null> {
  try {
    const { getCurrentUser } = await import('./auth-actions')
    const user = await getCurrentUser()

    if (!user || user.collection !== 'tutors') {
      return null
    }

    const payload = await getPayload({ config })

    const tutor = await payload.findByID({
      collection: 'tutors',
      id: user.id,
      depth: 2,
    })

    return tutor
  } catch (error) {
    console.error('Error getting current tutor profile:', error)
    return null
  }
}

export async function updateCurrentTutorProfile(data: {
  fullName: string
  phone?: string
  subjects?: number[]
  profilePicture?: number
}): Promise<TutorDoc | null> {
  try {
    const { getCurrentUser } = await import('./auth-actions')
    const user = await getCurrentUser()

    if (!user || user.collection !== 'tutors') {
      throw new Error('TUTOR_ACCESS_REQUIRED')
    }

    const payload = await getPayload({ config })

    const result = await payload.update({
      collection: 'tutors',
      id: user.id,
      data,
    })

    return result
  } catch (error) {
    console.error('Error updating tutor profile:', error)
    return null
  }
}

export async function uploadProfilePicture(
  formData: FormData,
): Promise<{ success: boolean; mediaId?: number; error?: string }> {
  try {
    const { getCurrentUser } = await import('./auth-actions')
    const user = await getCurrentUser()

    if (!user || user.collection !== 'tutors') {
      return { success: false, error: 'TUTOR_ACCESS_REQUIRED' }
    }

    const payload = await getPayload({ config })
    const file = formData.get('file') as File

    if (!file) {
      return { success: false, error: 'No file provided' }
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.',
      }
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return {
        success: false,
        error: 'File size too large. Please upload an image smaller than 5MB.',
      }
    }

    // Convert File to Buffer for Payload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Create the file object that Payload expects
    const payloadFile = {
      data: buffer,
      mimetype: file.type,
      name: file.name,
      size: file.size,
    }

    // Upload to media collection
    const result = await payload.create({
      collection: 'media',
      data: {
        alt: `${user.email || 'User'} profile picture`,
      },
      file: payloadFile,
    })

    return { success: true, mediaId: result.id as number }
  } catch (error) {
    console.error('Error uploading profile picture:', error)
    return { success: false, error: 'Failed to upload image' }
  }
}

export async function updateCurrentTutorPassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { getCurrentUser } = await import('./auth-actions')
    const user = await getCurrentUser()

    if (!user || user.collection !== 'tutors') {
      return { success: false, error: 'TUTOR_ACCESS_REQUIRED' }
    }

    const payload = await getPayload({ config })

    // First verify the current password by attempting a login
    try {
      await payload.login({
        collection: 'tutors',
        data: {
          email: user.email,
          password: currentPassword,
        },
      })
    } catch (_error) {
      return { success: false, error: 'Current password is incorrect' }
    }

    // Update the password
    await payload.update({
      collection: 'tutors',
      id: user.id,
      data: {
        password: newPassword,
      },
    })

    return { success: true }
  } catch (error) {
    console.error('Error updating tutor password:', error)
    return { success: false, error: 'Failed to update password' }
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
    const pendingTasks = allTasks.filter((task) => task.status === 'pending').length

    // Get upcoming tasks (next 7 days) or all pending tasks if none in next 7 days
    const now = new Date()
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    let upcomingTasks = allTasks.filter((task) => {
      if (task.status === 'completed') return false
      if (!task.dueDate) return true // Include tasks without due date
      const dueDate = new Date(task.dueDate)
      return dueDate <= nextWeek
    })

    // If no tasks in next week, show all pending tasks
    if (upcomingTasks.length === 0) {
      upcomingTasks = allTasks.filter((task) => task.status === 'pending')
    }

    const dashboardTasks = upcomingTasks
      .slice(0, 8) // Limit to 8 tasks for dashboard
      .map((task) => {
        const client = typeof task.client === 'object' ? task.client : null

        // Handle multiple topics - get the first topic and its subject for display
        const firstTopic =
          Array.isArray(task.topics) && task.topics.length > 0
            ? typeof task.topics[0] === 'object'
              ? task.topics[0]
              : null
            : null
        const subject =
          firstTopic && typeof firstTopic.subject === 'object' ? firstTopic.subject : null

        // Generate realistic estimated time based on task complexity
        const taskComplexity = (task.name?.length || 0) + (task.description?.length || 0)
        let estimatedTime = '1-2h'
        if (taskComplexity > 100) estimatedTime = '3-4h'
        else if (taskComplexity > 50) estimatedTime = '2-3h'
        else estimatedTime = '1-2h'

        return {
          id: task.id as number,
          clientName: client?.name || 'Unknown Client',
          courseName: subject?.name || 'Unknown Subject',
          taskType: firstTopic?.name || 'Unknown Topic',
          platform: 'Online Learning',
          dueTime: task.dueDate
            ? new Date(task.dueDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })
            : 'No due date',
          status: task.status === 'completed' ? ('Completed' as const) : ('Pending' as const),
          estimatedTime,
        }
      })

    // Get upcoming deadlines (next 7 days, excluding tasks we already showed)
    const upcomingDeadlines = allTasks
      .filter((task) => {
        if (!task.dueDate || task.status === 'completed') return false
        const dueDate = new Date(task.dueDate)
        const dayAfterNextWeek = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000)
        return dueDate > nextWeek && dueDate <= dayAfterNextWeek
      })
      .map((task) => {
        const client = typeof task.client === 'object' ? task.client : null

        // Handle multiple topics - get the first topic and its subject for display
        const firstTopic =
          Array.isArray(task.topics) && task.topics.length > 0
            ? typeof task.topics[0] === 'object'
              ? task.topics[0]
              : null
            : null
        const subject =
          firstTopic && typeof firstTopic.subject === 'object' ? firstTopic.subject : null
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
      dashboardTasks,
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
  mostUrgentTask?: {
    dueDate: string
    daysRemaining: number
    isOverdue: boolean
  }
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

      // Calculate most urgent task info
      let mostUrgentTask = undefined
      if (upcomingTasks.length > 0) {
        const urgentTaskDueDate = upcomingTasks[0].dueDate!
        const dueDate = new Date(urgentTaskDueDate)
        const today = new Date()

        // Reset time to start of day for accurate comparison
        dueDate.setHours(0, 0, 0, 0)
        today.setHours(0, 0, 0, 0)

        const diffTime = dueDate.getTime() - today.getTime()
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        mostUrgentTask = {
          dueDate: urgentTaskDueDate,
          daysRemaining,
          isOverdue: daysRemaining < 0,
        }
      }

      // Get course name from first task with topics/subject
      const taskWithSubject = tasks.find((t) => {
        return (
          Array.isArray(t.topics) &&
          t.topics.length > 0 &&
          typeof t.topics[0] === 'object' &&
          t.topics[0] &&
          typeof t.topics[0].subject === 'object'
        )
      })

      const courseName =
        taskWithSubject &&
        Array.isArray(taskWithSubject.topics) &&
        taskWithSubject.topics.length > 0 &&
        typeof taskWithSubject.topics[0] === 'object' &&
        taskWithSubject.topics[0] &&
        typeof taskWithSubject.topics[0].subject === 'object'
          ? taskWithSubject.topics[0].subject.name
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
        mostUrgentTask,
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
      // Handle multiple topics - get the first topic for display
      const firstTopic =
        Array.isArray(task.topics) && task.topics.length > 0
          ? typeof task.topics[0] === 'object'
            ? task.topics[0]
            : null
          : null

      return {
        id: task.id as number,
        title: task.name || 'Untitled Task',
        type: firstTopic?.name || 'General',
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
  name: string
  description: string | null
  dueTime: string // ISO full datetime
  dueDate: string // derived date part
  status: 'Completed' | 'In Progress' | 'Pending'
  priority: 'high' | 'medium' | 'low'
  score: number | null
  topics: Array<{
    id: number
    name: string
    parent: {
      id: number
      name: string
    } | null
    subject: {
      id: number
      name: string
    }
  }>
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

      // Handle multiple topics
      const topics = Array.isArray(task.topics)
        ? task.topics
            .map((topic) => {
              if (typeof topic === 'object' && topic) {
                const subject = typeof topic.subject === 'object' ? topic.subject : null
                const parent =
                  typeof topic.parent === 'object' && topic.parent ? topic.parent : null
                return {
                  id: topic.id,
                  name: topic.name || 'Unknown Topic',
                  parent: parent
                    ? {
                        id: parent.id,
                        name: parent.name || 'Unknown Parent',
                      }
                    : null,
                  subject: {
                    id: subject?.id || 0,
                    name: subject?.name || 'Unknown Subject',
                  },
                }
              }
              return null
            })
            .filter((topic): topic is NonNullable<typeof topic> => topic !== null)
        : []

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
        name: task.name || 'Untitled Task',
        description: task.description || null,
        dueTime: dueDateTime,
        dueDate: dueDateTime.split('T')[0],
        status,
        priority,
        score: task.score || null,
        topics: topics,
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
