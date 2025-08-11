'use server'

import { revalidatePath } from 'next/cache'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Payload } from 'payload'

// Temporary type until Payload regenerates types for the new collection
// (after a build, `clients` will be part of the generated CollectionSlug union)
const CLIENTS_COLLECTION = 'clients' as const
const ALLOWED_PLATFORMS = new Set(['Cengage', 'ALEKS'])

function normalizeText(v: FormDataEntryValue | null, required = false): string | undefined {
  if (v == null) return required ? '' : undefined
  const s = String(v).trim()
  if (required && !s) return ''
  return s || undefined
}

function normalizeWorker(ref: string | null): string | number | undefined {
  if (!ref) return undefined
  // If payload uses numeric IDs, convert when numeric
  if (/^\d+$/.test(ref)) return Number(ref)
  return ref
}

function normalizeUser(ref: string | null): string | number | undefined {
  if (!ref) return undefined
  if (/^\d+$/.test(ref)) return Number(ref)
  return ref
}

export async function createClient(formData: FormData) {
  const payload = (await getPayload({ config })) as Payload

  const nameRaw = normalizeText(formData.get('name')) // optional now
  const platformRaw = normalizeText(formData.get('platform'), true) as
    | 'Cengage'
    | 'ALEKS'
    | undefined
  const courseName = normalizeText(formData.get('courseName'), true)
  const deadlineRaw = normalizeText(formData.get('deadline'))
  const assignedWorkerRaw = normalizeText(formData.get('assignedWorker'))
  const notes = normalizeText(formData.get('notes'))
  const userRefRaw = normalizeText(formData.get('user'), true)

  if (!platformRaw || !courseName || !userRefRaw) {
    throw new Error('Missing required fields')
  }
  if (!ALLOWED_PLATFORMS.has(platformRaw)) {
    throw new Error('Invalid platform')
  }

  const assignedWorker = normalizeWorker(assignedWorkerRaw || null)
  const userRef = normalizeUser(userRefRaw)
  if (typeof userRef !== 'number') throw new Error('Invalid user reference') // enforce numeric for type safety

  // Basic deadline validation (YYYY-MM-DD)
  const deadline = deadlineRaw && /\d{4}-\d{2}-\d{2}/.test(deadlineRaw) ? deadlineRaw : ''

  try {
    // Ensure linked user is role CLIENT
    const userDoc = await payload.findByID({ collection: 'users', id: userRef })
    if (userDoc?.role !== 'CLIENT') throw new Error('Selected user is not a CLIENT role')

    const created = await payload.create({
      collection: CLIENTS_COLLECTION,
      data: {
        user: userRef,
        name: nameRaw || userDoc.fullName, // default to user fullName
        platform: platformRaw,
        courseName,
        deadline,
        progress: 'Not Started',
        assignedWorker: typeof assignedWorker === 'number' ? assignedWorker : undefined,
        notes,
      },
    })

    revalidatePath('/admin-dashboard/clients')
    return created
  } catch (err) {
    console.error('Failed to create client', err)
    throw new Error('Failed to create client')
  }
}

export async function updateClient(
  id: number,
  data: Partial<{
    name: string
    platform: 'Cengage' | 'ALEKS'
    courseName: string
    deadline: string
    progress: string
    assignedWorker: number | null
    notes: string
  }>,
) {
  const payload = (await getPayload({ config })) as Payload
  try {
    const sanitized: Record<string, unknown> = {}
    if (data.name !== undefined) sanitized.name = data.name.trim()
    if (data.platform !== undefined && ALLOWED_PLATFORMS.has(data.platform))
      sanitized.platform = data.platform
    if (data.courseName !== undefined) sanitized.courseName = data.courseName.trim()
    if (data.deadline !== undefined) sanitized.deadline = data.deadline
    if (data.progress !== undefined) sanitized.progress = data.progress
    if (data.assignedWorker !== undefined)
      sanitized.assignedWorker = data.assignedWorker || undefined
    if (data.notes !== undefined) sanitized.notes = data.notes

    const updated = await payload.update({ collection: CLIENTS_COLLECTION, id, data: sanitized })
    revalidatePath('/admin-dashboard/clients')
    return updated
  } catch (e) {
    console.error('Failed to update client', e)
    throw new Error('Failed to update client')
  }
}
