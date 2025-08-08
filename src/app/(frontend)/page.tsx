'use client'

import {
  Bell,
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  Home,
  Users,
  UserCheck,
  AlertTriangle,
} from 'lucide-react'
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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts'

const navigationItems = [
  {
    title: 'Dashboard',
    url: '#',
    icon: Home,
    isActive: true,
  },
  {
    title: 'Clients',
    url: '#',
    icon: Users,
  },
  {
    title: 'Workers',
    url: '#',
    icon: UserCheck,
  },
  {
    title: 'Tasks',
    url: '#',
    icon: FileText,
  },
  {
    title: 'Reports',
    url: '#',
    icon: BarChart3,
  },
]

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

function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FileText className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">Sarh Task Hub</span>
            <span className="text-xs text-muted-foreground">Admin Dashboard</span>
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
                    <a href={item.url}>
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

export default function Dashboard() {
  const unreadCount = notifications.length

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <div className="h-4 w-px bg-border" />
            <h1 className="text-lg font-semibold">Dashboard</h1>
          </div>
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.map((notification) => (
                  <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-4">
                    <div className="flex items-center gap-2 w-full">
                      {notification.type === 'urgent' && (
                        <Clock className="h-4 w-4 text-orange-500" />
                      )}
                      {notification.type === 'warning' && (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      )}
                      {notification.type === 'error' && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-sm">{notification.title}</p>
                        <p className="text-xs text-muted-foreground">{notification.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 space-y-6 p-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,247</div>
                <p className="text-xs text-muted-foreground">+12% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">38</div>
                <p className="text-xs text-muted-foreground">-5% from yesterday</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Tasks</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">93</div>
                <p className="text-xs text-muted-foreground">+18% from yesterday</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Deadlines This Week</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24</div>
                <p className="text-xs text-muted-foreground">8 due today</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Task Completion Overview</CardTitle>
                <CardDescription>Daily task completion vs pending tasks this week</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={taskData}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="completed" fill="var(--color-completed)" />
                      <Bar dataKey="pending" fill="var(--color-pending)" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Client Distribution</CardTitle>
                <CardDescription>Active vs inactive clients</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={clientDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {clientDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-4">
                  {clientDistribution.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-muted-foreground">
                        {item.name} ({item.value}%)
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates from your task hub</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      Task &quot;Website Redesign&quot; completed by John Doe
                    </p>
                    <p className="text-xs text-muted-foreground">2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      New client &quot;Acme Corp&quot; assigned to Sarah Wilson
                    </p>
                    <p className="text-xs text-muted-foreground">15 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 bg-orange-500 rounded-full" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      Task &quot;Mobile App Testing&quot; deadline approaching
                    </p>
                    <p className="text-xs text-muted-foreground">1 hour ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      Weekly report generated and sent to stakeholders
                    </p>
                    <p className="text-xs text-muted-foreground">3 hours ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
