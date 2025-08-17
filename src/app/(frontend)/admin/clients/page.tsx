import { getAllClients, getAllTutors, getClientStats } from '@/server-actions/client-actions'
import ClientsClient from './clients-client'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export default async function ClientsPage() {
  const [clients, tutors, stats] = await Promise.all([
    getAllClients(),
    getAllTutors(),
    getClientStats(),
  ])

  return <ClientsClient initialClients={clients} initialTutors={tutors} stats={stats} />
}
