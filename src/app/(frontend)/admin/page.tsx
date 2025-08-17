export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

import { getPayload } from 'payload'
import config from '@payload-config'
import DashboardClient from '@/components/custom/dashboard-client'

interface ClientDoc {
  id: number
  name: string
  email: string
  phone?: string
  createdAt?: string
  updatedAt?: string
}

interface TutorDoc {
  id: number
  fullName: string
  email: string
  subjects?: Array<{ id: number; name: string }>
  createdAt?: string
  updatedAt?: string
}

interface SubjectDoc {
  id: number
  name: string
  createdAt?: string
  updatedAt?: string
}

interface TaskDoc {
  id: number
  name: string
  status: 'pending' | 'completed'
  dueDate?: string
  score?: number
  createdAt?: string
  updatedAt?: string
  client?: number | { id: number; name: string }
  tutor?: number | { id: number; fullName: string }
  topic?: number | { id: number; name: string; subject?: { id: number; name: string } }
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

  // Fetch all data with proper relationships
  const [clientsRes, tasksRes, tutorsRes, subjectsRes] = await Promise.all([
    payload.find({ collection: 'clients', limit: 1000, depth: 1 }),
    payload.find({ collection: 'tasks', limit: 1000, depth: 2 }),
    payload.find({ collection: 'tutors', limit: 1000, depth: 1 }),
    payload.find({ collection: 'subjects', limit: 1000, depth: 1 }),
  ])

  const clients = clientsRes.docs as ClientDoc[]
  const tasks = tasksRes.docs as TaskDoc[]
  const tutors = tutorsRes.docs as TutorDoc[]
  const subjects = subjectsRes.docs as SubjectDoc[]

  // Basic stats
  const totalClients = clients.length
  const totalTutors = tutors.length
  const totalSubjects = subjects.length
  const pendingTasks = tasks.filter((t) => t.status === 'pending').length
  const completedTasks = tasks.filter((t) => t.status === 'completed').length
  const totalTasks = tasks.length

  // Date calculations
  const now = new Date()
  const weekStart = startOfWeek(now)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 7)

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  // Time-based stats
  const dueThisWeek = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) >= weekStart && new Date(t.dueDate) < weekEnd,
  ).length
  const dueToday = tasks.filter((t) => t.dueDate && isSameDay(new Date(t.dueDate), now)).length
  const overdueTasks = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'completed',
  ).length

  // Performance stats
  const completedThisMonth = tasks.filter(
    (t) =>
      t.status === 'completed' &&
      t.updatedAt &&
      new Date(t.updatedAt) >= monthStart &&
      new Date(t.updatedAt) <= monthEnd,
  ).length

  const averageScore = tasks
    .filter((t) => t.status === 'completed' && t.score !== undefined)
    .reduce((sum, t, _, arr) => sum + (t.score || 0) / arr.length, 0)

  // Activity stats
  const newClientsThisMonth = clients.filter(
    (c) => c.createdAt && new Date(c.createdAt) >= monthStart,
  ).length

  const newTasksThisWeek = tasks.filter(
    (t) => t.createdAt && new Date(t.createdAt) >= weekStart,
  ).length

  // Task completion chart (last 7 days)
  const taskChart: Array<{ name: string; completed: number; pending: number }> = []
  for (let i = 6; i >= 0; i--) {
    const day = new Date(now)
    day.setDate(now.getDate() - i)
    const label = day.toLocaleDateString('en-US', { weekday: 'short' })
    const completed = tasks.filter(
      (t) => t.status === 'completed' && t.updatedAt && isSameDay(new Date(t.updatedAt), day),
    ).length
    const pending = tasks.filter(
      (t) => t.status === 'pending' && t.createdAt && isSameDay(new Date(t.createdAt), day),
    ).length
    taskChart.push({ name: label, completed, pending })
  }

  // Subject distribution
  const subjectCounts: Record<string, number> = {}
  tasks.forEach((task) => {
    if (typeof task.topic === 'object' && task.topic?.subject) {
      const subjectName =
        typeof task.topic.subject === 'object' ? task.topic.subject.name : 'Unknown'
      subjectCounts[subjectName] = (subjectCounts[subjectName] || 0) + 1
    }
  })

  const totalForDistribution = Object.values(subjectCounts).reduce((a, b) => a + b, 0) || 1
  const palette = ['#10b981', '#f59e0b', '#3b82f6', '#6366f1', '#ef4444', '#8b5cf6', '#f97316']
  const subjectDistribution = Object.entries(subjectCounts)
    .sort(([, a], [, b]) => b - a) // Sort by count
    .slice(0, 6) // Take top 6
    .map(([k, v], idx) => ({
      name: k,
      value: Math.round((v / totalForDistribution) * 100),
      color: palette[idx % palette.length],
    }))

  // Recent activity (last 10 activities)
  const recentActivity = tasks
    .slice()
    .sort(
      (a, b) =>
        new Date(b.updatedAt || b.createdAt || 0).getTime() -
        new Date(a.updatedAt || a.createdAt || 0).getTime(),
    )
    .slice(0, 8)
    .map((t) => {
      const clientName = typeof t.client === 'object' ? t.client.name : `Client ${t.client}`
      const tutorName = typeof t.tutor === 'object' ? t.tutor.fullName : `Tutor ${t.tutor}`

      return {
        id: String(t.id),
        color: t.status === 'completed' ? 'bg-green-500' : 'bg-orange-500',
        message: `${t.name} ${t.status === 'completed' ? 'completed' : 'assigned'} - ${clientName}`,
        description: `Tutor: ${tutorName}`,
        time: new Date(t.updatedAt || t.createdAt || Date.now()).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      }
    })

  // Enhanced notifications
  const notifications: Array<{
    id: string
    type: 'warning' | 'urgent' | 'error'
    title: string
    description: string
    time: string
  }> = []

  if (overdueTasks > 0) {
    notifications.push({
      id: 'overdue',
      type: 'error',
      title: 'Overdue Tasks',
      description: `${overdueTasks} tasks are overdue`,
      time: 'Just now',
    })
  }

  if (dueToday > 0) {
    notifications.push({
      id: 'due-today',
      type: 'urgent',
      title: 'Due Today',
      description: `${dueToday} tasks due today`,
      time: 'Today',
    })
  }

  if (dueThisWeek > 0) {
    notifications.push({
      id: 'due-week',
      type: 'warning',
      title: 'Due This Week',
      description: `${dueThisWeek} tasks due this week`,
      time: 'This week',
    })
  }

  if (newClientsThisMonth > 0) {
    notifications.push({
      id: 'new-clients',
      type: 'warning',
      title: 'New Clients',
      description: `${newClientsThisMonth} new clients this month`,
      time: 'This month',
    })
  }

  // Calculate completion rate
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <DashboardClient
      stats={{
        totalClients,
        totalTutors,
        totalSubjects,
        pendingTasks,
        completedTasks,
        totalTasks,
        dueThisWeek,
        dueToday,
        overdueTasks,
        completedThisMonth,
        averageScore: Math.round(averageScore * 10) / 10,
        newClientsThisMonth,
        newTasksThisWeek,
        completionRate,
      }}
      notifications={notifications}
      taskChart={taskChart}
      subjectDistribution={subjectDistribution}
      recentActivity={recentActivity}
    />
  )
}
