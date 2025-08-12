"use client"

// client dashboard component
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

interface DashboardProps {
  stats: {
    totalClients: number
    pendingTasks: number
    completedTasks: number
    dueThisWeek: number
    dueToday: number
  }
  notifications: Array<{
    id: string
    type: 'warning' | 'urgent' | 'error'
    title: string
    description: string
    time: string
  }>
  taskChart: Array<{ name: string; completed: number; pending: number }>
  clientDistribution: Array<{ name: string; value: number; color: string }>
  recentActivity: Array<{
    id: string
    color: string
    message: string
    time: string
  }>
}

const chartConfig = {
  completed: { label: 'Completed', color: '#10b981' },
  pending: { label: 'Pending', color: '#f59e0b' },
}

export default function DashboardClient({
  stats,
  notifications,
  taskChart,
  clientDistribution,
  recentActivity,
}: DashboardProps) {
  const unreadCount = notifications.length

  return (
    <div className="flex-1 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-semibold text-[clamp(.95rem,2.5vw,1.1rem)] sm:text-lg">Dashboard</h1>
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
            {notifications.map((n) => (
              <DropdownMenuItem key={n.id} className="flex flex-col items-start p-3 sm:p-4">
                <div className="flex items-center gap-2 w-full">
                  {n.type === 'urgent' && (
                    <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500" />
                  )}
                  {n.type === 'warning' && (
                    <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-500" />
                  )}
                  {n.type === 'error' && (
                    <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-xs sm:text-sm">{n.title}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">{n.description}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{n.time}</p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
  <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
        <Card className="bg-[var(--card)] border border-[var(--border)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{stats.totalClients}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Active in system</p>
          </CardContent>
        </Card>
        <Card className="bg-[var(--card)] border border-[var(--border)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Pending Tasks</CardTitle>
            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{stats.pendingTasks}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Awaiting completion</p>
          </CardContent>
        </Card>
        <Card className="bg-[var(--card)] border border-[var(--border)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Completed Tasks</CardTitle>
            <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{stats.completedTasks}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
        <Card className="bg-[var(--card)] border border-[var(--border)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Deadlines This Week</CardTitle>
            <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg sm:text-2xl font-bold">{stats.dueThisWeek}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">{stats.dueToday} due today</p>
          </CardContent>
        </Card>
      </div>
  <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 bg-[var(--card)] border border-[var(--border)] overflow-hidden">
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">Task Completion Overview</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Daily task completion vs pending tasks this week</CardDescription>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <div className="w-full overflow-x-auto">
              <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px] min-w-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={taskChart} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <XAxis dataKey="name" fontSize={12} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis fontSize={12} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} width={30} />
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
            <CardDescription className="text-xs sm:text-sm">Active vs inactive clients</CardDescription>
          </CardHeader>
          <CardContent className="overflow-hidden">
            <div className="w-full flex justify-center">
              <ChartContainer config={{}} className="h-[200px] sm:h-[250px] lg:h-[300px] w-full max-w-[280px] sm:max-w-none">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={clientDistribution} cx="50%" cy="50%" innerRadius={30} outerRadius={60} paddingAngle={2} dataKey="value">
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
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full" style={{ backgroundColor: item.color }} />
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
          <CardDescription className="text-xs sm:text-sm">Latest updates from your task hub</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 sm:space-y-4">
            {recentActivity.map((a) => (
              <div key={a.id} className="flex items-center gap-3 sm:gap-4">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${a.color}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium">{a.message}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
