'use client'

import { useState } from 'react'
import {
  Home,
  Users,
  Upload,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  FileText,
  TrendingUp,
  User,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts'

const navigationItems = [
  {
    title: 'Dashboard',
    url: '/worker-dashboard',
    icon: Home,
    isActive: true,
  },
  {
    title: 'Assigned Clients',
    url: '/worker-clients',
    icon: Users,
  },
  {
    title: 'Submit Task',
    url: '/submit-task',
    icon: Upload,
  },
]

// Mock worker data
const workerData = {
  name: 'Sarah Wilson',
  avatar: '/placeholder.svg?height=40&width=40',
  role: 'Senior Academic Assistant',
  totalTasks: 15,
  completedTasks: 8,
  pendingTasks: 7,
  todayTasks: 4,
  weeklyGoal: 12,
  performanceScore: 92,
}

// Mock today's tasks
const todayTasks = [
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
    estimatedTime: '1.5 hours',
  },
  {
    id: 'TSK007',
    clientName: 'Mike Johnson',
    courseName: 'Statistics',
    taskType: 'Quiz',
    platform: 'ALEKS',
    dueTime: '6:00 PM',
    status: 'Pending',
    priority: 'low',
    estimatedTime: '30 min',
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
    estimatedTime: '2 hours',
  },
]

// Mock upcoming deadlines
const upcomingDeadlines = [
  {
    id: 'TSK010',
    clientName: 'Alex Thompson',
    courseName: 'Chemistry',
    dueDate: '2024-02-08',
    hoursLeft: 18,
    priority: 'high',
  },
  {
    id: 'TSK011',
    clientName: 'Lisa Rodriguez',
    courseName: 'Biology',
    dueDate: '2024-02-09',
    hoursLeft: 42,
    priority: 'medium',
  },
  {
    id: 'TSK012',
    clientName: 'David Wilson',
    courseName: 'Geometry',
    dueDate: '2024-02-10',
    hoursLeft: 66,
    priority: 'low',
  },
]

// Chart data
const progressData = [
  { name: 'Completed', value: workerData.completedTasks, color: '#10b981' },
  { name: 'Pending', value: workerData.pendingTasks, color: '#f59e0b' },
]

const weeklyProgressData = [
  { day: 'Mon', completed: 2, target: 2 },
  { day: 'Tue', completed: 1, target: 2 },
  { day: 'Wed', completed: 3, target: 2 },
  { day: 'Thu', completed: 2, target: 2 },
  { day: 'Fri', completed: 0, target: 2 },
  { day: 'Sat', completed: 0, target: 1 },
  { day: 'Sun', completed: 0, target: 1 },
]

function WorkerSidebar() {
  return (
    <Sidebar className="border-r-0">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
            <FileText className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">Sarh Task Hub</span>
            <span className="text-xs text-muted-foreground">Worker Portal</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={item.isActive}>
                    <a href={item.url} className="rounded-lg">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'Completed':
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 rounded-full">
          Completed
        </Badge>
      )
    case 'In Progress':
      return (
        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 rounded-full">
          In Progress
        </Badge>
      )
    case 'Pending':
      return (
        <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 rounded-full">
          Pending
        </Badge>
      )
    default:
      return (
        <Badge variant="secondary" className="rounded-full">
          {status}
        </Badge>
      )
  }
}

function getPlatformBadge(platform: string) {
  return platform === 'Cengage' ? (
    <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 rounded-full text-xs">
      Cengage
    </Badge>
  ) : (
    <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100 rounded-full text-xs">
      ALEKS
    </Badge>
  )
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'high':
      return 'border-l-red-400 bg-red-50'
    case 'medium':
      return 'border-l-yellow-400 bg-yellow-50'
    case 'low':
      return 'border-l-green-400 bg-green-50'
    default:
      return 'border-l-gray-400 bg-gray-50'
  }
}

function getTimeUntilDeadline(hoursLeft: number) {
  if (hoursLeft < 24) {
    return `${hoursLeft}h left`
  } else {
    const days = Math.floor(hoursLeft / 24)
    return `${days}d left`
  }
}

export default function WorkerDashboard() {
  const completionRate = Math.round((workerData.completedTasks / workerData.totalTasks) * 100)
  const todayCompletionRate = Math.round(
    (todayTasks.filter((t) => t.status === 'Completed').length / todayTasks.length) * 100,
  )

  return (
    <SidebarProvider>
      <WorkerSidebar />
      <SidebarInset className="bg-gradient-to-br from-slate-50 to-blue-50/30">
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white/80 backdrop-blur-sm px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <div className="h-4 w-px bg-border" />
            <h1 className="text-lg font-semibold text-gray-800">Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={workerData.avatar || '/placeholder.svg'} alt={workerData.name} />
              <AvatarFallback>
                {workerData.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <div className="font-medium text-gray-800">{workerData.name}</div>
              <div className="text-gray-500 text-xs">{workerData.role}</div>
            </div>
          </div>
        </header>

        <main className="flex-1 space-y-6 p-6">
          {/* Welcome Section */}
          <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 rounded-2xl shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Welcome back, {workerData.name}! 👋</h2>
                  <p className="text-blue-100 mb-4">
                    You have {todayTasks.filter((t) => t.status !== 'Completed').length} tasks to
                    complete today
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>{workerData.completedTasks} Completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{workerData.pendingTasks} Pending</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      <span>{workerData.performanceScore}% Performance</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{completionRate}%</div>
                  <div className="text-blue-100 text-sm">Overall Progress</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Today's Tasks */}
            <Card className="lg:col-span-2 rounded-2xl shadow-sm border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg text-gray-800">Today&apos;s Tasks</CardTitle>
                    <CardDescription className="text-gray-600">
                      {todayCompletionRate}% completed (
                      {todayTasks.filter((t) => t.status === 'Completed').length} of{' '}
                      {todayTasks.length})
                    </CardDescription>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 rounded-full">
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
                      className={`border-l-4 ${getPriorityColor(task.priority)} rounded-xl shadow-sm`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-gray-800">
                              {task.clientName}
                            </span>
                            {getPlatformBadge(task.platform)}
                          </div>
                          {getStatusBadge(task.status)}
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          {task.courseName} - {task.taskType}
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Due: {task.dueTime}
                            </span>
                            <span>Est: {task.estimatedTime}</span>
                          </div>
                          <Badge variant="outline" className="rounded-full text-xs">
                            {task.priority} priority
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Deadline Countdown */}
            <Card className="rounded-2xl shadow-sm border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  Upcoming Deadlines
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Tasks requiring attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingDeadlines.map((deadline) => (
                    <div
                      key={deadline.id}
                      className="p-3 rounded-xl bg-gradient-to-r from-orange-50 to-red-50 border border-orange-100"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm text-gray-800">
                          {deadline.clientName}
                        </span>
                        <Badge
                          className={`rounded-full text-xs ${
                            deadline.hoursLeft < 24
                              ? 'bg-red-100 text-red-700'
                              : deadline.hoursLeft < 48
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {getTimeUntilDeadline(deadline.hoursLeft)}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600">{deadline.courseName}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Progress Chart */}
            <Card className="rounded-2xl shadow-sm border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg text-gray-800">Task Progress</CardTitle>
                <CardDescription className="text-gray-600">
                  Current task distribution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center">
                  <div className="relative">
                    <ResponsiveContainer width={200} height={200}>
                      <PieChart>
                        <Pie
                          data={progressData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {progressData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-800">{completionRate}%</div>
                        <div className="text-xs text-gray-500">Complete</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center gap-6 mt-4">
                  {progressData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-gray-600">
                        {item.name} ({item.value})
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Weekly Progress */}
            <Card className="rounded-2xl shadow-sm border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg text-gray-800">Weekly Progress</CardTitle>
                <CardDescription className="text-gray-600">
                  Daily completion vs target
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={weeklyProgressData}>
                    <XAxis dataKey="day" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="target" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-sm text-gray-600">Completed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-300" />
                    <span className="text-sm text-gray-600">Target</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
