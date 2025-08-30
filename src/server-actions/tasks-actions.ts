'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { Task, Topic } from '@/payload-types'

export type TaskDoc = Task
export type TopicDoc = Topic

export async function listTasks(): Promise<TaskDoc[]> {
  try {
    const payload = await getPayload({ config })

    const result = await payload.find({
      collection: 'tasks',
      limit: 500,
      sort: '-createdAt',
      depth: 2, // Include relationships like client, tutor, topic
    })

    console.log('Tasks found:', result.totalDocs)
    return result.docs
  } catch (error) {
    console.error('Error listing tasks:', error)
    return []
  }
}

export async function fetchClientsAndTutorsAndTopics() {
  try {
    const payload = await getPayload({ config })

    const [clientsResult, tutorsResult, topicsResult] = await Promise.all([
      payload.find({
        collection: 'clients',
        limit: 500,
        depth: 1,
      }),
      payload.find({
        collection: 'tutors',
        limit: 500,
        depth: 1,
      }),
      payload.find({
        collection: 'topics',
        limit: 500,
        depth: 1,
      }),
    ])

    return {
      clients: clientsResult.docs,
      tutors: tutorsResult.docs,
      topics: topicsResult.docs,
    }
  } catch (error) {
    console.error('Error fetching clients, tutors, and topics:', error)
    return {
      clients: [],
      tutors: [],
      topics: [],
    }
  }
}

export async function createTask(formData: FormData): Promise<TaskDoc | null> {
  try {
    const payload = await getPayload({ config })

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const dueDate = formData.get('dueDate') as string
    const tutor = formData.get('tutor') as string
    const client = formData.get('client') as string
    const topics = formData.get('topics') as string // Now expects comma-separated topic IDs
    const status = formData.get('status') as string
    const score = formData.get('score') as string

    // Validate required fields
    if (!name || !tutor || !client || !topics) {
      throw new Error('Missing required fields: name, tutor, client, and topics are all required')
    }

    // Parse topics - can be a single ID or comma-separated IDs
    const topicIds = topics
      .split(',')
      .map((id) => Number(id.trim()))
      .filter((id) => !isNaN(id))

    if (topicIds.length === 0) {
      throw new Error('At least one valid topic ID is required')
    }

    const result = await payload.create({
      collection: 'tasks',
      data: {
        name,
        tutor: Number(tutor),
        client: Number(client),
        topics: topicIds,
        status: (status as 'pending' | 'completed') || 'pending',
        ...(description && { description }),
        ...(dueDate && { dueDate }),
        ...(score && { score: Number(score) }),
      },
    })

    return result
  } catch (error) {
    console.error('Error creating task:', error)
    return null
  }
}

export async function updateTask(
  id: number,
  data: Partial<{
    name: string
    description: string
    dueDate: string
    tutor: number
    topics: string // comma-separated topic IDs
    status: 'pending' | 'completed'
    score: number
    notes: string
  }>,
): Promise<TaskDoc | null> {
  try {
    const payload = await getPayload({ config })

    // Convert notes to description if provided
    const updateData: Record<string, unknown> = { ...data }
    if (data.notes !== undefined) {
      updateData.description = data.notes
      delete updateData.notes
    }

    // Handle topics if provided
    if (data.topics !== undefined) {
      const topicIds = data.topics
        .split(',')
        .map((id) => Number(id.trim()))
        .filter((id) => !isNaN(id))

      // Always remove the string version first
      delete updateData.topics

      // Add back the processed array if we have valid topics
      if (topicIds.length > 0) {
        updateData.topics = topicIds
      }
    }

    // Automatically set status to completed when a score is provided
    if (data.score !== undefined && data.score !== null) {
      updateData.status = 'completed'
    }

    console.log('Update data being sent to payload:', updateData)

    const result = await payload.update({
      collection: 'tasks',
      id,
      data: updateData,
    })

    return result
  } catch (error) {
    console.error('Error updating task:', error)
    return null
  }
}

export async function deleteTask(id: number): Promise<boolean> {
  try {
    const payload = await getPayload({ config })

    await payload.delete({
      collection: 'tasks',
      id,
    })

    return true
  } catch (error) {
    console.error('Error deleting task:', error)
    return false
  }
}

export async function assignTutorToTask(taskId: number, tutorId: number): Promise<boolean> {
  try {
    const updated = await updateTask(taskId, { tutor: tutorId })
    return !!updated
  } catch (error) {
    console.error('Error assigning tutor to task:', error)
    return false
  }
}

export async function updateTaskStatus(
  taskId: number,
  status: 'In Progress' | 'Completed',
  options?: { score?: number; notes?: string },
): Promise<boolean> {
  try {
    // Convert the status to the database format
    const dbStatus = status === 'Completed' ? 'completed' : 'pending'

    const updateData: {
      status: 'pending' | 'completed'
      score?: number
      notes?: string
    } = { status: dbStatus }

    if (options?.score !== undefined) {
      updateData.score = options.score
    }

    if (options?.notes !== undefined) {
      updateData.notes = options.notes
    }

    const updated = await updateTask(taskId, updateData)
    return !!updated
  } catch (error) {
    console.error('Error updating task status:', error)
    return false
  }
}

export async function updateTaskScore(taskId: number, score: number): Promise<boolean> {
  try {
    const updated = await updateTask(taskId, { score })
    return !!updated
  } catch (error) {
    console.error('Error updating task score:', error)
    return false
  }
}

export async function getTaskStats() {
  try {
    const payload = await getPayload({ config })

    const [totalResult, pendingResult, completedResult] = await Promise.all([
      payload.find({
        collection: 'tasks',
        limit: 0, // Just get count
      }),
      payload.find({
        collection: 'tasks',
        where: {
          status: {
            equals: 'pending',
          },
        },
        limit: 0,
      }),
      payload.find({
        collection: 'tasks',
        where: {
          status: {
            equals: 'completed',
          },
        },
        limit: 0,
      }),
    ])

    return {
      total: totalResult.totalDocs,
      pending: pendingResult.totalDocs,
      completed: completedResult.totalDocs,
    }
  } catch (error) {
    console.error('Error getting task stats:', error)
    return {
      total: 0,
      pending: 0,
      completed: 0,
    }
  }
}
