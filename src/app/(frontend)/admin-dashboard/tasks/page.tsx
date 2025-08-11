import { listTasks, fetchClientsAndWorkers } from '@/server-actions/tasks-actions'
import TasksClient from './tasks-client'

interface RelClient {
  id: number
  name?: string
}
interface RelWorker {
  id: number
  fullName?: string
}
interface TaskDoc {
  id: number
  taskId?: string | null
  client: RelClient | number
  platform: string
  taskType: string
  dueDate: string
  status: string
  worker?: RelWorker | number | null
  score?: number | null
  notes?: string | null
}

export default async function TasksPage() {
  const [tasks, cw] = await Promise.all([listTasks(), fetchClientsAndWorkers()])
  const tasksTyped = tasks as TaskDoc[]
  return (
    <TasksClient
      initialTasks={tasksTyped}
      initialClients={cw.clients as RelClient[]}
      initialWorkers={cw.workers as RelWorker[]}
    />
  )
}
