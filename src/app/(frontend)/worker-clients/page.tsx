"use client"

import { useState } from 'react'
import { Home, Users, Upload, Search, Eye, Clock, CheckCircle, AlertCircle, FileText, Calendar, User } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
} from "@/components/ui/sidebar"

const navigationItems = [
  {
    title: "Dashboard",
    url: "/worker-dashboard",
    icon: Home,
  },
  {
    title: "Assigned Clients",
    url: "/worker-clients",
    icon: Users,
    isActive: true,
  },
  {
    title: "Submit Task",
    url: "/submit-task",
    icon: Upload,
  },
]

// Mock assigned clients data
const assignedClients = [
  {
    id: "CL001",
    name: "John Smith",
    avatar: "/placeholder.svg?height=40&width=40",
    platform: "Cengage",
    courseName: "Calculus I",
    joinDate: "2024-01-15",
    tasks: {
      total: 8,
      completed: 5,
      inProgress: 2,
      pending: 1,
      overdue: 0
    },
    nextDeadline: "2024-02-15",
    priority: "medium",
    lastActivity: "2 hours ago"
  },
  {
    id: "CL002",
    name: "Emily Johnson",
    avatar: "/placeholder.svg?height=40&width=40",
    platform: "ALEKS",
    courseName: "Statistics",
    joinDate: "2024-01-20",
    tasks: {
      total: 6,
      completed: 6,
      inProgress: 0,
      pending: 0,
      overdue: 0
    },
    nextDeadline: null,
    priority: "low",
    lastActivity: "1 day ago"
  },
  {
    id: "CL003",
    name: "Sarah Davis",
    avatar: "/placeholder.svg?height=40&width=40",
    platform: "ALEKS",
    courseName: "Algebra",
    joinDate: "2024-01-10",
    tasks: {
      total: 12,
      completed: 7,
      inProgress: 3,
      pending: 1,
      overdue: 1
    },
    nextDeadline: "2024-02-08",
    priority: "high",
    lastActivity: "30 minutes ago"
  },
  {
    id: "CL004",
    name: "David Wilson",
    avatar: "/placeholder.svg?height=40&width=40",
    platform: "Cengage",
    courseName: "Chemistry",
    joinDate: "2024-01-25",
    tasks: {
      total: 4,
      completed: 2,
      inProgress: 2,
      pending: 0,
      overdue: 0
    },
    nextDeadline: "2024-02-12",
    priority: "medium",
    lastActivity: "4 hours ago"
  },
  {
    id: "CL005",
    name: "Jessica Miller",
    avatar: "/placeholder.svg?height=40&width=40",
    platform: "ALEKS",
    courseName: "Geometry",
    joinDate: "2024-02-01",
    tasks: {
      total: 10,
      completed: 4,
      inProgress: 4,
      pending: 2,
      overdue: 0
    },
    nextDeadline: "2024-02-18",
    priority: "medium",
    lastActivity: "1 hour ago"
  },
  {
    id: "CL006",
    name: "Michael Brown",
    avatar: "/placeholder.svg?height=40&width=40",
    platform: "Cengage",
    courseName: "Physics II",
    joinDate: "2024-01-05",
    tasks: {
      total: 15,
      completed: 8,
      inProgress: 3,
      pending: 2,
      overdue: 2
    },
    nextDeadline: "2024-02-09",
    priority: "high",
    lastActivity: "6 hours ago"
  }
]

// Mock detailed tasks for modal
const mockClientTasks = [
  {
    id: "TSK001",
    title: "Chapter 5 Quiz",
    type: "Quiz",
    status: "Completed",
    dueDate: "2024-02-05",
    score: 95,
    completedDate: "2024-02-04"
  },
  {
    id: "TSK002",
    title: "Homework Assignment 3",
    type: "Assignment",
    status: "In Progress",
    dueDate: "2024-02-15",
    score: null,
    completedDate: null
  },
  {
    id: "TSK003",
    title: "Midterm Preparation",
    type: "Course",
    status: "Pending",
    dueDate: "2024-02-20",
    score: null,
    completedDate: null
  }
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

function getPlatformBadge(platform: string) {
  return platform === "Cengage" 
    ? <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 rounded-full text-xs font-medium">Cengage</Badge>
    : <Badge className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:from-indigo-600 hover:to-indigo-700 rounded-full text-xs font-medium">ALEKS</Badge>
}

function getStatusChip(status: string, count: number) {
  if (count === 0) return null
  
  const configs = {
    completed: { color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle },
    inProgress: { color: "bg-blue-100 text-blue-700 border-blue-200", icon: Clock },
    pending: { color: "bg-orange-100 text-orange-700 border-orange-200", icon: AlertCircle },
    overdue: { color: "bg-red-100 text-red-700 border-red-200", icon: AlertCircle }
  }
  
  const config = configs[status as keyof typeof configs]
  const Icon = config.icon
  
  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}>
      <Icon className="h-3 w-3" />
      <span>{count}</span>
    </div>
  )
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case "high": return "border-l-red-400"
    case "medium": return "border-l-yellow-400"
    case "low": return "border-l-green-400"
    default: return "border-l-gray-400"
  }
}

function getTaskStatusBadge(status: string) {
  switch (status) {
    case "Completed":
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 rounded-full text-xs">Completed</Badge>
    case "In Progress":
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 rounded-full text-xs">In Progress</Badge>
    case "Pending":
      return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 rounded-full text-xs">Pending</Badge>
    default:
      return <Badge variant="secondary" className="rounded-full text-xs">{status}</Badge>
  }
}

export default function WorkerClientsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [platformFilter, setPlatformFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)

  // Filter clients based on search and filters
  const filteredClients = assignedClients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.courseName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesPlatform = platformFilter === "all" || client.platform === platformFilter
    const matchesPriority = priorityFilter === "all" || client.priority === priorityFilter
    
    return matchesSearch && matchesPlatform && matchesPriority
  })

  const handleViewTasks = (client: any) => {
    setSelectedClient(client)
    setIsTaskModalOpen(true)
  }

  const totalClients = assignedClients.length
  const activeClients = assignedClients.filter(c => c.tasks.inProgress > 0 || c.tasks.pending > 0).length
  const completedClients = assignedClients.filter(c => c.tasks.total === c.tasks.completed).length

  return (
    <SidebarProvider>
      <WorkerSidebar />
      <SidebarInset className="bg-gradient-to-br from-slate-50 to-blue-50/30">
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white/80 backdrop-blur-sm px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <div className="h-4 w-px bg-border" />
            <h1 className="text-lg font-semibold text-gray-800">Assigned Clients</h1>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>{totalClients} Total</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>{completedClients} Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span>{activeClients} Active</span>
            </div>
          </div>
        </header>

        <main className="flex-1 space-y-6 p-6">
          {/* Filters Section */}
          <Card className="rounded-2xl shadow-sm border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[250px]">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search clients or courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 rounded-xl border-gray-200 focus:border-blue-300 focus:ring-blue-200"
                  />
                </div>
                <Select value={platformFilter} onValueChange={setPlatformFilter}>
                  <SelectTrigger className="w-[140px] rounded-xl border-gray-200">
                    <SelectValue placeholder="Platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Platforms</SelectItem>
                    <SelectItem value="Cengage">Cengage</SelectItem>
                    <SelectItem value="ALEKS">ALEKS</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-[140px] rounded-xl border-gray-200">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Clients Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredClients.map((client) => (
              <Card key={client.id} className={`rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 ${getPriorityColor(client.priority)} bg-white/90 backdrop-blur-sm hover:scale-[1.02]`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 ring-2 ring-white shadow-md">
                        <AvatarImage src={client.avatar || "/placeholder.svg"} alt={client.name} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white font-semibold">
                          {client.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg text-gray-800">{client.name}</CardTitle>
                        <CardDescription className="text-gray-600 text-sm">
                          Joined {new Date(client.joinDate).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                    {getPlatformBadge(client.platform)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Course Info */}
                  <div className="p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-gray-800">{client.courseName}</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      Last activity: {client.lastActivity}
                    </div>
                  </div>

                  {/* Task Summary */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Task Summary</span>
                      <Badge variant="outline" className="rounded-full text-xs">
                        {client.tasks.total} total
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {getStatusChip("completed", client.tasks.completed)}
                      {getStatusChip("inProgress", client.tasks.inProgress)}
                      {getStatusChip("pending", client.tasks.pending)}
                      {getStatusChip("overdue", client.tasks.overdue)}
                    </div>
                  </div>

                  {/* Next Deadline */}
                  {client.nextDeadline && (
                    <div className="p-2 bg-orange-50 rounded-lg border border-orange-100">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-orange-600" />
                        <span className="text-orange-800 font-medium">
                          Next deadline: {new Date(client.nextDeadline).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <Button 
                    onClick={() => handleViewTasks(client)}
                    className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Tasks
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredClients.length === 0 && (
            <Card className="rounded-2xl shadow-sm border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">No clients found</h3>
                <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
              </CardContent>
            </Card>
          )}

          {/* Task Details Modal */}
          <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
            <DialogContent className="sm:max-w-[600px] rounded-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedClient?.avatar || "/placeholder.svg"} alt={selectedClient?.name} />
                    <AvatarFallback>
                      {selectedClient?.name.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-semibold">{selectedClient?.name}</div>
                    <div className="text-sm text-muted-foreground font-normal">
                      {selectedClient?.courseName}
                    </div>
                  </div>
                </DialogTitle>
                <DialogDescription>
                  View all tasks for this client and their current status.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {mockClientTasks.map((task) => (
                  <Card key={task.id} className="rounded-xl shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{task.title}</span>
                          <Badge variant="outline" className="rounded-full text-xs">
                            {task.type}
                          </Badge>
                        </div>
                        {getTaskStatusBadge(task.status)}
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                        {task.score && (
                          <span className="font-medium text-green-600">Score: {task.score}%</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
