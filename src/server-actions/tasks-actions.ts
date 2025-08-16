'use server'

import { getPayload, type GeneratedTypes } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'

// Constants / validation helpers
const TASKS_COLLECTION = 'tasks' as const
const ALLOWED_PLATFORMS = ['Cengage', 'ALEKS', 'MATLAB'] as const
const ALLOWED_TASK_TYPES = ['Assignment', 'Quiz', 'Course'] as const
const ALLOWED_STATUS = ['Pending', 'In Progress', 'Completed'] as const

type Platform = (typeof ALLOWED_PLATFORMS)[number]
type TaskType = (typeof ALLOWED_TASK_TYPES)[number]
type Status = (typeof ALLOWED_STATUS)[number]

function normText(v: FormDataEntryValue | null, required = false): string | undefined {
  if (v == null) return required ? '' : undefined
  const s = String(v).trim()
  if (required && !s) return ''
  return s || undefined
}

function normNumber(v: string | undefined): number | undefined {
  if (!v) return undefined
  if (/^\d+$/.test(v)) {
    const n = Number(v)
    return Number.isNaN(n) ? undefined : n
  }
  return undefined // only supporting numeric PKs for now
}

// Create Task from a form submission
export async function createTask(formData: FormData) {
  const payload = await getPayload({ config })

  const clientRaw = normText(formData.get('client'), true)
  const platformRaw = normText(formData.get('platform'), true)
  const taskTypeRaw = normText(formData.get('taskType'), true)
  const dueDate = normText(formData.get('dueDate'), true)
  const tutorRaw = normText(formData.get('tutor'))
  const notes = normText(formData.get('notes'))

  if (!clientRaw || !platformRaw || !taskTypeRaw || !dueDate)
    throw new Error('Missing required fields')
  if (!ALLOWED_PLATFORMS.includes(platformRaw as Platform)) throw new Error('Invalid platform')
  if (!ALLOWED_TASK_TYPES.includes(taskTypeRaw as TaskType)) throw new Error('Invalid task type')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) throw new Error('Invalid due date format (YYYY-MM-DD)')

  const platform = platformRaw as Platform
  const taskType = taskTypeRaw as TaskType
  const client = normNumber(clientRaw)
  if (client == null) throw new Error('Invalid client reference')
  const tutor = tutorRaw ? normNumber(tutorRaw) : undefined
  console.log('data sent', { client, platform, taskType, dueDate, tutor, notes })
  try {
    const created = await payload.create({
      collection: TASKS_COLLECTION,
      data: {
        client,
        platform,
        taskType,
        dueDate,
        status: 'Pending' as Status,
        tutor: tutor ?? undefined,
        notes,
      },
    })
    revalidatePath('/admin-dashboard/tasks')
    return created
  } catch (e) {
    console.error('Failed to create task', e)
    throw new Error('Failed to create task')
  }
}

// Assign / reassign a tutor to a task
export async function assignTutorToTask(
  taskId: number,
  tutorId: number | null,
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = await getPayload({ config })
    await payload.update({
      collection: TASKS_COLLECTION,
      id: taskId,
      data: { tutor: tutorId ?? null },
    })
    revalidatePath('/admin-dashboard/tasks')
    return { success: true }
  } catch (e: unknown) {
    console.error('Failed to assign tutor', e)
    return { success: false, error: e instanceof Error ? e.message : 'Failed to assign tutor' }
  }
}

// Update task status, optional score and notes
export async function updateTaskStatus(
  taskId: number,
  status: Status,
  opts: { score?: number | null; notes?: string | null } = {},
): Promise<{ success: boolean; error?: string }> {
  if (!ALLOWED_STATUS.includes(status)) return { success: false, error: 'Invalid status' }
  if (opts.score != null) {
    if (typeof opts.score !== 'number' || opts.score < 0 || opts.score > 100) {
      return { success: false, error: 'Score must be 0-100' }
    }
  }
  try {
    const payload = await getPayload({ config })
    await payload.update({
      collection: TASKS_COLLECTION,
      id: taskId,
      data: {
        status,
        ...(opts.score !== undefined ? { score: opts.score } : {}),
        ...(opts.notes !== undefined ? { notes: opts.notes } : {}),
      },
    })
    revalidatePath('/admin-dashboard/tasks')
    return { success: true }
  } catch (e: unknown) {
    console.error('Failed to update task status', e)
    return { success: false, error: e instanceof Error ? e.message : 'Failed to update task' }
  }
}

// List tasks (basic)
export async function listTasks(): Promise<GeneratedTypes['collections']['tasks'] | unknown> {
  try {
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: TASKS_COLLECTION,
      limit: 100,
      sort: '-createdAt',
      depth: 1, // include related client & tutor docs
    })
    return result.docs
  } catch (e) {
    console.error('Failed to list tasks', e)
    return []
  }
}

// Fetch clients & tutors to populate selects
export async function fetchClientsAndTutors(): Promise<{
  clients: GeneratedTypes['collections']['users'][]
  tutors: GeneratedTypes['collections']['users'][]
}> {
  try {
    const payload = await getPayload({ config })
    const [clientsRes, tutorsRes] = await Promise.all([
      payload.find({
        collection: 'users',
        where: { role: { equals: 'CLIENT' } },
        limit: 500,
        sort: 'fullName',
      }),
      payload.find({
        collection: 'users',
        where: { role: { equals: 'TUTOR' } },
        limit: 500,
        sort: 'fullName',
      }),
    ])
    return {
      clients: clientsRes.docs as GeneratedTypes['collections']['users'][],
      tutors: tutorsRes.docs as GeneratedTypes['collections']['users'][],
    }
  } catch (e) {
    console.error('Failed to fetch clients/tutors', e)
    return { clients: [], tutors: [] }
  }
}

// Delete a task
export async function deleteTask(id: number): Promise<boolean> {
  try {
    const payload = await getPayload({ config })
    await payload.delete({ collection: TASKS_COLLECTION, id })
    revalidatePath('/admin-dashboard/tasks')
    return true
  } catch (e) {
    console.error('Failed to delete task', e)
    return false
  }
}
