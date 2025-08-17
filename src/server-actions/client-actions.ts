'use server'

import { getPayload } from 'payload'
import config from '@/payload.config'
import { revalidatePath } from 'next/cache'
import type { Client, Tutor } from '@/payload-types'

export interface ClientWithDetails extends Client {
  assignedTutor?: Tutor | null
  platform?: string
  courseName?: string
  deadline?: string
  progress?: string
  notes?: string
}

export async function getAllClients(): Promise<Client[]> {
  try {
    const payload = await getPayload({ config })

    const result = await payload.find({
      collection: 'clients',
      limit: 1000,
      sort: '-createdAt',
    })

    return result.docs as Client[]
  } catch (error) {
    console.error('Failed to fetch clients:', error)
    return []
  }
}

export async function getAllTutors(): Promise<Tutor[]> {
  try {
    const payload = await getPayload({ config })

    const result = await payload.find({
      collection: 'tutors',
      limit: 1000,
      sort: 'fullName',
    })

    return result.docs as Tutor[]
  } catch (error) {
    console.error('Failed to fetch tutors:', error)
    return []
  }
}

export async function createClient(data: {
  name: string
  email: string
  phone?: string
}): Promise<{ success: boolean; error?: string; client?: Client }> {
  try {
    const payload = await getPayload({ config })

    // Check if client with this email already exists
    const existingClient = await payload.find({
      collection: 'clients',
      where: {
        email: { equals: data.email },
      },
      limit: 1,
    })

    if (existingClient.docs.length > 0) {
      return {
        success: false,
        error: 'A client with this email already exists',
      }
    }

    const result = await payload.create({
      collection: 'clients',
      data,
    })

    revalidatePath('/admin/clients')
    return { success: true, client: result as Client }
  } catch (error) {
    console.error('Failed to create client:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create client',
    }
  }
}

export async function updateClient(
  id: number,
  data: {
    name?: string
    email?: string
    phone?: string
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = await getPayload({ config })

    // If email is being updated, check for duplicates
    if (data.email) {
      const existingClient = await payload.find({
        collection: 'clients',
        where: {
          AND: [{ email: { equals: data.email } }, { id: { not_equals: id } }],
        },
        limit: 1,
      })

      if (existingClient.docs.length > 0) {
        return {
          success: false,
          error: 'A client with this email already exists',
        }
      }
    }

    await payload.update({
      collection: 'clients',
      id,
      data,
    })

    revalidatePath('/admin/clients')
    return { success: true }
  } catch (error) {
    console.error('Failed to update client:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update client',
    }
  }
}

export async function deleteClient(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = await getPayload({ config })

    // Check if client has any tasks
    const tasksResult = await payload.find({
      collection: 'tasks',
      where: {
        client: { equals: id },
      },
      limit: 1,
    })

    if (tasksResult.docs.length > 0) {
      return {
        success: false,
        error: 'Cannot delete client with existing tasks. Please delete all tasks first.',
      }
    }

    await payload.delete({
      collection: 'clients',
      id,
    })

    revalidatePath('/admin/clients')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete client:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete client',
    }
  }
}

export async function getClientStats(): Promise<{
  total: number
  withTasks: number
  withoutTasks: number
}> {
  try {
    const payload = await getPayload({ config })

    const [clientsResult, tasksResult] = await Promise.all([
      payload.find({
        collection: 'clients',
        limit: 0, // Only count
      }),
      payload.find({
        collection: 'tasks',
        limit: 1000,
      }),
    ])

    const totalClients = clientsResult.totalDocs
    const clientsWithTasks = new Set()

    tasksResult.docs.forEach((task: { client: number | { id: number } }) => {
      const clientId = typeof task.client === 'object' ? task.client.id : task.client
      if (clientId) {
        clientsWithTasks.add(clientId)
      }
    })

    return {
      total: totalClients,
      withTasks: clientsWithTasks.size,
      withoutTasks: totalClients - clientsWithTasks.size,
    }
  } catch (error) {
    console.error('Failed to get client stats:', error)
    return {
      total: 0,
      withTasks: 0,
      withoutTasks: 0,
    }
  }
}
