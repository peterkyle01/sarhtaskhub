import ClientsClient from './clients-client'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Payload } from 'payload'
import type { ClientItem, WorkerUser } from './clients-client'

interface GenericDoc {
  id: string | number
  [key: string]: unknown
}

export const dynamic = 'force-dynamic'

export default async function ClientsPage() {
  const payload = (await getPayload({ config })) as Payload
  const clientsRes = await payload.find({ collection: 'clients', limit: 100, sort: '-createdAt' })
  const workersRes = await payload.find({
    collection: 'users',
    where: { role: { equals: 'WORKER' } },
    limit: 100,
  })
  const normClients: ClientItem[] = (clientsRes.docs as unknown as GenericDoc[]).map((c) => ({
    id: String(c.id),
    clientId: c['clientId'] as string | undefined,
    name: c['name'] as string,
    platform: c['platform'] as string,
    courseName: c['courseName'] as string,
    deadline: c['deadline'] as string | undefined,
    progress: (c['progress'] as string) || 'Not Started',
    assignedWorker: c['assignedWorker'] as string | number | WorkerUser | undefined,
    notes: c['notes'] as string | undefined,
  }))
  const normWorkers: WorkerUser[] = (workersRes.docs as unknown as GenericDoc[]).map((w) => ({
    ...w,
    id: String(w.id),
  }))
  return <ClientsClient initialClients={normClients} workers={normWorkers} />
}
