'use client'

import { useState, useTransition } from 'react'
import { Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
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
import { createTask, updateTask, deleteTask, TaskDoc } from '@/server-actions/tasks-actions'
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
import { Client, Tutor, Topic } from '@/payload-types'

interface Props {
  initialTasks: TaskDoc[]
  initialClients: Client[]
  initialTutors: Tutor[]
  initialTopics: Topic[]
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'completed':
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs">Completed</Badge>
      )
    case 'pending':
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

export default function TasksClient({
  initialTasks,
  initialClients,
  initialTutors,
  initialTopics,
}: Props) {
  const [tasks, setTasks] = useState<TaskDoc[]>(initialTasks)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskDoc | null>(null)
  const [newTaskData, setNewTaskData] = useState({
    name: '',
    description: '',
    dueDate: '',
    client: '',
    tutor: '',
    topic: '',
    status: 'pending' as 'pending' | 'completed',
    score: '',
  })
  const [editTaskData, setEditTaskData] = useState({
    name: '',
    description: '',
    dueDate: '',
    tutor: '',
    status: 'pending' as 'pending' | 'completed',
    score: '',
  })
  const [isPending, startTransition] = useTransition()

  const itemsPerPage = 8
  const statuses = ['pending', 'completed']

  const filteredTasks = tasks.filter((task) => {
    const clientName =
      typeof task.client === 'object' && task.client
        ? task.client.name || `Client ${task.client.id}`
        : `Client ${task.client}`
    const tutorName =
      typeof task.tutor === 'object' && task.tutor
        ? task.tutor.fullName || `Tutor ${task.tutor.id}`
        : `Tutor ${task.tutor}`
    const taskName = task.name || ''

    const matchesSearch =
      taskName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tutorName.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || task.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedTasks = filteredTasks.slice(startIndex, startIndex + itemsPerPage)

  function handleAddTask() {
    if (!newTaskData.name.trim() || !newTaskData.client || !newTaskData.tutor || !newTaskData.topic)
      return

    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.set('name', newTaskData.name)
        if (newTaskData.description) formData.set('description', newTaskData.description)
        if (newTaskData.dueDate) formData.set('dueDate', newTaskData.dueDate)
        formData.set('client', newTaskData.client)
        formData.set('tutor', newTaskData.tutor)
        formData.set('topic', newTaskData.topic)
        formData.set('status', newTaskData.status)
        if (newTaskData.score) formData.set('score', newTaskData.score)

        const created = await createTask(formData)
        if (created) {
          setTasks((prev) => [created, ...prev])
          setIsAddModalOpen(false)
          setNewTaskData({
            name: '',
            description: '',
            dueDate: '',
            client: '',
            tutor: '',
            topic: '',
            status: 'pending',
            score: '',
          })
        }
      } catch (e) {
        console.error('Failed to create task:', e)
      }
    })
  }

  function handleEditTask() {
    if (!editingTask || !editTaskData.name.trim()) return

    startTransition(async () => {
      try {
        const updateData: {
          name: string
          description?: string
          dueDate?: string
          tutor: number
          status: 'pending' | 'completed'
          score?: number
        } = {
          name: editTaskData.name,
          tutor: Number(editTaskData.tutor),
          status: editTaskData.status,
        }
        if (editTaskData.description) updateData.description = editTaskData.description
        if (editTaskData.dueDate) updateData.dueDate = editTaskData.dueDate
        if (editTaskData.score) updateData.score = Number(editTaskData.score)

        const updated = await updateTask(editingTask.id, updateData)
        if (updated) {
          setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
          setIsEditModalOpen(false)
          setEditingTask(null)
          setEditTaskData({
            name: '',
            description: '',
            dueDate: '',
            tutor: '',
            status: 'pending',
            score: '',
          })
        }
      } catch (e) {
        console.error('Failed to update task:', e)
      }
    })
  }

  function openEditModal(task: TaskDoc) {
    setEditingTask(task)
    setEditTaskData({
      name: task.name,
      description: task.description || '',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      tutor:
        typeof task.tutor === 'object' && task.tutor ? String(task.tutor.id) : String(task.tutor),
      status: task.status as 'pending' | 'completed',
      score: task.score ? String(task.score) : '',
    })
    setIsEditModalOpen(true)
  }

  function handleDeleteTask(id: number) {
    startTransition(async () => {
      try {
        const success = await deleteTask(id)
        if (success) {
          setTasks((prev) => prev.filter((t) => t.id !== id))
        }
      } catch (e) {
        console.error('Failed to delete task:', e)
      }
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tasks</CardTitle>
              <CardDescription>Manage and track all tasks</CardDescription>
            </div>
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Task</DialogTitle>
                  <DialogDescription>Create a new task and assign it.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Task Name</Label>
                    <Input
                      id="name"
                      value={newTaskData.name}
                      onChange={(e) => setNewTaskData({ ...newTaskData, name: e.target.value })}
                      placeholder="Enter task name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newTaskData.description}
                      onChange={(e) =>
                        setNewTaskData({ ...newTaskData, description: e.target.value })
                      }
                      placeholder="Enter task description"
                      rows={3}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={newTaskData.dueDate}
                      onChange={(e) => setNewTaskData({ ...newTaskData, dueDate: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="client">Client</Label>
                      <Select
                        value={newTaskData.client}
                        onValueChange={(value) => setNewTaskData({ ...newTaskData, client: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                        <SelectContent>
                          {initialClients.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              {c.name || `Client ${c.id}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="tutor">Tutor</Label>
                      <Select
                        value={newTaskData.tutor}
                        onValueChange={(value) => setNewTaskData({ ...newTaskData, tutor: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select tutor" />
                        </SelectTrigger>
                        <SelectContent>
                          {initialTutors.map((t) => (
                            <SelectItem key={t.id} value={String(t.id)}>
                              {t.fullName || `Tutor ${t.id}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="topic">Topic</Label>
                    <Select
                      value={newTaskData.topic}
                      onValueChange={(value) => setNewTaskData({ ...newTaskData, topic: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select topic" />
                      </SelectTrigger>
                      <SelectContent>
                        {initialTopics.map((topic) => (
                          <SelectItem key={topic.id} value={String(topic.id)}>
                            {topic.name || `Topic ${topic.id}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={newTaskData.status}
                        onValueChange={(value) =>
                          setNewTaskData({
                            ...newTaskData,
                            status: value as 'pending' | 'completed',
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {statuses.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="score">Score (Optional)</Label>
                      <Input
                        id="score"
                        type="number"
                        min="0"
                        max="100"
                        value={newTaskData.score}
                        onChange={(e) => setNewTaskData({ ...newTaskData, score: e.target.value })}
                        placeholder="Enter score (0-100)"
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    onClick={handleAddTask}
                    disabled={
                      isPending ||
                      !newTaskData.name.trim() ||
                      !newTaskData.client ||
                      !newTaskData.tutor ||
                      !newTaskData.topic
                    }
                  >
                    {isPending ? 'Creating...' : 'Add Task'}
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
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {tasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No tasks found. Add your first task to get started.</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Tutor</TableHead>
                      <TableHead>Topic</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTasks.map((task) => {
                      const clientName =
                        typeof task.client === 'object' && task.client
                          ? task.client.name || `Client ${task.client.id}`
                          : `Client ${task.client}`
                      const tutorName =
                        typeof task.tutor === 'object' && task.tutor
                          ? task.tutor.fullName || `Tutor ${task.tutor.id}`
                          : `Tutor ${task.tutor}`
                      const topicName =
                        typeof task.topic === 'object' && task.topic
                          ? task.topic.name || `Topic ${task.topic.id}`
                          : task.topic
                            ? `Topic ${task.topic}`
                            : 'No topic'

                      return (
                        <TableRow key={task.id}>
                          <TableCell>
                            <div className="font-medium">{task.name}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground max-w-[200px] truncate">
                              {task.description || '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
                            </div>
                          </TableCell>
                          <TableCell>{clientName}</TableCell>
                          <TableCell>{tutorName}</TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">{topicName}</span>
                          </TableCell>
                          <TableCell>{getStatusBadge(task.status)}</TableCell>
                          <TableCell>
                            {task.score != null ? (
                              <Badge variant="outline" className="text-xs">
                                {task.score}%
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="sm" onClick={() => openEditModal(task)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Task</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete &quot;{task.name}&quot;? This
                                      action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-red-600 hover:bg-red-700"
                                      onClick={() => handleDeleteTask(task.id)}
                                      disabled={isPending}
                                    >
                                      {isPending ? 'Deleting...' : 'Delete'}
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

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to{' '}
                    {Math.min(startIndex + itemsPerPage, filteredTasks.length)} of{' '}
                    {filteredTasks.length} tasks
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
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        const page =
                          totalPages <= 5
                            ? i + 1
                            : currentPage <= 3
                              ? i + 1
                              : currentPage >= totalPages - 2
                                ? totalPages - 4 + i
                                : currentPage - 2 + i
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        )
                      })}
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
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update task information.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="editName">Task Name</Label>
              <Input
                id="editName"
                value={editTaskData.name}
                onChange={(e) => setEditTaskData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter task name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editDescription">Description</Label>
              <Textarea
                id="editDescription"
                value={editTaskData.description}
                onChange={(e) =>
                  setEditTaskData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Enter task description"
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editDueDate">Due Date</Label>
              <Input
                id="editDueDate"
                type="date"
                value={editTaskData.dueDate}
                onChange={(e) => setEditTaskData((prev) => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="editTutor">Tutor</Label>
              <Select
                value={editTaskData.tutor}
                onValueChange={(value) => setEditTaskData((prev) => ({ ...prev, tutor: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tutor" />
                </SelectTrigger>
                <SelectContent>
                  {initialTutors.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.fullName || `Tutor ${t.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="editStatus">Status</Label>
                <Select
                  value={editTaskData.status}
                  onValueChange={(value) =>
                    setEditTaskData((prev) => ({
                      ...prev,
                      status: value as 'pending' | 'completed',
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editScore">Score</Label>
                <Input
                  id="editScore"
                  type="number"
                  min="0"
                  max="100"
                  value={editTaskData.score}
                  onChange={(e) => setEditTaskData((prev) => ({ ...prev, score: e.target.value }))}
                  placeholder="Enter score (0-100)"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              onClick={handleEditTask}
              disabled={isPending || !editTaskData.name.trim()}
            >
              {isPending ? 'Updating...' : 'Update Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
