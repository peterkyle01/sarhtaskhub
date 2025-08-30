'use client'

import { useMemo, useEffect, useState } from 'react'
import { Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import dynamic from 'next/dynamic'
import { ChartContainer } from '@/components/ui/chart'
// Lazy load heavy chart pie
const ProgressPie = dynamic(() => import('@/components/custom/progress-pie'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[160px] sm:h-[220px] text-xs text-muted-foreground">
      Loading chart...
    </div>
  ),
})

// Types
interface DashboardTask {
  id: number
  clientName: string
  courseName: string
  taskType: string
  platform: string
  dueTime: string
  status: 'Completed' | 'Pending'
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

// Remove mock tutorData and todayTasks declarations, replace with state-driven data

function getStatusBadge(status: DashboardTask['status']) {
  const map: Record<DashboardTask['status'], string> = {
    Completed:
      'bg-green-100 text-green-700 dark:bg-green-400/20 dark:text-green-300 dark:ring-1 dark:ring-green-400/30',
    Pending:
      'bg-amber-100 text-amber-700 dark:bg-amber-400/20 dark:text-amber-300 dark:ring-1 dark:ring-amber-400/30',
  }
  return <Badge className={`${map[status]} rounded-full font-normal`}>{status}</Badge>
}

function getPriorityAccent(priority: DeadlineItem['priority']) {
  switch (priority) {
    case 'high':
      return 'border-l-red-400 bg-red-50 dark:bg-red-950/20 dark:border-l-red-500'
    case 'medium':
      return 'border-l-amber-400 bg-amber-50 dark:bg-amber-950/20 dark:border-l-amber-500'
    case 'low':
      return 'border-l-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 dark:border-l-emerald-500'
    default:
      return 'border-l-gray-300 bg-gray-50 dark:bg-gray-900/20 dark:border-l-gray-600'
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
  const [dashboardTasks, setDashboardTasks] = useState<DashboardTask[]>([])
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<DeadlineItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const { getTutorDashboardData } = await import('@/server-actions/tutors-actions')
        const data = await getTutorDashboardData()
        if (!active || !data) return
        setStats(data.stats)
        setDashboardTasks(data.dashboardTasks)
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
    if (!dashboardTasks.length) return 0
    const completed = dashboardTasks.filter((t) => t.status === 'Completed').length
    return Math.round((completed / dashboardTasks.length) * 100)
  }, [dashboardTasks])

  const progressData = useMemo(
    () => [
      { name: 'Completed', value: stats?.completedTasks || 0, color: '#22c55e' },
      { name: 'Pending', value: stats?.pendingTasks || 0, color: '#f59e0b' },
    ],
    [stats?.completedTasks, stats?.pendingTasks],
  )

  const progressChartConfig = {
    Completed: { label: 'Completed', color: '#22c55e' },
    Pending: { label: 'Pending', color: '#f59e0b' },
  }

  return (
    <div className="flex-1 space-y-4 sm:space-y-6">
      {/* Welcome */}
      <Card className="rounded-xl sm:rounded-2xl shadow">
        <CardContent className="p-4 sm:p-6 flex flex-col gap-3 sm:gap-4">
          <div>
            <h2 className="font-bold mb-1 text-[clamp(1.1rem,4vw,1.75rem)]">
              {loading ? 'Loading...' : `Welcome back, ${stats?.userName || 'Tutor'}! 👋`}
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base">
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
        <Card className="lg:col-span-2 rounded-xl sm:rounded-2xl shadow-sm">
          <CardHeader className="pb-2 sm:pb-3 p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-[clamp(.9rem,2.5vw,1.05rem)] sm:text-lg">
                  Your Tasks
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {todayCompletionRate}% completed (
                  {dashboardTasks.filter((t) => t.status === 'Completed').length} of{' '}
                  {dashboardTasks.length})
                </CardDescription>
              </div>
              <Badge className="bg-primary/10 text-primary hover:bg-primary/20 rounded-full text-xs border-primary/20">
                {dashboardTasks.length} tasks
              </Badge>
            </div>
            <Progress value={todayCompletionRate} className="h-1.5 sm:h-2" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="space-y-2 sm:space-y-3">
              {loading && dashboardTasks.length === 0 && (
                <div className="space-y-2 sm:space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="border-l-4 border-transparent rounded-lg sm:rounded-xl bg-card border border-border/50 dark:border-border/20 p-0"
                    >
                      <div className="p-3 sm:p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 min-w-0">
                            <Skeleton className="h-3 w-20 rounded" />
                            <Skeleton className="h-4 w-10 rounded-full" />
                          </div>
                          <Skeleton className="h-4 w-16 rounded" />
                        </div>
                        <Skeleton className="h-3 w-40" />
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-3 w-24" />
                          <Skeleton className="h-4 w-12 rounded-full" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {!loading && dashboardTasks.length === 0 && (
                <div className="text-xs sm:text-sm opacity-60">No tasks assigned.</div>
              )}
              {!loading &&
                dashboardTasks.map((task) => (
                  <Card
                    key={task.id}
                    className="rounded-lg sm:rounded-xl shadow-sm border border-border/50 dark:border-border/20"
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
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Progress Chart */}
        <Card className="rounded-xl sm:rounded-2xl shadow-sm min-w-0">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-[clamp(.9rem,2.5vw,1.05rem)] sm:text-lg">Progress</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Completed vs Pending</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="flex items-center justify-center w-full">
              <div className="relative w-full flex items-center justify-center max-w-[240px] mx-auto">
                <ChartContainer
                  config={progressChartConfig}
                  className="h-[160px] w-[160px] xs:h-[180px] xs:w-[180px] sm:h-[220px] sm:w-[220px] flex items-center justify-center"
                >
                  <ProgressPie data={progressData} />
                </ChartContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-foreground">
                      {completionRate}%
                    </div>
                    <div className="text-[10px] sm:text-xs text-muted-foreground">Complete</div>
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
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-medium text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deadlines */}
      <Card className="rounded-xl sm:rounded-2xl shadow-sm">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-[clamp(.9rem,2.5vw,1.05rem)] sm:text-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary" /> Upcoming Deadlines
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Time-sensitive tasks</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {loading && upcomingDeadlines.length === 0 && (
              <>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="p-3 sm:p-4 rounded-lg sm:rounded-xl border-l-4 border-transparent flex flex-col gap-2 bg-card border border-border/50 dark:border-border/20"
                  >
                    <div className="flex items-center justify-between w-full">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-5 w-14 rounded-full" />
                    </div>
                    <Skeleton className="h-3 w-32" />
                  </div>
                ))}
              </>
            )}
            {!loading && upcomingDeadlines.length === 0 && (
              <div className="text-xs sm:text-sm opacity-60 col-span-full">
                No upcoming deadlines.
              </div>
            )}
            {!loading &&
              upcomingDeadlines.map((d) => (
                <div
                  key={d.id}
                  className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border-l-4 ${getPriorityAccent(d.priority)} flex flex-col gap-1 border border-border/50 dark:border-border/20`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-xs sm:text-sm truncate">{d.clientName}</span>
                    <Badge
                      className={`rounded-full text-[9px] sm:text-[10px] font-normal ${
                        d.hoursLeft < 24
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                          : d.hoursLeft < 48
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                      }`}
                    >
                      {getTimeUntil(d.hoursLeft)}
                    </Badge>
                  </div>
                  <div className="text-[10px] sm:text-xs opacity-70 truncate text-muted-foreground">
                    {d.courseName}
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
