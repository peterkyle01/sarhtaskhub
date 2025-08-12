'use client'

import { useMemo, useEffect, useState } from 'react'
import { Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { PieChart, Pie, Cell } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

// Types
interface DashboardTask {
  id: number
  clientName: string
  courseName: string
  taskType: string
  platform: string
  dueTime: string
  status: 'Completed' | 'In Progress' | 'Pending'
  priority: 'high' | 'medium' | 'low'
  estimatedTime: string
}

interface DeadlineItem {
  id: number
  clientName: string
  courseName: string
  dueDate: string // ISO
  hoursLeft: number
  priority: 'high' | 'medium' | 'low'
}

// Remove mock workerData and todayTasks declarations, replace with state-driven data

function getStatusBadge(status: DashboardTask['status']) {
  const map: Record<DashboardTask['status'], string> = {
    Completed: 'bg-green-100 text-green-700',
    'In Progress': 'bg-sky-100 text-sky-700',
    Pending: 'bg-amber-100 text-amber-700',
  }
  return <Badge className={`${map[status]} rounded-full font-normal`}>{status}</Badge>
}

function getPriorityAccent(priority: DashboardTask['priority'] | DeadlineItem['priority']) {
  switch (priority) {
    case 'high':
      return 'border-l-red-400 bg-red-50'
    case 'medium':
      return 'border-l-amber-400 bg-amber-50'
    case 'low':
      return 'border-l-emerald-400 bg-emerald-50'
    default:
      return 'border-l-gray-300 bg-gray-50'
  }
}

function getTimeUntil(hoursLeft: number) {
  if (hoursLeft < 24) return `${hoursLeft}h left`
  const days = Math.floor(hoursLeft / 24)
  return `${days}d left`
}

export default function TutorDashboard() {
  const [stats, setStats] = useState<{
    userName: string
    totalTasks: number
    completedTasks: number
    pendingTasks: number
  } | null>(null)
  const [todayTasks, setTodayTasks] = useState<DashboardTask[]>([])
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<DeadlineItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const { getWorkerDashboardData } = await import('@/server-actions/worker-actions')
        const data = await getWorkerDashboardData()
        if (!active || !data) return
        setStats(data.stats)
        setTodayTasks(data.todayTasks)
        setUpcomingDeadlines(data.upcomingDeadlines)
      } catch (e) {
        console.error('Failed to load dashboard', e)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const completionRate = useMemo(() => {
    if (!stats || stats.totalTasks === 0) return 0
    return Math.round((stats.completedTasks / stats.totalTasks) * 100)
  }, [stats])

  const todayCompletionRate = useMemo(() => {
    if (!todayTasks.length) return 0
    const completed = todayTasks.filter((t) => t.status === 'Completed').length
    return Math.round((completed / todayTasks.length) * 100)
  }, [todayTasks])

  const progressData = useMemo(
    () => [
      { name: 'Completed', value: stats?.completedTasks || 0, color: '#10b981' },
      { name: 'Pending', value: stats?.pendingTasks || 0, color: '#f59e0b' },
    ],
    [stats?.completedTasks, stats?.pendingTasks],
  )

  const progressChartConfig = {
    Completed: { label: 'Completed', color: '#10b981' },
    Pending: { label: 'Pending', color: '#f59e0b' },
  }

  return (
    <div className="flex-1 space-y-4 sm:space-y-6">
      {/* Welcome */}
      <Card className="bg-[var(--primary)] text-[var(--primary-foreground)] border-0 rounded-xl sm:rounded-2xl shadow">
        <CardContent className="p-4 sm:p-6 flex flex-col gap-3 sm:gap-4">
          <div>
            <h2 className="text-lg sm:text-2xl font-bold mb-1">
              {loading ? 'Loading...' : `Welcome back, ${stats?.userName || 'Tutor'}! 👋`}
            </h2>
            <p className="opacity-80 text-sm sm:text-base">
              {loading
                ? 'Fetching your stats...'
                : `You have ${stats?.pendingTasks ?? 0} pending tasks.`}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm">
            <span className="flex items-center gap-1 opacity-90">
              <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {stats?.completedTasks ?? 0} Completed
            </span>
            <span className="flex items-center gap-1 opacity-90">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> {stats?.pendingTasks ?? 0} Pending
            </span>
            <span className="flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> {completionRate}% Overall
              Progress
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3 min-w-0">
        {/* Tasks List */}
        <Card className="lg:col-span-2 rounded-xl sm:rounded-2xl shadow-sm border border-[var(--border)] bg-[var(--card)]">
          <CardHeader className="pb-2 sm:pb-3 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base sm:text-lg">Today&apos;s Tasks</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {todayCompletionRate}% completed (
                  {todayTasks.filter((t) => t.status === 'Completed').length} of {todayTasks.length}
                  )
                </CardDescription>
              </div>
              <Badge className="bg-[var(--accent)] text-[var(--accent-foreground)] hover:opacity-90 rounded-full text-xs">
                {todayTasks.length} tasks
              </Badge>
            </div>
            <Progress value={todayCompletionRate} className="h-1.5 sm:h-2" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="space-y-2 sm:space-y-3">
              {todayTasks.length === 0 && (
                <div className="text-xs sm:text-sm opacity-60">No tasks for today.</div>
              )}
              {todayTasks.map((task) => (
                <Card
                  key={task.id}
                  className={`border-l-4 ${getPriorityAccent(task.priority)} rounded-lg sm:rounded-xl shadow-sm bg-[var(--card)]`}
                >
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                        <span className="font-medium text-xs sm:text-sm truncate">
                          {task.clientName}
                        </span>
                        <Badge variant="outline" className="rounded-full text-[10px] sm:text-xs">
                          {task.platform}
                        </Badge>
                      </div>
                      {getStatusBadge(task.status)}
                    </div>
                    <div className="text-[10px] sm:text-xs opacity-70 mb-1.5 sm:mb-2 truncate">
                      {task.courseName} - {task.taskType}
                    </div>
                    <div className="flex items-center justify-between text-[10px] sm:text-[11px] opacity-70">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <span className="flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> Due: {task.dueTime}
                        </span>
                        {task.estimatedTime && (
                          <span className="hidden sm:inline">Est: {task.estimatedTime}</span>
                        )}
                      </div>
                      <Badge variant="outline" className="rounded-full text-[9px] sm:text-[10px]">
                        {task.priority}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Progress Chart */}
        <Card className="rounded-xl sm:rounded-2xl shadow-sm border border-[var(--border)] bg-[var(--card)] min-w-0">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Progress</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Completed vs Pending</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="flex items-center justify-center w-full">
              <div className="relative w-full flex items-center justify-center max-w-[240px] mx-auto">
                <ChartContainer
                  config={progressChartConfig}
                  className="h-[160px] w-[160px] xs:h-[180px] xs:w-[180px] sm:h-[220px] sm:w-[220px] flex items-center justify-center"
                >
                  <PieChart>
                    <Pie
                      data={progressData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {progressData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-gray-800">
                      {completionRate}%
                    </div>
                    <div className="text-[10px] sm:text-xs text-gray-500">Complete</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 sm:gap-2 mt-3 sm:mt-4">
              {progressData.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between text-xs sm:text-sm"
                >
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span
                      className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-gray-600">{item.name}</span>
                  </div>
                  <span className="font-medium text-gray-800">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deadlines */}
      <Card className="rounded-xl sm:rounded-2xl shadow-sm border border-[var(--border)] bg-[var(--card)]">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--accent)]" /> Upcoming
            Deadlines
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Time-sensitive tasks</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingDeadlines.length === 0 && (
              <div className="text-xs sm:text-sm opacity-60 col-span-full">
                No upcoming deadlines.
              </div>
            )}
            {upcomingDeadlines.map((d) => (
              <div
                key={d.id}
                className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border-l-4 ${getPriorityAccent(d.priority)} flex flex-col gap-1 bg-[var(--card)]`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-xs sm:text-sm truncate">{d.clientName}</span>
                  <Badge
                    className={`rounded-full text-[9px] sm:text-[10px] font-normal ${
                      d.hoursLeft < 24
                        ? 'bg-red-100 text-red-700'
                        : d.hoursLeft < 48
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {getTimeUntil(d.hoursLeft)}
                  </Badge>
                </div>
                <div className="text-[10px] sm:text-xs opacity-70 truncate">{d.courseName}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
