import { listWorkers, WorkerDoc } from '@/server-actions/worker-actions'
import WorkersClient from './workers-client'

export default async function WorkersPage() {
  const workers: WorkerDoc[] = await listWorkers()
  return <WorkersClient initialWorkers={workers} />
}
