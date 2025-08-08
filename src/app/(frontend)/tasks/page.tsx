"use client"

import { useState } from 'react'
import { Search, Plus, Edit, UserPlus, Clock, Users, UserCheck, FileText, Home, BarChart3, ChevronLeft, ChevronRight, Calendar, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
    url: "/",
    icon: Home,
  },
  {
    title: "Clients",
    url: "/clients",
    icon: Users,
  },
  {
    title: "Workers",
    url: "/workers",
    icon: UserCheck,
  },
  {
    title: "Tasks",
    url: "/tasks",
    icon: FileText,
    isActive: true,
  },
  {
    title: "Reports",
    url: "/reports",
    icon: BarChart3,
  },
]

// Mock task data
const mockTasks = [
  {
    id: "TSK001",
    clientName: "John Smith",
    platform: "Cengage",
    taskType: "Quiz",
    dueDate: "2024-02-15",
    status: "In Progress",
    assignedWorker: "Sarah Wilson",
    score: null,
    notes: "Chapter 5 calculus quiz - needs completion by Friday",
  },
  {
    id: "TSK002",
    clientName: "Emily Johnson",
    platform: "ALEKS",
    taskType: "Assignment",
    dueDate: "2024-02-10",
    status: "Completed",
    assignedWorker: "Mike Chen",
    score: 95,
    notes: "Statistics homework completed successfully",
  },
  {
    id: "TSK003",
    clientName: "Michael Brown",
    platform: "Cengage",
    taskType: "Course",
    dueDate: "2024-02-08",
    status: "Pending",
    assignedWorker: null,
    score: null,
    notes: "Full physics course - urgent assignment needed",
  },
  {
    id: "TSK004",
    clientName: "Sarah Davis",
    platform: "ALEKS",
    taskType: "Quiz",
    dueDate: "2024-02-20",
    status: "In Progress",
    assignedWorker: "John Doe",
    score: null,
    notes: "Algebra fundamentals quiz",
  },
  {
    id: "TSK005",
    clientName: "David Wilson",
    platform: "Cengage",
    taskType: "Assignment",
    dueDate: "2024-02-12",
    status: "Completed",
    assignedWorker: "Lisa Rodriguez",
    score: 88,
    notes: "Chemistry lab report submitted",
  },
  {
    id: "TSK006",
    clientName: "Jessica Miller",
    platform: "ALEKS",
    taskType: "Course",
    dueDate: "2024-02-18",
    status: "In Progress",
    assignedWorker: "Sarah Wilson",
    score: null,
    notes: "Geometry course - 60% complete",
  },
]

const clients = ["John Smith", "Emily Johnson", "Michael Brown", "Sarah Davis", "David Wilson", "Jessica Miller"]
const workers = ["Sarah Wilson", "Mike Chen", "Lisa Rodriguez", "John Doe", "Alex Thompson"]
const platforms = ["Cengage", "ALEKS"]
const taskTypes = ["Quiz", "Assignment", "Course"]
const statuses = ["Pending", "In Progress", "Completed"]

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

function getStatusBadge(status: string) {
  switch (status) {
    case "Completed":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs">Completed</Badge>
    case "In Progress":
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 text-xs">In Progress</Badge>
    case "Pending":
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 text-xs">Pending</Badge>
    default:
      return <Badge variant="secondary" className="text-xs">{status}</Badge>
  }
}

function getPlatformBadge(platform: string) {
  return platform === "Cengage" 
    ? <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 text-xs">Cengage</Badge>
    : <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 text-xs">ALEKS</Badge>
}

function getTaskTypeBadge(taskType: string) {
  const colors = {
    Quiz: "bg-cyan-100 text-cyan-800",
    Assignment: "bg-indigo-100 text-indigo-800",
    Course: "bg-pink-100 text-pink-800"
  }
  return <Badge className={`${colors[taskType as keyof typeof colors]} hover:${colors[taskType as keyof typeof colors]} text-xs`}>{taskType}</Badge>
}

function getDueDateStatus(dueDate: string) {
  const today = new Date()
  const due = new Date(dueDate)
  const diffTime = due.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return { status: "overdue", color: "text-red-600" }
  if (diffDays <= 1) return { status: "due-today", color: "text-orange-600" }
  if (diffDays <= 3) return { status: "due-soon", color: "text-yellow-600" }
  return { status: "normal", color: "text-muted-foreground" }
}

export default function TasksPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [platformFilter, setPlatformFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [isUpdateStatusModalOpen, setIsUpdateStatusModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [newTask, setNewTask] = useState({
    clientName: "",
    platform: "",
    taskType: "",
    dueDate: "",
    assignedWorker: "",
    notes: ""
  })
  const [assignTask, setAssignTask] = useState({
    taskId: "",
    worker: ""
  })
  const [updateStatus, setUpdateStatus] = useState({
    taskId: "",
    status: "",
    score: "",
    notes: ""
  })

  const itemsPerPage = 8

  // Filter tasks based on search term and filters
  const filteredTasks = mockTasks.filter(task => {
    const matchesSearch = task.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.assignedWorker?.toLowerCase().includes(searchTerm.toLowerCase() || "")
    
    const matchesStatus = statusFilter === "all" || task.status === statusFilter
    const matchesPlatform = platformFilter === "all" || task.platform === platformFilter
    
    return matchesSearch && matchesStatus && matchesPlatform
  })

  // Pagination
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedTasks = filteredTasks.slice(startIndex, startIndex + itemsPerPage)

  const handleAddTask = () => {
    console.log("Adding task:", newTask)
    setIsAddModalOpen(false)
    setNewTask({
      clientName: "",
      platform: "",
      taskType: "",
      dueDate: "",
      assignedWorker: "",
      notes: ""
    })
  }

  const handleAssignTask = () => {
    console.log("Assigning task:", assignTask)
    setIsAssignModalOpen(false)
    setAssignTask({ taskId: "", worker: "" })
  }

  const handleUpdateStatus = () => {
    console.log("Updating status:", updateStatus)
    setIsUpdateStatusModalOpen(false)
    setUpdateStatus({ taskId: "", status: "", score: "", notes: "" })
  }

  const openAssignModal = (task: any) => {
    setSelectedTask(task)
    setAssignTask({ taskId: task.id, worker: task.assignedWorker || "" })
    setIsAssignModalOpen(true)
  }

  const openUpdateStatusModal = (task: any) => {
    setSelectedTask(task)
    setUpdateStatus({ 
      taskId: task.id, 
      status: task.status, 
      score: task.score?.toString() || "", 
      notes: task.notes 
    })
    setIsUpdateStatusModalOpen(true)
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between border-b px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <div className="h-4 w-px bg-border" />
            <h1 className="text-lg font-semibold">Task Management</h1>
          </div>
        </header>

        <main className="flex-1 space-y-6 p-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tasks</CardTitle>
                  <CardDescription>
                    Manage and track all tasks across your platform
                  </CardDescription>
                </div>
                <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Task
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Add New Task</DialogTitle>
                      <DialogDescription>
                        Create a new task and assign it to a client and worker.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="client">Client Name</Label>
                          <Select value={newTask.clientName} onValueChange={(value) => setNewTask({...newTask, clientName: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select client" />
                            </SelectTrigger>
                            <SelectContent>
                              {clients.map((client) => (
                                <SelectItem key={client} value={client}>{client}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="platform">Platform</Label>
                          <Select value={newTask.platform} onValueChange={(value) => setNewTask({...newTask, platform: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select platform" />
                            </SelectTrigger>
                            <SelectContent>
                              {platforms.map((platform) => (
                                <SelectItem key={platform} value={platform}>{platform}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="taskType">Task Type</Label>
                          <Select value={newTask.taskType} onValueChange={(value) => setNewTask({...newTask, taskType: value})}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              {taskTypes.map((type) => (
                                <SelectItem key={type} value={type}>{type}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="dueDate">Due Date</Label>
                          <Input
                            id="dueDate"
                            type="date"
                            value={newTask.dueDate}
                            onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="worker">Assigned Worker</Label>
                        <Select value={newTask.assignedWorker} onValueChange={(value) => setNewTask({...newTask, assignedWorker: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select worker (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            {workers.map((worker) => (
                              <SelectItem key={worker} value={worker}>{worker}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          value={newTask.notes}
                          onChange={(e) => setNewTask({...newTask, notes: e.target.value})}
                          placeholder="Task description and requirements..."
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" onClick={handleAddTask}>Add Task</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search and Filters */}
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tasks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {statuses.map((status) => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={platformFilter} onValueChange={setPlatformFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Platforms</SelectItem>
                    {platforms.map((platform) => (
                      <SelectItem key={platform} value={platform}>{platform}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Compact Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="h-10">
                      <TableHead className="py-2">Task ID</TableHead>
                      <TableHead className="py-2">Client</TableHead>
                      <TableHead className="py-2">Platform</TableHead>
                      <TableHead className="py-2">Type</TableHead>
                      <TableHead className="py-2">Due Date</TableHead>
                      <TableHead className="py-2">Status</TableHead>
                      <TableHead className="py-2">Worker</TableHead>
                      <TableHead className="py-2">Score</TableHead>
                      <TableHead className="py-2 max-w-[200px]">Notes</TableHead>
                      <TableHead className="py-2 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTasks.map((task) => {
                      const dueDateStatus = getDueDateStatus(task.dueDate)
                      return (
                        <TableRow key={task.id} className="h-12">
                          <TableCell className="py-2 font-medium text-sm">{task.id}</TableCell>
                          <TableCell className="py-2 text-sm">{task.clientName}</TableCell>
                          <TableCell className="py-2">{getPlatformBadge(task.platform)}</TableCell>
                          <TableCell className="py-2">{getTaskTypeBadge(task.taskType)}</TableCell>
                          <TableCell className="py-2">
                            <div className="flex flex-col">
                              <span className={`text-sm ${dueDateStatus.color}`}>
                                {new Date(task.dueDate).toLocaleDateString()}
                              </span>
                              {dueDateStatus.status === "overdue" && (
                                <span className="text-xs text-red-600 flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  Overdue
                                </span>
                              )}
                              {dueDateStatus.status === "due-today" && (
                                <span className="text-xs text-orange-600 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Due today
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-2">{getStatusBadge(task.status)}</TableCell>
                          <TableCell className="py-2 text-sm">
                            {task.assignedWorker || (
                              <span className="text-muted-foreground italic">Unassigned</span>
                            )}
                          </TableCell>
                          <TableCell className="py-2 text-sm">
                            {task.score ? (
                              <Badge variant="outline" className="text-xs">
                                {task.score}%
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="py-2 text-xs text-muted-foreground max-w-[200px] truncate">
                            {task.notes}
                          </TableCell>
                          <TableCell className="py-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => openAssignModal(task)}
                                className="h-8 px-2"
                              >
                                <UserPlus className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => openUpdateStatusModal(task)}
                                className="h-8 px-2"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredTasks.length)} of {filteredTasks.length} tasks
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assign Task Modal */}
          <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Assign Task</DialogTitle>
                <DialogDescription>
                  Assign task {selectedTask?.id} to a worker.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="worker">Select Worker</Label>
                  <Select value={assignTask.worker} onValueChange={(value) => setAssignTask({...assignTask, worker: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a worker" />
                    </SelectTrigger>
                    <SelectContent>
                      {workers.map((worker) => (
                        <SelectItem key={worker} value={worker}>{worker}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleAssignTask}>Assign Task</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Update Status Modal */}
          <Dialog open={isUpdateStatusModalOpen} onOpenChange={setIsUpdateStatusModalOpen}>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Update Task Status</DialogTitle>
                <DialogDescription>
                  Update the status and details for task {selectedTask?.id}.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={updateStatus.status} onValueChange={(value) => setUpdateStatus({...updateStatus, status: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((status) => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="score">Score (if completed)</Label>
                  <Input
                    id="score"
                    type="number"
                    min="0"
                    max="100"
                    value={updateStatus.score}
                    onChange={(e) => setUpdateStatus({...updateStatus, score: e.target.value})}
                    placeholder="Enter score (0-100)"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={updateStatus.notes}
                    onChange={(e) => setUpdateStatus({...updateStatus, notes: e.target.value})}
                    placeholder="Update notes..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleUpdateStatus}>Update Status</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
