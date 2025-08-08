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
    <div className="flex-1 space-y-6 p-6">
      {/* Welcome */}
      <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 text-white border-0 rounded-2xl shadow">
        <CardContent className="p-6 flex flex-col gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-1">Welcome back, {workerData.name}! 👋</h2>
            <p className="text-blue-100">
              You have {todayTasks.filter((t) => t.status !== 'Completed').length} tasks to work on
              today.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="flex items-center gap-1 text-green-50">
              <CheckCircle className="h-4 w-4" /> {workerData.completedTasks} Completed
            </span>
            <span className="flex items-center gap-1 text-amber-50">
              <Clock className="h-4 w-4" /> {workerData.pendingTasks} Pending
            </span>
            <span className="flex items-center gap-1 text-white">
              <AlertCircle className="h-4 w-4" /> {completionRate}% Overall Progress
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Tasks List */}
        <Card className="lg:col-span-2 rounded-2xl shadow-sm border-0 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg text-gray-800 dark:text-gray-100">
                  Today&apos;s Tasks
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  {todayCompletionRate}% completed (
                  {todayTasks.filter((t) => t.status === 'Completed').length} of {todayTasks.length}
                  )
                </CardDescription>
              </div>
              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 hover:bg-blue-100 rounded-full">
                {todayTasks.length} tasks
              </Badge>
            </div>
            <Progress value={todayCompletionRate} className="h-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayTasks.map((task) => (
                <Card
                  key={task.id}
                  className={`border-l-4 ${getPriorityAccent(task.priority)} rounded-xl shadow-sm dark:bg-slate-800/60`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-gray-800 dark:text-gray-100">
                          {task.clientName}
                        </span>
                        <Badge
                          variant="outline"
                          className="rounded-full text-xs dark:border-slate-600 dark:text-slate-300"
                        >
                          {task.platform}
                        </Badge>
                      </div>
                      {getStatusBadge(task.status)}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {task.courseName} - {task.taskType}
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Due: {task.dueTime}
                        </span>
                        <span>Est: {task.estimatedTime}</span>
                      </div>
                      <Badge
                        variant="outline"
                        className="rounded-full text-[10px] dark:border-slate-600 dark:text-slate-300"
                      >
                        {task.priority} priority
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Progress Chart */}
        <Card className="rounded-2xl shadow-sm border-0 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg text-gray-800 dark:text-gray-100">Progress</CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              Completed vs Pending
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <div className="relative">
                <ChartContainer
                  config={progressChartConfig}
                  className="h-[220px] w-[220px] flex items-center justify-center"
                >
                  <PieChart>
                    <Pie
                      data={progressData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={95}
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
                    <div className="text-2xl font-bold text-gray-800">{completionRate}%</div>
                    <div className="text-xs text-gray-500">Complete</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 mt-4">
              {progressData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
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
      <Card className="rounded-2xl shadow-sm border-0 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" /> Upcoming Deadlines
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Time-sensitive tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {upcomingDeadlines.map((d) => (
              <div
                key={d.id}
                className={`p-4 rounded-xl border-l-4 ${getPriorityAccent(d.priority)} flex flex-col gap-1 dark:bg-slate-800/60`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm text-gray-800 dark:text-gray-100 truncate">
                    {d.clientName}
                  </span>
                  <Badge
                    className={`rounded-full text-[10px] font-normal ${
                      d.hoursLeft < 24
                        ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300'
                        : d.hoursLeft < 48
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                    }`}
                  >
                    {getTimeUntil(d.hoursLeft)}
                  </Badge>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
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
