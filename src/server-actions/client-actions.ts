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

export async function createClient(formData: FormData) {
  const payload = (await getPayload({ config })) as Payload

  const name = normalizeText(formData.get('name'), true)
  const platformRaw = normalizeText(formData.get('platform'), true)
  const courseName = normalizeText(formData.get('courseName'), true)
  const deadlineRaw = normalizeText(formData.get('deadline'))
  const assignedWorkerRaw = normalizeText(formData.get('assignedWorker'))
  const notes = normalizeText(formData.get('notes'))

  if (!name || !platformRaw || !courseName) {
    throw new Error('Missing required fields')
  }
  if (!ALLOWED_PLATFORMS.has(platformRaw)) {
    throw new Error('Invalid platform')
  }

  const assignedWorker = normalizeWorker(assignedWorkerRaw || null)

  // Basic deadline validation (YYYY-MM-DD)
  const deadline = deadlineRaw && /\d{4}-\d{2}-\d{2}/.test(deadlineRaw) ? deadlineRaw : undefined

  try {
    interface CreateArgs {
      collection: string
      data: Record<string, unknown>
    }
    interface CreateCapable {
      create: (args: CreateArgs) => Promise<unknown>
    }
    const created = await (payload as unknown as CreateCapable).create({
      collection: CLIENTS_COLLECTION,
      data: {
        name,
        platform: platformRaw,
        courseName,
        deadline: deadline || undefined,
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
