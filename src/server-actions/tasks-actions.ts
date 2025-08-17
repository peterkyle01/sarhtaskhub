'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { Task } from '@/payload-types'

export type TaskDoc = Task

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

export async function fetchClientsAndTutors() {
  try {
    const payload = await getPayload({ config })

    const [clientsResult, tutorsResult] = await Promise.all([
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
    ])

    return {
      clients: clientsResult.docs,
      tutors: tutorsResult.docs,
    }
  } catch (error) {
    console.error('Error fetching clients and tutors:', error)
    return {
      clients: [],
      tutors: [],
    }
  }
}

export async function createTask(formData: FormData): Promise<TaskDoc | null> {
  try {
    const payload = await getPayload({ config })

    const name = formData.get('name') as string
    const tutor = formData.get('tutor') as string
    const client = formData.get('client') as string
    const topic = formData.get('topic') as string
    const status = formData.get('status') as string
    const score = formData.get('score') as string

    const result = await payload.create({
      collection: 'tasks',
      data: {
        name,
        tutor: Number(tutor),
        client: Number(client),
        topic: Number(topic),
        status: (status as 'pending' | 'completed') || 'pending',
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
    tutor: number
    status: 'pending' | 'completed'
    score: number
  }>,
): Promise<TaskDoc | null> {
  try {
    const payload = await getPayload({ config })

    const result = await payload.update({
      collection: 'tasks',
      id,
      data,
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
  status: 'pending' | 'completed',
  options?: { score?: number },
): Promise<boolean> {
  try {
    const updateData: { status: 'pending' | 'completed'; score?: number } = { status }
    if (options?.score !== undefined) {
      updateData.score = options.score
    }

    const updated = await updateTask(taskId, updateData)
    return !!updated
  } catch (error) {
    console.error('Error updating task status:', error)
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
