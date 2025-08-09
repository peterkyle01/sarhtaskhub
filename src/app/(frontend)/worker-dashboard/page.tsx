'use client'

import { useMemo } from 'react'
import { Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { PieChart, Pie, Cell } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

// Types
interface Task {
  id: string
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
  id: string
  clientName: string
  courseName: string
  dueDate: string // ISO
  hoursLeft: number
  priority: 'high' | 'medium' | 'low'
}

// Mock contextual data (replace with real data fetch later)
const workerData = {
  name: 'Sarah Wilson',
  avatar: '/placeholder.svg?height=40&width=40',
  role: 'Worker',
  totalTasks: 15,
  completedTasks: 8,
  pendingTasks: 7,
}

const todayTasks: Task[] = [
  {
    id: 'TSK001',
    clientName: 'John Smith',
    courseName: 'Calculus I',
    taskType: 'Quiz',
    platform: 'Cengage',
    dueTime: '2:00 PM',
    status: 'In Progress',
    priority: 'high',
    estimatedTime: '45 min',
  },
  {
    id: 'TSK004',
    clientName: 'Sarah Davis',
    courseName: 'Algebra',
    taskType: 'Assignment',
    platform: 'ALEKS',
    dueTime: '4:30 PM',
    status: 'Pending',
    priority: 'medium',
    estimatedTime: '1.5 h',
  },
  {
    id: 'TSK009',
    clientName: 'Emma Brown',
    courseName: 'Physics II',
    taskType: 'Course',
    platform: 'Cengage',
    dueTime: '11:59 PM',
    status: 'Completed',
    priority: 'medium',
    estimatedTime: '2 h',
  },
]

const upcomingDeadlines: DeadlineItem[] = [
  {
    id: 'DL010',
    clientName: 'Alex Thompson',
    courseName: 'Chemistry',
    dueDate: '2025-08-09',
    hoursLeft: 18,
    priority: 'high',
  },
  {
    id: 'DL011',
    clientName: 'Lisa Rodriguez',
    courseName: 'Biology',
    dueDate: '2025-08-10',
    hoursLeft: 42,
    priority: 'medium',
  },
  {
    id: 'DL012',
    clientName: 'David Wilson',
    courseName: 'Geometry',
    dueDate: '2025-08-11',
    hoursLeft: 66,
    priority: 'low',
  },
]

function getStatusBadge(status: Task['status']) {
  const map: Record<Task['status'], string> = {
    Completed: 'bg-green-100 text-green-700',
    'In Progress': 'bg-sky-100 text-sky-700',
    Pending: 'bg-amber-100 text-amber-700',
  }
  return <Badge className={`${map[status]} rounded-full font-normal`}>{status}</Badge>
}

function getPriorityAccent(priority: Task['priority'] | DeadlineItem['priority']) {
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

export default function WorkerDashboard() {
  const completionRate = useMemo(
    () => Math.round((workerData.completedTasks / workerData.totalTasks) * 100),
    [],
  )
  const todayCompletionRate = useMemo(
    () =>
      Math.round(
        (todayTasks.filter((t) => t.status === 'Completed').length / todayTasks.length) * 100,
      ),
    [],
  )

  const progressData = useMemo(
    () => [
      { name: 'Completed', value: workerData.completedTasks, color: '#10b981' },
      { name: 'Pending', value: workerData.pendingTasks, color: '#f59e0b' },
    ],
    [],
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
              Welcome back, {workerData.name}! 👋
            </h2>
            <p className="opacity-80 text-sm sm:text-base">
              You have {todayTasks.filter((t) => t.status !== 'Completed').length} tasks to work on
              today.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm">
            <span className="flex items-center gap-1 opacity-90">
              <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> {workerData.completedTasks}{' '}
              Completed
            </span>
            <span className="flex items-center gap-1 opacity-90">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> {workerData.pendingTasks} Pending
            </span>
            <span className="flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> {completionRate}% Overall
              Progress
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
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
                        <span className="hidden sm:inline">Est: {task.estimatedTime}</span>
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
        <Card className="rounded-xl sm:rounded-2xl shadow-sm border border-[var(--border)] bg-[var(--card)]">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Progress</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Completed vs Pending</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="flex items-center justify-center">
              <div className="relative">
                <ChartContainer
                  config={progressChartConfig}
                  className="h-[180px] w-[180px] sm:h-[220px] sm:w-[220px] flex items-center justify-center"
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
