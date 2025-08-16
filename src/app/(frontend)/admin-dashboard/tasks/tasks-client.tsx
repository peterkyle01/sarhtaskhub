'use client'

import { useState, useTransition } from 'react'
import {
  Search,
  Plus,
  Edit,
  UserPlus,
  Clock,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { Textarea } from '@/components/ui/textarea'
import {
  createTask,
  assignTutorToTask,
  updateTaskStatus,
  deleteTask,
} from '@/server-actions/tasks-actions'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'

interface TaskDoc {
  id: number
  taskId?: string | null
  client: { id: number; name?: string; user?: { id: number; fullName?: string } } | number
  platform: string
  taskType: string
  dueDate: string
  status: string
  tutor?: { id: number; fullName?: string } | number | null
  score?: number | null
  notes?: string | null
}

interface ClientDoc {
  id: number
  name?: string
  user?: {
    id: number
    fullName?: string
  }
}
interface TutorDoc {
  id: number
  fullName?: string
}

interface Props {
  initialTasks: TaskDoc[]
  initialClients: ClientDoc[]
  initialTutors: TutorDoc[]
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'Completed':
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs">Completed</Badge>
      )
    case 'In Progress':
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 text-xs">In Progress</Badge>
      )
    case 'Pending':
      return (
        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 text-xs">Pending</Badge>
      )
    default:
      return (
        <Badge variant="secondary" className="text-xs">
          {status}
        </Badge>
      )
  }
}

function getPlatformBadge(platform: string) {
  const map: Record<string, string> = {
    Cengage: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
    ALEKS: 'bg-orange-100 text-orange-800 hover:bg-orange-100',
    MATLAB: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
  }
  const cls = map[platform] || 'bg-gray-100 text-gray-800'
  return <Badge className={`${cls} text-xs`}>{platform}</Badge>
}

function getTaskTypeBadge(taskType: string) {
  const colors: Record<string, string> = {
    Quiz: 'bg-cyan-100 text-cyan-800',
    Assignment: 'bg-indigo-100 text-indigo-800',
    Course: 'bg-pink-100 text-pink-800',
  }
  const cls = colors[taskType] || 'bg-gray-100 text-gray-800'
  return <Badge className={`${cls} text-xs`}>{taskType}</Badge>
}

function getDueDateStatus(dueDate: string) {
  const today = new Date()
  const due = new Date(dueDate)
  const diffTime = due.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return { status: 'overdue', color: 'text-red-600' }
  if (diffDays <= 1) return { status: 'due-today', color: 'text-orange-600' }
  if (diffDays <= 3) return { status: 'due-soon', color: 'text-yellow-600' }
  return { status: 'normal', color: 'text-muted-foreground' }
}

export default function TasksClient({ initialTasks, initialClients, initialTutors }: Props) {
  const [tasks, setTasks] = useState<TaskDoc[]>(initialTasks)
  const [tutors] = useState<TutorDoc[]>(initialTutors)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [platformFilter, setPlatformFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [isUpdateStatusModalOpen, setIsUpdateStatusModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<TaskDoc | null>(null)
  const [_, startTransition] = useTransition()
  const [newTask, setNewTask] = useState({
    client: '',
    platform: '',
    taskType: '',
    dueDate: '',
    tutor: '',
    notes: '',
  })
  const [assignTask, setAssignTask] = useState({ taskId: '', tutor: '' })
  const [updateStatusState, setUpdateStatusState] = useState({
    taskId: '',
    status: '',
    score: '',
    notes: '',
  })

  const statuses = ['Pending', 'In Progress', 'Completed']
  const platforms = ['Cengage', 'ALEKS', 'MATLAB']
  const taskTypes = ['Quiz', 'Assignment', 'Course']
  const itemsPerPage = 8

  const filteredTasks = tasks.filter((task) => {
    const clientName =
      typeof task.client === 'object' ? task.client.name || task.client.user?.fullName || '' : ''
    const tutorName = typeof task.tutor === 'object' && task.tutor ? task.tutor.fullName || '' : ''
    const matchesSearch =
      clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (task.taskId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      tutorName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter
    const matchesPlatform = platformFilter === 'all' || task.platform === platformFilter
    return matchesSearch && matchesStatus && matchesPlatform
  })

  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedTasks = filteredTasks.slice(startIndex, startIndex + itemsPerPage)

  function resetNewTask() {
    setNewTask({ client: '', platform: '', taskType: '', dueDate: '', tutor: '', notes: '' })
  }

  function handleAddTask() {
    const fd = new FormData()
    fd.set('client', newTask.client)
    fd.set('platform', newTask.platform)
    fd.set('taskType', newTask.taskType)
    fd.set('dueDate', newTask.dueDate)
    if (newTask.tutor) fd.set('tutor', newTask.tutor)
    if (newTask.notes) fd.set('notes', newTask.notes)
    startTransition(async () => {
      try {
        const created = (await createTask(fd)) as TaskDoc
        setTasks((prev) => [created, ...prev])
        resetNewTask()
        setIsAddModalOpen(false)
      } catch (e) {
        console.error(e)
      }
    })
  }

  function handleAssignTask() {
    startTransition(async () => {
      try {
        if (assignTask.taskId && assignTask.tutor) {
          await assignTutorToTask(Number(assignTask.taskId), Number(assignTask.tutor))
          setTasks((prev) =>
            prev.map((t) =>
              t.id === Number(assignTask.taskId)
                ? {
                    ...t,
                    tutor: tutors.find((w) => w.id === Number(assignTask.tutor)) || t.tutor,
                  }
                : t,
            ),
          )
        }
        setIsAssignModalOpen(false)
      } catch (e) {
        console.error(e)
      }
    })
  }
  console.log('InitialClients:', initialClients)
  function handleUpdateStatus() {
    startTransition(async () => {
      try {
        if (updateStatusState.taskId && updateStatusState.status) {
          await updateTaskStatus(
            Number(updateStatusState.taskId),
            updateStatusState.status as 'Pending' | 'In Progress' | 'Completed',
            {
              score: updateStatusState.score ? Number(updateStatusState.score) : undefined,
              notes: updateStatusState.notes || undefined,
            },
          )
          setTasks((prev) =>
            prev.map((t) =>
              t.id === Number(updateStatusState.taskId)
                ? {
                    ...t,
                    status: updateStatusState.status,
                    score: updateStatusState.score ? Number(updateStatusState.score) : t.score,
                    notes: updateStatusState.notes || t.notes,
                  }
                : t,
            ),
          )
        }
        setIsUpdateStatusModalOpen(false)
      } catch (e) {
        console.error(e)
      }
    })
  }

  function handleDeleteTask(id: number) {
    startTransition(async () => {
      try {
        const ok = await deleteTask(id)
        if (ok) setTasks((prev) => prev.filter((t) => t.id !== id))
      } catch (e) {
        console.error(e)
      }
    })
  }

  function openAssignModal(task: TaskDoc) {
    setSelectedTask(task)
    setAssignTask({
      taskId: String(task.id),
      tutor: typeof task.tutor === 'object' && task.tutor ? String(task.tutor.id) : '',
    })
    setIsAssignModalOpen(true)
  }

  function openUpdateStatusModal(task: TaskDoc) {
    setSelectedTask(task)
    setUpdateStatusState({
      taskId: String(task.id),
      status: task.status,
      score: task.score != null ? String(task.score) : '',
      notes: task.notes || '',
    })
    setIsUpdateStatusModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* UI identical to previous page version (omitted for brevity) */}
      {/* You can move the full JSX from prior implementation here if needed. */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tasks</CardTitle>
              <CardDescription>Manage and track all tasks across your platform</CardDescription>
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
                  <DialogDescription>Create a new task and assign it.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="client">Client</Label>
                      <Select
                        value={newTask.client}
                        onValueChange={(value) => setNewTask({ ...newTask, client: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                        <SelectContent>
                          {initialClients.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              {c.name || c.user?.fullName || `Client ${c.id}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="platform">Platform</Label>
                      <Select
                        value={newTask.platform}
                        onValueChange={(value) => setNewTask({ ...newTask, platform: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select platform" />
                        </SelectTrigger>
                        <SelectContent>
                          {platforms.map((p) => (
                            <SelectItem key={p} value={p}>
                              {p}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="taskType">Task Type</Label>
                      <Select
                        value={newTask.taskType}
                        onValueChange={(value) => setNewTask({ ...newTask, taskType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {taskTypes.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
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
                        onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="tutor">Assigned Tutor</Label>
                    <Select
                      value={newTask.tutor}
                      onValueChange={(value) => setNewTask({ ...newTask, tutor: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select tutor" />
                      </SelectTrigger>
                      <SelectContent>
                        {tutors.map((w) => (
                          <SelectItem key={w.id} value={String(w.id)}>
                            {w.fullName || `Tutor ${w.id}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={newTask.notes}
                      onChange={(e) => setNewTask({ ...newTask, notes: e.target.value })}
                      placeholder="Task description..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleAddTask}>
                    Add Task
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
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
                {statuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                {platforms.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
                  <TableHead className="py-2">Tutor</TableHead>
                  <TableHead className="py-2">Score</TableHead>
                  <TableHead className="py-2 max-w-[200px]">Notes</TableHead>
                  <TableHead className="py-2 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTasks.map((task) => {
                  const dueDateStatus = getDueDateStatus(task.dueDate)
                  const clientName =
                    typeof task.client === 'object'
                      ? task.client.name || task.client.user?.fullName || `Client ${task.client.id}`
                      : `Client ${task.client}`
                  const tutorName =
                    typeof task.tutor === 'object' && task.tutor
                      ? task.tutor.fullName || `Tutor ${task.tutor.id}`
                      : ''
                  return (
                    <TableRow key={task.id} className="h-12">
                      <TableCell className="py-2 font-medium text-sm">
                        {task.taskId || task.id}
                      </TableCell>
                      <TableCell className="py-2 text-sm">{clientName}</TableCell>
                      <TableCell className="py-2">{getPlatformBadge(task.platform)}</TableCell>
                      <TableCell className="py-2">{getTaskTypeBadge(task.taskType)}</TableCell>
                      <TableCell className="py-2">
                        <div className="flex flex-col">
                          <span className={`text-sm ${dueDateStatus.color}`}>
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                          {dueDateStatus.status === 'overdue' && (
                            <span className="text-xs text-red-600 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Overdue
                            </span>
                          )}
                          {dueDateStatus.status === 'due-today' && (
                            <span className="text-xs text-orange-600 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Due today
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-2">{getStatusBadge(task.status)}</TableCell>
                      <TableCell className="py-2 text-sm">
                        {tutorName || (
                          <span className="text-muted-foreground italic">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell className="py-2 text-sm">
                        {task.score != null ? (
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
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-red-600 hover:text-red-700"
                              >
                                Del
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Task</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete task {task.taskId || task.id}?
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-600 hover:bg-red-700"
                                  onClick={() => handleDeleteTask(task.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to{' '}
              {Math.min(startIndex + itemsPerPage, filteredTasks.length)} of {filteredTasks.length}{' '}
              tasks
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
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
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Assign Task</DialogTitle>
            <DialogDescription>
              Assign task {selectedTask?.taskId || selectedTask?.id} to a tutor.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="tutor">Select Tutor</Label>
              <Select
                value={assignTask.tutor}
                onValueChange={(value) => setAssignTask({ ...assignTask, tutor: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a tutor" />
                </SelectTrigger>
                <SelectContent>
                  {tutors.map((w) => (
                    <SelectItem key={w.id} value={String(w.id)}>
                      {w.fullName || `Tutor ${w.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleAssignTask}>
              Assign Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isUpdateStatusModalOpen} onOpenChange={setIsUpdateStatusModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Update Task Status</DialogTitle>
            <DialogDescription>
              Update the status for task {selectedTask?.taskId || selectedTask?.id}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={updateStatusState.status}
                onValueChange={(value) =>
                  setUpdateStatusState({ ...updateStatusState, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
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
                value={updateStatusState.score}
                onChange={(e) =>
                  setUpdateStatusState({ ...updateStatusState, score: e.target.value })
                }
                placeholder="Enter score (0-100)"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={updateStatusState.notes}
                onChange={(e) =>
                  setUpdateStatusState({ ...updateStatusState, notes: e.target.value })
                }
                placeholder="Update notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleUpdateStatus}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
