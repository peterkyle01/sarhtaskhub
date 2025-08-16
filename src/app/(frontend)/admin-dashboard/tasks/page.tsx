export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'
import { listTasks, fetchClientsAndTutors } from '@/server-actions/tasks-actions'
import TasksClient from './tasks-client'

interface RelClient {
  id: number
  name?: string
}
interface RelTutor {
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
  tutor?: RelTutor | number | null
  score?: number | null
  notes?: string | null
}

export default async function TasksPage() {
  const [tasks, cw] = await Promise.all([listTasks(), fetchClientsAndTutors()])
  const tasksTyped = tasks as TaskDoc[]
  console.log('Clients', cw)
  return (
    <TasksClient
      initialTasks={tasksTyped}
      initialClients={cw.clients as RelClient[]}
      initialTutors={cw.tutors as RelTutor[]}
    />
  )
}
