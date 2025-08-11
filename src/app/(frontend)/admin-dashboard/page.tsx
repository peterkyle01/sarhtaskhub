'use client'

import { Bell, Calendar, CheckCircle, Clock, Users, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const notifications = [
  {
    id: 1,
    type: 'warning',
    title: 'Unassigned Clients',
    description: '3 new clients need worker assignment',
    time: '2 hours ago',
  },
  {
    id: 2,
    type: 'urgent',
    title: 'Upcoming Deadlines',
    description: '5 tasks due within 24 hours',
    time: '4 hours ago',
  },
  {
    id: 3,
    type: 'error',
    title: 'Late Submissions',
    description: '2 tasks are overdue',
    time: '1 day ago',
  },
]

const taskData = [
  { name: 'Mon', completed: 12, pending: 8 },
  { name: 'Tue', completed: 15, pending: 6 },
  { name: 'Wed', completed: 18, pending: 9 },
  { name: 'Thu', completed: 14, pending: 7 },
  { name: 'Fri', completed: 20, pending: 5 },
  { name: 'Sat', completed: 8, pending: 3 },
  { name: 'Sun', completed: 6, pending: 2 },
]

const clientDistribution = [
  { name: 'Active', value: 65, color: '#10b981' },
  { name: 'Inactive', value: 25, color: '#f59e0b' },
  { name: 'New', value: 10, color: '#3b82f6' },
]

const chartConfig = {
  completed: {
    label: 'Completed',
    color: '#10b981',
  },
  pending: {
    label: 'Pending',
    color: '#f59e0b',
  },
}

export default function AdminDashboardPage() {
  const unreadCount = notifications.length

  return (
    <div className="flex-1 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg sm:text-xl font-semibold">Dashboard</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="relative h-8 w-8 sm:h-10 sm:w-10">
              <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full p-0 text-[10px] sm:text-xs">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 sm:w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="flex flex-col items-start p-3 sm:p-4"
              >
                <div className="flex items-center gap-2 w-full">
                  {notification.type === 'urgent' && (
                    <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500" />
                  )}
                  {notification.type === 'warning' && (
                    <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-500" />
                  )}
                  {notification.type === 'error' && (
                    <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-xs sm:text-sm">{notification.title}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      {notification.description}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                      {notification.time}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-[var(--card)] border border-[var(--border)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">1,247</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        <Card className="bg-[var(--card)] border border-[var(--border)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Pending Tasks</CardTitle>
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">38</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">-5% from yesterday</p>
          </CardContent>
        </Card>
        <Card className="bg-[var(--card)] border border-[var(--border)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Completed Tasks</CardTitle>
            <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">93</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">+18% from yesterday</p>
          </CardContent>
        </Card>
        <Card className="bg-[var(--card)] border border-[var(--border)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Deadlines This Week</CardTitle>
            <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">24</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">8 due today</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 bg-[var(--card)] border border-[var(--border)] overflow-hidden">
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">Task Completion Overview</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Daily task completion vs pending tasks this week
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <div className="w-full overflow-x-auto">
              <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px] min-w-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={taskData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <XAxis
                      dataKey="name"
                      fontSize={12}
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      fontSize={12}
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      width={30}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="completed" fill="var(--color-completed)" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="pending" fill="var(--color-pending)" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[var(--card)] border border-[var(--border)] overflow-hidden">
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">Client Distribution</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Active vs inactive clients
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <div className="w-full flex justify-center">
              <ChartContainer
                config={{}}
                className="h-[200px] sm:h-[250px] lg:h-[300px] w-full max-w-[280px] sm:max-w-none"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={clientDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={60}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {clientDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
            <div className="flex justify-center gap-2 sm:gap-4 mt-3 sm:mt-4 flex-wrap">
              {clientDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-1 sm:gap-2">
                  <div
                    className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-[10px] sm:text-sm text-muted-foreground">
                    {item.name} ({item.value}%)
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <Card className="bg-[var(--card)] border border-[var(--border)]">
        <CardHeader>
          <CardTitle className="text-sm sm:text-base">Recent Activity</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Latest updates from your task hub
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium">
                  Task &quot;Website Redesign&quot; completed by John Doe
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium">
                  New client &quot;Acme Corp&quot; assigned to Sarah Wilson
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">15 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium">
                  Task &quot;Mobile App Testing&quot; deadline approaching
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">1 hour ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium">
                  Weekly report generated and sent to stakeholders
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">3 hours ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
