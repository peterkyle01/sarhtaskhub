'use client'

import { useState } from 'react'
import { Search, Eye, Calendar, FileText, Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Types
interface Client {
  id: string
  name: string
  avatar: string
  platform: string
  courseName: string
  joinDate: string
  tasks: {
    total: number
    completed: number
    inProgress: number
    pending: number
    overdue: number
  }
  nextDeadline: string | null
  priority: string
  lastActivity: string
}

interface _ClientTask {
  id: string
  title: string
  type: string
  status: string
  dueDate: string
  score: number | null
  completedDate: string | null
}

// Mock assigned clients data for worker
const assignedClients = [
  {
    id: 'CL001',
    name: 'John Smith',
    avatar: '/placeholder.svg?height=40&width=40',
    platform: 'Cengage',
    courseName: 'Calculus I',
    joinDate: '2024-01-15',
    tasks: {
      total: 8,
      completed: 5,
      inProgress: 2,
      pending: 1,
      overdue: 0,
    },
    nextDeadline: '2024-02-15',
    priority: 'medium',
    lastActivity: '2 hours ago',
  },
  {
    id: 'CL002',
    name: 'Emily Johnson',
    avatar: '/placeholder.svg?height=40&width=40',
    platform: 'ALEKS',
    courseName: 'Statistics',
    joinDate: '2024-01-20',
    tasks: {
      total: 6,
      completed: 6,
      inProgress: 0,
      pending: 0,
      overdue: 0,
    },
    nextDeadline: null,
    priority: 'low',
    lastActivity: '1 day ago',
  },
  {
    id: 'CL003',
    name: 'Sarah Davis',
    avatar: '/placeholder.svg?height=40&width=40',
    platform: 'ALEKS',
    courseName: 'Algebra',
    joinDate: '2024-01-10',
    tasks: {
      total: 12,
      completed: 7,
      inProgress: 3,
      pending: 1,
      overdue: 1,
    },
    nextDeadline: '2024-02-08',
    priority: 'high',
    lastActivity: '30 minutes ago',
  },
  {
    id: 'CL004',
    name: 'David Wilson',
    avatar: '/placeholder.svg?height=40&width=40',
    platform: 'Cengage',
    courseName: 'Chemistry',
    joinDate: '2024-01-25',
    tasks: {
      total: 4,
      completed: 2,
      inProgress: 2,
      pending: 0,
      overdue: 0,
    },
    nextDeadline: '2024-02-12',
    priority: 'medium',
    lastActivity: '4 hours ago',
  },
  {
    id: 'CL005',
    name: 'Jessica Miller',
    avatar: '/placeholder.svg?height=40&width=40',
    platform: 'ALEKS',
    courseName: 'Geometry',
    joinDate: '2024-02-01',
    tasks: {
      total: 10,
      completed: 4,
      inProgress: 4,
      pending: 2,
      overdue: 0,
    },
    nextDeadline: '2024-02-18',
    priority: 'medium',
    lastActivity: '1 hour ago',
  },
]

// Mock detailed tasks for modal
const mockClientTasks = [
  {
    id: 'TSK001',
    title: 'Chapter 5 Quiz',
    type: 'Quiz',
    status: 'Completed',
    dueDate: '2024-02-05',
    score: 95,
    completedDate: '2024-02-04',
  },
  {
    id: 'TSK002',
    title: 'Homework Assignment 3',
    type: 'Assignment',
    status: 'In Progress',
    dueDate: '2024-02-15',
    score: null,
    completedDate: null,
  },
  {
    id: 'TSK003',
    title: 'Midterm Preparation',
    type: 'Course',
    status: 'Pending',
    dueDate: '2024-02-20',
    score: null,
    completedDate: null,
  },
]

function getPlatformBadge(platform: string) {
  const colors: Record<string, string> = {
    Cengage: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
    ALEKS: 'bg-green-100 text-green-800 hover:bg-green-100',
  }
  return (
    <Badge className={`${colors[platform] || 'bg-gray-100 text-gray-800'} text-xs rounded-full`}>
      {platform}
    </Badge>
  )
}

function getStatusChip(status: string, count: number) {
  if (count === 0) return null

  const colors: Record<string, string> = {
    completed: 'bg-green-100 text-green-700',
    inProgress: 'bg-blue-100 text-blue-700',
    pending: 'bg-yellow-100 text-yellow-700',
    overdue: 'bg-red-100 text-red-700',
  }

  const labels: Record<string, string> = {
    completed: 'Completed',
    inProgress: 'In Progress',
    pending: 'Pending',
    overdue: 'Overdue',
  }

  return (
    <Badge className={`${colors[status]} text-xs rounded-full`}>
      {count} {labels[status]}
    </Badge>
  )
}

function getPriorityColor(priority: string) {
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

function getTaskStatusBadge(status: string) {
  const colors: Record<string, string> = {
    Completed: 'bg-green-100 text-green-700',
    'In Progress': 'bg-blue-100 text-blue-700',
    Pending: 'bg-yellow-100 text-yellow-700',
  }
  return (
    <Badge className={`${colors[status] || 'bg-gray-100 text-gray-700'} text-xs rounded-full`}>
      {status}
    </Badge>
  )
}

export default function AssignedClientsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [platformFilter, setPlatformFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)

  // Filter clients based on search and filters
  const filteredClients = assignedClients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.courseName.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesPlatform = platformFilter === 'all' || client.platform === platformFilter
    const matchesPriority = priorityFilter === 'all' || client.priority === priorityFilter

    return matchesSearch && matchesPlatform && matchesPriority
  })

  const handleViewTasks = (client: Client) => {
    setSelectedClient(client)
    setIsTaskModalOpen(true)
  }

  const totalClients = assignedClients.length
  const activeClients = assignedClients.filter(
    (c) => c.tasks.inProgress > 0 || c.tasks.pending > 0,
  ).length
  const completedClients = assignedClients.filter((c) => c.tasks.total === c.tasks.completed).length

  return (
    <div className="flex-1 space-y-4 sm:space-y-6">
      {/* Header Stats */}
      <Card className="bg-[var(--primary)] text-[var(--primary-foreground)] border-0 rounded-xl sm:rounded-2xl shadow">
        <CardContent className="p-4 sm:p-6 flex flex-col gap-3 sm:gap-4">
          <div>
            <h2 className="text-lg sm:text-2xl font-bold mb-1">Assigned Clients 👥</h2>
            <p className="opacity-80 text-sm sm:text-base">
              Manage your assigned clients and track their progress
            </p>
          </div>
          <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm">
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
        </CardContent>
      </Card>

      {/* Filters Section */}
      <Card className="rounded-xl sm:rounded-2xl shadow-sm border border-[var(--border)] bg-[var(--card)]">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 rounded-xl border-gray-200"
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
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredClients.map((client) => (
          <Card
            key={client.id}
            className={`rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 ${getPriorityColor(client.priority)} bg-[var(--card)] hover:scale-[1.02]`}
          >
            <CardHeader className="pb-3 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12 ring-2 ring-white shadow-md">
                    <AvatarImage src={client.avatar || '/placeholder.svg'} alt={client.name} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-500 text-white font-semibold text-xs sm:text-sm">
                      {client.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-sm sm:text-lg text-foreground">
                      {client.name}
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Joined {new Date(client.joinDate).toLocaleDateString()}
                    </CardDescription>
                  </div>
                </div>
                {getPlatformBadge(client.platform)}
              </div>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
              {/* Course Info */}
              <div className="p-2 sm:p-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg sm:rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
                  <span className="font-medium text-xs sm:text-sm text-gray-800">
                    {client.courseName}
                  </span>
                </div>
                <div className="text-[10px] sm:text-xs text-gray-600">
                  Last activity: {client.lastActivity}
                </div>
              </div>

              {/* Task Summary */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                    Task Summary
                  </span>
                  <Badge
                    variant="outline"
                    className="rounded-full text-[10px] sm:text-xs bg-[var(--accent)] text-[var(--accent-foreground)]"
                  >
                    {client.tasks.total} total
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  {getStatusChip('completed', client.tasks.completed)}
                  {getStatusChip('inProgress', client.tasks.inProgress)}
                  {getStatusChip('pending', client.tasks.pending)}
                  {getStatusChip('overdue', client.tasks.overdue)}
                </div>
              </div>

              {/* Next Deadline */}
              {client.nextDeadline && (
                <div className="p-2 bg-orange-50 rounded-lg border border-orange-100">
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600" />
                    <span className="text-orange-800 font-medium">
                      Next deadline: {new Date(client.nextDeadline).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <Button
                onClick={() => handleViewTasks(client)}
                className="w-full rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-200 text-xs sm:text-sm"
              >
                <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                View Tasks
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredClients.length === 0 && (
        <Card className="rounded-xl sm:rounded-2xl shadow-sm border border-[var(--border)] bg-[var(--card)]">
          <CardContent className="p-8 sm:p-12 text-center">
            <Users className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-base sm:text-lg font-medium text-foreground mb-2">
              No clients found
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground">
              Try adjusting your search or filter criteria.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Task Details Modal */}
      <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
        <DialogContent className="sm:max-w-[600px] rounded-xl sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                <AvatarImage
                  src={selectedClient?.avatar || '/placeholder.svg'}
                  alt={selectedClient?.name}
                />
                <AvatarFallback className="text-xs sm:text-sm">
                  {selectedClient?.name
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold text-sm sm:text-base">{selectedClient?.name}</div>
                <div className="text-xs sm:text-sm text-muted-foreground font-normal">
                  {selectedClient?.courseName}
                </div>
              </div>
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              View all tasks for this client and their current status.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4 py-4">
            {mockClientTasks.map((task) => (
              <Card key={task.id} className="rounded-lg sm:rounded-xl shadow-sm">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-xs sm:text-sm">{task.title}</span>
                      <Badge variant="outline" className="rounded-full text-[10px] sm:text-xs">
                        {task.type}
                      </Badge>
                    </div>
                    {getTaskStatusBadge(task.status)}
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm text-muted-foreground">
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
    </div>
  )
}
