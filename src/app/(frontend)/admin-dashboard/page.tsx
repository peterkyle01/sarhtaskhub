export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

import { getPayload } from 'payload'
import config from '@payload-config'
import DashboardClient from '@/components/custom/dashboard-client'

interface ClientDoc {
  id: number
  progress?: string | null
  createdAt?: string
  updatedAt?: string
}
interface TaskDoc {
  id: number
  status: string
  dueDate: string
  createdAt?: string
  updatedAt?: string
  client?: number | { id: number; name?: string }
  worker?: number | { id: number; fullName?: string }
}

function startOfWeek(date = new Date()) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff))
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export default async function AdminDashboardPage() {
  const payload = await getPayload({ config })
  const [clientsRes, tasksRes] = await Promise.all([
    payload.find({ collection: 'clients', limit: 1000, depth: 0 }),
    payload.find({ collection: 'tasks', limit: 1000, depth: 0 }),
  ])
  const clients = clientsRes.docs as ClientDoc[]
  const tasks = tasksRes.docs as TaskDoc[]

  const totalClients = clients.length
  const pendingTasks = tasks.filter((t) => t.status === 'Pending').length
  const completedTasks = tasks.filter((t) => t.status === 'Completed').length
  const now = new Date()
  const weekStart = startOfWeek(now)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 7)
  const dueThisWeek = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) >= weekStart && new Date(t.dueDate) < weekEnd,
  ).length
  const dueToday = tasks.filter((t) => t.dueDate && isSameDay(new Date(t.dueDate), now)).length

  const taskChart: Array<{ name: string; completed: number; pending: number }> = []
  for (let i = 6; i >= 0; i--) {
    const day = new Date(now)
    day.setDate(now.getDate() - i)
    const label = day.toLocaleDateString('en-US', { weekday: 'short' })
    const completed = tasks.filter(
      (t) => t.status === 'Completed' && t.updatedAt && isSameDay(new Date(t.updatedAt), day),
    ).length
    const pending = tasks.filter(
      (t) => t.status !== 'Completed' && t.createdAt && isSameDay(new Date(t.createdAt), day),
    ).length
    taskChart.push({ name: label, completed, pending })
  }

  const progressCounts: Record<string, number> = {}
  clients.forEach((c) => {
    const p = c.progress || 'Unknown'
    progressCounts[p] = (progressCounts[p] || 0) + 1
  })
  const totalForDistribution = Object.values(progressCounts).reduce((a, b) => a + b, 0) || 1
  const palette = ['#10b981', '#f59e0b', '#3b82f6', '#6366f1', '#ef4444']
  const clientDistribution = Object.entries(progressCounts).map(([k, v], idx) => ({
    name: k,
    value: Math.round((v / totalForDistribution) * 100),
    color: palette[idx % palette.length],
  }))

  const recentActivity = tasks
    .slice()
    .sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt || 0).getTime() -
        new Date(a.updatedAt || a.createdAt || 0).getTime(),
    )
    .slice(0, 5)
    .map((t) => ({
      id: String(t.id),
      color:
        t.status === 'Completed'
          ? 'bg-green-500'
          : t.status === 'In Progress'
            ? 'bg-blue-500'
            : 'bg-yellow-500',
      message: `Task ${t.id} ${t.status.toLowerCase()}`,
      time: new Date(t.updatedAt || t.createdAt || Date.now()).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }))

  const notifications: Array<{
    id: string
    type: 'warning' | 'urgent' | 'error'
    title: string
    description: string
    time: string
  }> = []
  const notStartedClients = clients.filter(
    (c) => !c.progress || c.progress === 'Not Started',
  ).length
  if (notStartedClients > 0) {
    notifications.push({
      id: 'n1',
      type: 'warning',
      title: 'Unstarted Clients',
      description: `${notStartedClients} clients not started`,
      time: 'Just now',
    })
  }
  const overdue = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'Completed',
  ).length
  if (overdue > 0) {
    notifications.push({
      id: 'n2',
      type: 'error',
      title: 'Overdue Tasks',
      description: `${overdue} tasks overdue`,
      time: 'Just now',
    })
  }
  if (dueToday > 0) {
    notifications.push({
      id: 'n3',
      type: 'urgent',
      title: 'Due Today',
      description: `${dueToday} tasks due today`,
      time: 'Today',
    })
  }

  return (
    <DashboardClient
      stats={{ totalClients, pendingTasks, completedTasks, dueThisWeek, dueToday }}
      notifications={notifications}
      taskChart={taskChart}
      clientDistribution={clientDistribution}
      recentActivity={recentActivity}
    />
  )
}
