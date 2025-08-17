export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'
import { listTasks, fetchClientsAndTutors, getTaskStats } from '@/server-actions/tasks-actions'
import TasksClient from './tasks-client'

export default async function TasksPage() {
  const [tasks, clientsAndTutors, stats] = await Promise.all([
    listTasks(),
    fetchClientsAndTutors(),
    getTaskStats(),
  ])

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Total Tasks</h3>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Pending</h3>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Completed</h3>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          </div>
        </div>
      </div>

      <TasksClient
        initialTasks={tasks}
        initialClients={clientsAndTutors.clients}
        initialTutors={clientsAndTutors.tutors}
      />
    </div>
  )
}
