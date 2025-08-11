import ClientsClient from './clients-client'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Payload } from 'payload'
import type { ClientItem, WorkerUser } from './clients-client'

interface GenericDoc {
  id: string | number
  [key: string]: unknown
}

interface BaseClientUser {
  id: number
  fullName?: string
  email?: string
  createdAt?: string
  updatedAt?: string
}

export const dynamic = 'force-dynamic'

export default async function ClientsPage() {
  const payload = (await getPayload({ config })) as Payload

  // Existing client profile documents
  const clientsRes = await payload.find({ collection: 'clients', limit: 500, sort: '-createdAt' })

  // Workers (for assignment select)
  const workersRes = await payload.find({
    collection: 'users',
    where: { role: { equals: 'WORKER' } },
    limit: 300,
  })

  // All base users with role CLIENT
  const clientUsersRes = await payload.find({
    collection: 'users',
    where: { role: { equals: 'CLIENT' } },
    limit: 800,
    sort: '-createdAt',
  })

  // Map existing client profiles by linked user id (field 'user')
  const clientProfileByUserId = new Map<number, GenericDoc>()
  const clientDocs = clientsRes.docs as unknown as GenericDoc[]
  for (const doc of clientDocs) {
    const userRel = doc['user']
    let userId: number | undefined
    if (typeof userRel === 'number') userId = userRel
    else if (
      typeof userRel === 'object' &&
      userRel !== null &&
      'id' in userRel &&
      typeof (userRel as { id?: unknown }).id === 'number'
    ) {
      userId = (userRel as { id: number }).id
    }
    if (typeof userId === 'number') clientProfileByUserId.set(userId, doc)
  }

  // Normalize existing client profile docs
  const existingClientItems: ClientItem[] = clientDocs.map((c) => {
    const userRel = c['user']
    let relatedUserFullName: string | undefined
    if (
      typeof userRel === 'object' &&
      userRel !== null &&
      'fullName' in userRel &&
      typeof (userRel as { fullName?: unknown }).fullName === 'string'
    ) {
      relatedUserFullName = (userRel as { fullName: string }).fullName
    }
    return {
      id: String(c.id),
      clientId: c['clientId'] as string | undefined,
      name: (c['name'] as string) || relatedUserFullName || '',
      platform: (c['platform'] as string) || '',
      courseName: (c['courseName'] as string) || '',
      deadline: c['deadline'] as string | undefined,
      progress: (c['progress'] as string) || 'Not Started',
      assignedWorker: c['assignedWorker'] as string | number | WorkerUser | undefined,
      notes: c['notes'] as string | undefined,
    }
  })

  // Add synthetic entries for base client users that do NOT yet have a client profile
  const syntheticClients: ClientItem[] = (clientUsersRes.docs as BaseClientUser[])
    .filter((u) => !clientProfileByUserId.has(u.id))
    .map((u) => ({
      id: `synthetic-${u.id}`,
      clientId: undefined,
      name: u.fullName || u.email || `Client ${u.id}`,
      platform: '',
      courseName: '',
      deadline: undefined,
      progress: 'Not Started',
      assignedWorker: undefined,
      notes: undefined,
    }))

  // Merge (existing profiles first, then synthetic)
  const combinedClients = [...existingClientItems, ...syntheticClients]

  const normWorkers: WorkerUser[] = (workersRes.docs as unknown as GenericDoc[]).map((w) => ({
    ...w,
    id: String(w.id),
  }))
  const normClientUsers = (clientUsersRes.docs as unknown as GenericDoc[]).map((u) => ({
    ...u,
    id: String(u.id),
  }))

  return (
    <ClientsClient
      initialClients={combinedClients}
      workers={normWorkers}
      clientUsers={normClientUsers}
    />
  )
}
