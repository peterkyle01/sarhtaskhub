'use client'

import { useState, useTransition } from 'react'
import {
  Search,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Calendar,
  User,
  GraduationCap,
  BookOpen,
  CheckCircle,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createTask, updateTask, deleteTask, TaskDoc } from '@/server-actions/tasks-actions'

// Helper function to format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'just now'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  } else if (diffInSeconds < 2592000) {
    // 30 days
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} day${days !== 1 ? 's' : ''} ago`
  } else if (diffInSeconds < 31536000) {
    // 365 days
    const months = Math.floor(diffInSeconds / 2592000)
    return `${months} month${months !== 1 ? 's' : ''} ago`
  } else {
    const years = Math.floor(diffInSeconds / 31536000)
    return `${years} year${years !== 1 ? 's' : ''} ago`
  }
}
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
import type { SubjectWithTopics } from '@/server-actions/subjects-actions'
import { HierarchicalTopicSelector } from '@/components/custom/hierarchical-topic-selector'

interface Props {
  initialTasks: TaskDoc[]
  initialClients: Client[]
  initialTutors: Tutor[]
  initialTopics: Topic[]
  subjectsWithTopics: SubjectWithTopics[]
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
  initialTopics: _initialTopics,
  subjectsWithTopics,
}: Props) {
  const [tasks, setTasks] = useState<TaskDoc[]>(initialTasks)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set()) // Track expanded task cards
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [addTaskStep, setAddTaskStep] = useState(1) // New state for modal steps
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set()) // Track selected topics
  const [editSelectedTopics, setEditSelectedTopics] = useState<Set<string>>(new Set()) // Track selected topics for edit modal
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
    topics: '',
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

  // Helper function to toggle task card expansion
  const toggleTaskExpansion = (taskId: number) => {
    const newExpanded = new Set(expandedTasks)
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId)
    } else {
      newExpanded.add(taskId)
    }
    setExpandedTasks(newExpanded)
  }

  // Helper function to get topic information with subject context
  const getTopicDetails = (topics: Topic[] | (string | number | Topic)[]) => {
    const topicsBySubject: { [key: string]: Topic[] } = {}

    if (!Array.isArray(topics)) return topicsBySubject

    topics.forEach((topic) => {
      if (typeof topic === 'object' && topic && 'name' in topic) {
        // Find which subject this topic belongs to
        for (const subject of subjectsWithTopics) {
          const foundTopic =
            subject.topics.find((t) => t.id === topic.id) ||
            subject.topics.flatMap((t) => t.subtopics).find((st) => st.id === topic.id)
          if (foundTopic) {
            if (!topicsBySubject[subject.name]) {
              topicsBySubject[subject.name] = []
            }
            topicsBySubject[subject.name].push(topic as Topic)
            break
          }
        }
      }
    })

    return topicsBySubject
  }

  // Helper function to calculate days until due date
  const getDaysUntilDue = (dueDate: string | null) => {
    if (!dueDate) return null

    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays
  }

  // Helper function to format due date status with color coding
  const getDueDateStatus = (dueDate: string | null) => {
    const daysUntil = getDaysUntilDue(dueDate)
    if (daysUntil === null) return null

    if (daysUntil < 0) {
      // Overdue - Red
      return {
        text: `${Math.abs(daysUntil)} days overdue`,
        variant: 'destructive' as const,
        className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100',
      }
    } else if (daysUntil === 0) {
      // Due today - Bright Red
      return {
        text: 'Due today',
        variant: 'destructive' as const,
        className: 'bg-red-500 text-white border-red-600 hover:bg-red-500 animate-pulse',
      }
    } else if (daysUntil === 1) {
      // Due tomorrow - Orange
      return {
        text: '1 day left',
        variant: 'secondary' as const,
        className: 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100',
      }
    } else if (daysUntil <= 3) {
      // Due in 2-3 days - Yellow
      return {
        text: `${daysUntil} days left`,
        variant: 'secondary' as const,
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100',
      }
    } else if (daysUntil <= 7) {
      // Due in 4-7 days - Blue
      return {
        text: `${daysUntil} days left`,
        variant: 'outline' as const,
        className: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50',
      }
    } else {
      // Due in more than 7 days - Green
      return {
        text: `${daysUntil} days left`,
        variant: 'outline' as const,
        className: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-50',
      }
    }
  }

  // Helper functions for modal steps
  const handleNextStep = () => {
    if (addTaskStep === 1) {
      // Validate first step
      if (!newTaskData.name.trim() || !newTaskData.client || !newTaskData.tutor) {
        return
      }
      setAddTaskStep(2)
    }
  }

  const handlePreviousStep = () => {
    if (addTaskStep === 2) {
      setAddTaskStep(1)
    }
  }

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false)
    setAddTaskStep(1)
    setSelectedTopics(new Set()) // Reset selected topics
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

  function handleAddTask() {
    if (
      !newTaskData.name.trim() ||
      !newTaskData.client ||
      !newTaskData.tutor ||
      selectedTopics.size === 0
    )
      return

    startTransition(async () => {
      try {
        // Convert selected topics set to array of topic IDs
        const topicIds = Array.from(selectedTopics)
          .filter((topic) => topic.startsWith('topic-'))
          .map((topic) => topic.replace('topic-', ''))

        if (topicIds.length === 0) {
          console.error('No valid topics selected')
          return
        }

        // Create a single task with multiple topics
        const formData = new FormData()
        formData.set('name', newTaskData.name)
        if (newTaskData.description) formData.set('description', newTaskData.description)
        if (newTaskData.dueDate) formData.set('dueDate', newTaskData.dueDate)
        formData.set('client', newTaskData.client)
        formData.set('tutor', newTaskData.tutor)
        formData.set('topics', topicIds.join(',')) // Send as comma-separated string

        // Automatically set status to completed if score is provided
        const finalStatus = newTaskData.score ? 'completed' : newTaskData.status
        formData.set('status', finalStatus)

        if (newTaskData.score) formData.set('score', newTaskData.score)

        const created = await createTask(formData)
        if (created) {
          // Add current timestamp for consistency
          const createdWithTimestamp = {
            ...created,
            updatedAt: created.updatedAt || new Date().toISOString(),
            createdAt: created.createdAt || new Date().toISOString(),
          }
          setTasks((prev) => [createdWithTimestamp, ...prev])
          handleCloseAddModal()
        }
      } catch (error) {
        console.error('Error creating task:', error)
      }
    })
  }

  function handleEditTask() {
    if (!editingTask || !editTaskData.name.trim()) return

    startTransition(async () => {
      try {
        // Convert selected topics set to comma-separated string
        const topicIds = Array.from(editSelectedTopics)
          .filter((topic) => topic.startsWith('topic-'))
          .map((topic) => topic.replace('topic-', ''))

        const updateData: {
          name: string
          description?: string
          dueDate?: string
          tutor: number
          topics?: string
          status: 'pending' | 'completed'
          score?: number
        } = {
          name: editTaskData.name,
          tutor: Number(editTaskData.tutor),
          status: editTaskData.status,
        }
        if (editTaskData.description) updateData.description = editTaskData.description
        if (editTaskData.dueDate) updateData.dueDate = editTaskData.dueDate
        if (editTaskData.score) {
          updateData.score = Number(editTaskData.score)
          // Automatically set status to completed when a score is provided
          updateData.status = 'completed'
        }
        if (topicIds.length > 0) updateData.topics = topicIds.join(',')

        const updated = await updateTask(editingTask.id, updateData)
        if (updated) {
          // Update the local state with the current timestamp for updatedAt
          const updatedWithTimestamp = {
            ...updated,
            updatedAt: new Date().toISOString(),
          }
          setTasks((prev) => prev.map((t) => (t.id === updated.id ? updatedWithTimestamp : t)))
          setIsEditModalOpen(false)
          setEditingTask(null)
          setEditSelectedTopics(new Set())
          setEditTaskData({
            name: '',
            description: '',
            dueDate: '',
            tutor: '',
            topics: '',
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

    // Set up selected topics for edit
    if (task.topics && Array.isArray(task.topics)) {
      const topicIds = task.topics.map((topic) =>
        typeof topic === 'object' && topic ? `topic-${topic.id}` : `topic-${topic}`,
      )
      setEditSelectedTopics(new Set(topicIds))
    } else {
      setEditSelectedTopics(new Set())
    }

    setEditTaskData({
      name: task.name,
      description: task.description || '',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      tutor:
        typeof task.tutor === 'object' && task.tutor ? String(task.tutor.id) : String(task.tutor),
      topics:
        task.topics && Array.isArray(task.topics)
          ? task.topics
              .map((t) => (typeof t === 'object' && t ? String(t.id) : String(t)))
              .join(',')
          : '',
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
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>

            <Dialog
              open={isAddModalOpen}
              onOpenChange={(open) => {
                if (!open) {
                  handleCloseAddModal()
                }
              }}
            >
              <DialogContent className="w-full md:w-1/2">
                <DialogHeader>
                  <div className="flex items-center justify-between mb-2">
                    <DialogTitle>Add New Task</DialogTitle>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                          addTaskStep >= 1
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        1
                      </div>
                      <div className={`w-8 h-1 ${addTaskStep >= 2 ? 'bg-primary' : 'bg-muted'}`} />
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                          addTaskStep >= 2
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        2
                      </div>
                    </div>
                  </div>
                  <DialogDescription>
                    {addTaskStep === 1
                      ? 'Enter basic task information'
                      : 'Select topics for this task'}
                  </DialogDescription>
                </DialogHeader>

                {addTaskStep === 1 ? (
                  // Step 1: Basic Information
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
                        onChange={(e) =>
                          setNewTaskData({ ...newTaskData, dueDate: e.target.value })
                        }
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="client">Client</Label>
                        <Select
                          value={newTaskData.client}
                          onValueChange={(value) =>
                            setNewTaskData({ ...newTaskData, client: value })
                          }
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
                          onValueChange={(value) =>
                            setNewTaskData({ ...newTaskData, tutor: value })
                          }
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
                          onChange={(e) =>
                            setNewTaskData({ ...newTaskData, score: e.target.value })
                          }
                          placeholder="Enter score (0-100)"
                        />
                        <p className="text-xs text-muted-foreground">
                          💡 Adding a score will automatically mark the task as completed
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Step 2: Topic Selection
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label>Topic Selection</Label>
                      <HierarchicalTopicSelector
                        subjects={subjectsWithTopics}
                        value={newTaskData.topic}
                        onValueChange={(value) => setNewTaskData({ ...newTaskData, topic: value })}
                        selectedTopics={selectedTopics}
                        onSelectedTopicsChange={setSelectedTopics}
                        placeholder="Select topic, subtopic, or whole subject..."
                        className="w-full"
                      />
                    </div>
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p>
                        <strong>Multiple Topic Selection:</strong>
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>
                          <strong>Multiple Topics:</strong> Select multiple topics and subtopics for
                          comprehensive task coverage
                        </li>
                        <li>
                          <strong>Auto-selection:</strong> Selecting a topic automatically includes
                          all its subtopics
                        </li>
                        <li>
                          <strong>Granular Control:</strong> You can also select individual
                          subtopics as needed
                        </li>
                      </ul>
                    </div>
                  </div>
                )}

                <DialogFooter className="flex justify-between">
                  <div className="flex gap-2">
                    {addTaskStep === 2 && (
                      <Button variant="outline" onClick={handlePreviousStep}>
                        Previous
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleCloseAddModal}>
                      Cancel
                    </Button>
                    {addTaskStep === 1 ? (
                      <Button
                        onClick={handleNextStep}
                        disabled={
                          !newTaskData.name.trim() || !newTaskData.client || !newTaskData.tutor
                        }
                      >
                        Next
                      </Button>
                    ) : (
                      <Button onClick={handleAddTask} disabled={isPending || !newTaskData.topic}>
                        {isPending ? 'Creating...' : 'Create Task'}
                      </Button>
                    )}
                  </div>
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
              <div className="space-y-4">
                {paginatedTasks.map((task) => {
                  const clientName =
                    typeof task.client === 'object' && task.client
                      ? task.client.name || `Client ${task.client.id}`
                      : `Client ${task.client}`
                  const tutorName =
                    typeof task.tutor === 'object' && task.tutor
                      ? task.tutor.fullName || `Tutor ${task.tutor.id}`
                      : `Tutor ${task.tutor}`
                  const isExpanded = expandedTasks.has(task.id)
                  const topicsBySubject = getTopicDetails(task.topics || [])

                  return (
                    <Card key={task.id} className="transition-all duration-200 hover:shadow-md">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleTaskExpansion(task.id)}
                              className="h-8 w-8 p-0 flex-shrink-0"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </Button>
                            <div className="min-w-0 flex-1">
                              <CardTitle className="text-lg truncate">{task.name}</CardTitle>
                              <CardDescription className="mt-1">
                                {task.description || 'No description'}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {getStatusBadge(task.status)}
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
                        </div>

                        {/* Compact info row */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-2">
                          <div className="flex items-center gap-1">
                            {task.status === 'completed' ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <Calendar className="w-4 h-4" />
                            )}
                            <span>
                              {task.status === 'completed'
                                ? `Submitted ${formatRelativeTime(task.updatedAt)}`
                                : task.dueDate
                                  ? new Date(task.dueDate).toLocaleDateString()
                                  : 'No due date'}
                            </span>
                          </div>
                          {task.dueDate && task.status !== 'completed' && (
                            <div className="flex items-center gap-1">
                              {(() => {
                                const dueDateStatus = getDueDateStatus(task.dueDate)
                                return dueDateStatus ? (
                                  <Badge
                                    variant={dueDateStatus.variant}
                                    className={`text-xs ${dueDateStatus.className || ''}`}
                                  >
                                    {dueDateStatus.text}
                                  </Badge>
                                ) : null
                              })()}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>{clientName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <GraduationCap className="w-4 h-4" />
                            <span>{tutorName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4" />
                            <span>{task.topics?.length || 0} topics</span>
                          </div>
                          {task.score != null && (
                            <Badge variant="outline" className="text-xs">
                              {task.score}%
                            </Badge>
                          )}
                        </div>
                      </CardHeader>

                      {/* Expanded content */}
                      {isExpanded && (
                        <CardContent className="pt-0">
                          <div className="space-y-4">
                            {/* Topics by Subject */}
                            <div>
                              <h4 className="font-medium mb-3 flex items-center gap-2">
                                <BookOpen className="w-4 h-4" />
                                Topics & Subjects
                              </h4>
                              {Object.keys(topicsBySubject).length === 0 ? (
                                <p className="text-sm text-muted-foreground">No topics assigned</p>
                              ) : (
                                <div className="space-y-3">
                                  {Object.entries(topicsBySubject).map(([subjectName, topics]) => (
                                    <div key={subjectName} className="border rounded-lg p-3">
                                      <h5 className="font-medium text-sm mb-2 text-primary">
                                        {subjectName}
                                      </h5>
                                      <div className="space-y-1">
                                        {topics.map((topic, index) => (
                                          <div
                                            key={index}
                                            className="text-sm text-muted-foreground pl-3 border-l-2 border-muted"
                                          >
                                            {topic.name || `Topic ${topic.id}`}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  )
                })}
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

      <Dialog
        open={isEditModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsEditModalOpen(false)
            setEditingTask(null)
            setEditSelectedTopics(new Set())
            setEditTaskData({
              name: '',
              description: '',
              dueDate: '',
              tutor: '',
              topics: '',
              status: 'pending',
              score: '',
            })
          }
        }}
      >
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
            <div className="grid gap-2">
              <Label>Topics</Label>
              <HierarchicalTopicSelector
                subjects={subjectsWithTopics}
                value={editTaskData.topics}
                onValueChange={(value) => setEditTaskData((prev) => ({ ...prev, topics: value }))}
                selectedTopics={editSelectedTopics}
                onSelectedTopicsChange={setEditSelectedTopics}
                placeholder="Select topics..."
                className="w-full"
              />
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
                <p className="text-xs text-muted-foreground">
                  💡 Adding a score will automatically mark the task as completed
                </p>
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
