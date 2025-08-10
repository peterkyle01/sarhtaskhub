'use client'

import { useState } from 'react'
import { Search, Plus, Edit, Trash2, Eye, ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

// Mock worker data
const mockWorkers = [
  {
    id: 'WK001',
    name: 'Sarah Wilson',
    email: 'sarah.wilson@sarhub.com',
    avatar: '/placeholder.svg?height=40&width=40',
    tasksAssigned: 12,
    performanceScore: 95,
    status: 'Active',
    joinDate: '2023-08-15',
    specialties: ['Mathematics', 'Physics'],
  },
  {
    id: 'WK002',
    name: 'Mike Chen',
    email: 'mike.chen@sarhub.com',
    avatar: '/placeholder.svg?height=40&width=40',
    tasksAssigned: 8,
    performanceScore: 88,
    status: 'Active',
    joinDate: '2023-09-20',
    specialties: ['Statistics', 'Data Analysis'],
  },
  {
    id: 'WK003',
    name: 'Lisa Rodriguez',
    email: 'lisa.rodriguez@sarhub.com',
    avatar: '/placeholder.svg?height=40&width=40',
    tasksAssigned: 15,
    performanceScore: 92,
    status: 'Active',
    joinDate: '2023-07-10',
    specialties: ['Chemistry', 'Biology'],
  },
  {
    id: 'WK004',
    name: 'John Doe',
    email: 'john.doe@sarhub.com',
    avatar: '/placeholder.svg?height=40&width=40',
    tasksAssigned: 6,
    performanceScore: 78,
    status: 'Active',
    joinDate: '2023-10-05',
    specialties: ['Algebra', 'Geometry'],
  },
  {
    id: 'WK005',
    name: 'Alex Thompson',
    email: 'alex.thompson@sarhub.com',
    avatar: '/placeholder.svg?height=40&width=40',
    tasksAssigned: 3,
    performanceScore: 85,
    status: 'Inactive',
    joinDate: '2023-11-12',
    specialties: ['English', 'Literature'],
  },
  {
    id: 'WK006',
    name: 'Emma Davis',
    email: 'emma.davis@sarhub.com',
    avatar: '/placeholder.svg?height=40&width=40',
    tasksAssigned: 10,
    performanceScore: 90,
    status: 'Active',
    joinDate: '2023-06-25',
    specialties: ['Calculus', 'Linear Algebra'],
  },
]

const specialtyOptions = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Statistics',
  'Data Analysis',
  'Algebra',
  'Geometry',
  'Calculus',
  'Linear Algebra',
  'English',
  'Literature',
  'History',
  'Psychology',
]

interface Worker {
  id: string
  name: string
  email: string
  avatar: string
  tasksAssigned: number
  performanceScore: number
  status: string
  joinDate: string
  specialties: string[]
}

function getPerformanceRating(score: number) {
  if (score >= 90) return 'Excellent'
  if (score >= 80) return 'Good'
  if (score >= 70) return 'Average'
  return 'Needs Improvement'
}

function getStatusBadge(status: string) {
  return status === 'Active' ? (
    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>
  ) : (
    <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Inactive</Badge>
  )
}

export default function WorkersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [performanceFilter, setPerformanceFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isTaskHistoryModalOpen, setIsTaskHistoryModalOpen] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null)
  const [newWorker, setNewWorker] = useState({
    name: '',
    email: '',
    specialties: [] as string[],
    status: 'Active',
  })

  const itemsPerPage = 6

  // Filter workers based on search term and filters
  const filteredWorkers = mockWorkers.filter((worker) => {
    const matchesSearch =
      worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      worker.id.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || worker.status === statusFilter

    const matchesPerformance =
      performanceFilter === 'all' ||
      (performanceFilter === 'excellent' && worker.performanceScore >= 90) ||
      (performanceFilter === 'good' &&
        worker.performanceScore >= 80 &&
        worker.performanceScore < 90) ||
      (performanceFilter === 'average' &&
        worker.performanceScore >= 70 &&
        worker.performanceScore < 80) ||
      (performanceFilter === 'poor' && worker.performanceScore < 70)

    return matchesSearch && matchesStatus && matchesPerformance
  })

  // Pagination
  const totalPages = Math.ceil(filteredWorkers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedWorkers = filteredWorkers.slice(startIndex, startIndex + itemsPerPage)

  const handleAddWorker = () => {
    console.log('Adding worker:', newWorker)
    setIsAddModalOpen(false)
    setNewWorker({
      name: '',
      email: '',
      specialties: [],
      status: 'Active',
    })
  }

  const handleViewTaskHistory = (worker: Worker) => {
    setSelectedWorker(worker)
    setIsTaskHistoryModalOpen(true)
  }

  // Mock task history data
  const mockTaskHistory = [
    {
      id: 'T001',
      clientName: 'John Smith',
      courseName: 'Calculus I',
      status: 'Completed',
      completedDate: '2024-01-15',
      rating: 5,
    },
    {
      id: 'T002',
      clientName: 'Emily Johnson',
      courseName: 'Physics II',
      status: 'Completed',
      completedDate: '2024-01-20',
      rating: 4,
    },
    {
      id: 'T003',
      clientName: 'Michael Brown',
      courseName: 'Statistics',
      status: 'In Progress',
      completedDate: null,
      rating: null,
    },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Workers</CardTitle>
              <CardDescription>
                Manage your team members and track their performance
              </CardDescription>
            </div>
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Worker
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Worker</DialogTitle>
                  <DialogDescription>
                    Enter the worker details below to add them to your team.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={newWorker.name}
                      onChange={(e) => setNewWorker({ ...newWorker, name: e.target.value })}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newWorker.email}
                      onChange={(e) => setNewWorker({ ...newWorker, email: e.target.value })}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={newWorker.status}
                      onValueChange={(value) => setNewWorker({ ...newWorker, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Specialties</Label>
                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                      {specialtyOptions.map((specialty) => (
                        <label key={specialty} className="flex items-center space-x-2 text-sm">
                          <input
                            type="checkbox"
                            checked={newWorker.specialties.includes(specialty)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNewWorker({
                                  ...newWorker,
                                  specialties: [...newWorker.specialties, specialty],
                                })
                              } else {
                                setNewWorker({
                                  ...newWorker,
                                  specialties: newWorker.specialties.filter((s) => s !== specialty),
                                })
                              }
                            }}
                            className="rounded"
                          />
                          <span>{specialty}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleAddWorker}>
                    Add Worker
                  </Button>
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
                placeholder="Search workers..."
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
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={performanceFilter} onValueChange={setPerformanceFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Performance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Performance</SelectItem>
                <SelectItem value="excellent">Excellent (90+)</SelectItem>
                <SelectItem value="good">Good (80-89)</SelectItem>
                <SelectItem value="average">Average (70-79)</SelectItem>
                <SelectItem value="poor">Poor (&lt;70)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Worker</TableHead>
                  <TableHead>Worker ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tasks Assigned</TableHead>
                  <TableHead>Performance Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedWorkers.map((worker) => (
                  <TableRow key={worker.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={worker.avatar || '/placeholder.svg'}
                            alt={worker.name}
                          />
                          <AvatarFallback>
                            {worker.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{worker.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {worker.specialties.slice(0, 2).join(', ')}
                            {worker.specialties.length > 2 && ` +${worker.specialties.length - 2}`}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{worker.id}</TableCell>
                    <TableCell>{worker.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-medium">
                        {worker.tasksAssigned}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={worker.performanceScore} className="w-16 h-2" />
                        <span className="text-sm font-medium w-8">{worker.performanceScore}%</span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            worker.performanceScore >= 90
                              ? 'bg-green-100 text-green-800'
                              : worker.performanceScore >= 80
                                ? 'bg-blue-100 text-blue-800'
                                : worker.performanceScore >= 70
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {getPerformanceRating(worker.performanceScore)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(worker.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewTaskHistory(worker)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to{' '}
              {Math.min(startIndex + itemsPerPage, filteredWorkers.length)} of{' '}
              {filteredWorkers.length} workers
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
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
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task History Modal */}
      <Dialog open={isTaskHistoryModalOpen} onOpenChange={setIsTaskHistoryModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Task History - {selectedWorker?.name}</DialogTitle>
            <DialogDescription>
              View all tasks assigned to this worker and their performance history.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              {mockTaskHistory.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{task.id}</span>
                      <Badge variant={task.status === 'Completed' ? 'default' : 'secondary'}>
                        {task.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {task.clientName} - {task.courseName}
                    </p>
                    {task.completedDate && (
                      <p className="text-xs text-muted-foreground">
                        Completed: {new Date(task.completedDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  {task.rating && (
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < task.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
