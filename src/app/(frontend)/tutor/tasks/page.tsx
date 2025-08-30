'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle, Clock, FileText, Edit, Save, Filter, Search } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

// Types
import { listAssignedTasksForCurrentTutor, AssignedTask } from '@/server-actions/tutors-actions'
import { updateTaskScore } from '@/server-actions/tasks-actions'

function getStatusBadge(status: string) {
  const colors: Record<string, string> = {
    Completed:
      'bg-green-100 text-green-700 dark:bg-green-400/20 dark:text-green-300 dark:ring-1 dark:ring-green-400/30',
    'In Progress':
      'bg-blue-100 text-blue-700 dark:bg-blue-400/20 dark:text-blue-300 dark:ring-1 dark:ring-blue-400/30',
    Pending:
      'bg-yellow-100 text-yellow-700 dark:bg-amber-400/20 dark:text-amber-300 dark:ring-1 dark:ring-amber-400/30',
  }
  return (
    <Badge
      className={`${
        colors[status] || 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-muted-foreground'
      } text-xs rounded-full`}
    >
      {status}
    </Badge>
  )
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

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

function getDaysRemaining(dueDateString: string) {
  const dueDate = new Date(dueDateString)
  const today = new Date()

  // Reset time to start of day for accurate comparison
  dueDate.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)

  const diffTime = dueDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

function getDaysRemainingBadge(daysRemaining: number) {
  if (daysRemaining < 0) {
    return (
      <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 text-xs rounded-full">
        {Math.abs(daysRemaining)} days overdue
      </Badge>
    )
  } else if (daysRemaining === 0) {
    return (
      <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 text-xs rounded-full">
        Due today
      </Badge>
    )
  } else if (daysRemaining === 1) {
    return (
      <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 text-xs rounded-full">
        1 day left
      </Badge>
    )
  } else if (daysRemaining <= 3) {
    return (
      <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 text-xs rounded-full">
        {daysRemaining} days left
      </Badge>
    )
  } else if (daysRemaining <= 7) {
    return (
      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs rounded-full">
        {daysRemaining} days left
      </Badge>
    )
  } else {
    return (
      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-xs rounded-full">
        {daysRemaining} days left
      </Badge>
    )
  }
}

function TaskCard({
  task,
  onScoreUpdate,
}: {
  task: AssignedTask
  onScoreUpdate: (id: number, score: number) => void
}) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [scoreValue, setScoreValue] = useState('')
  const [error, setError] = useState('')

  const handleOpenModal = () => {
    setScoreValue(task.score?.toString() || '')
    setError('')
    setIsModalOpen(true)
  }

  const handleSubmit = async () => {
    setError('')

    if (!scoreValue.trim()) {
      setError('Score is required')
      return
    }

    const score = Number(scoreValue)
    if (isNaN(score) || score < 0 || score > 100) {
      setError('Score must be between 0 and 100')
      return
    }

    setIsUpdating(true)
    try {
      await onScoreUpdate(task.id, score)
      setIsModalOpen(false)
    } catch (error) {
      console.error('Failed to update score:', error)
      setError('Failed to update score. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancel = () => {
    setScoreValue('')
    setError('')
    setIsModalOpen(false)
  }

  return (
    <>
      <Card className="group hover:shadow-md transition-all duration-200 rounded-lg border border-border/50 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
        <CardContent className="p-4">
          {/* Compact Header with task name and badges */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold text-base text-foreground truncate">{task.name}</h3>
                <div className="flex items-center gap-1">{getStatusBadge(task.status)}</div>
              </div>
              <p className="text-sm text-muted-foreground">Client: {task.clientName}</p>
            </div>
          </div>

          {/* Compact Task Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Topics
                  </div>
                  <div className="font-medium text-sm text-foreground">
                    {task.topics.length > 0
                      ? task.topics.map((topic) => topic.name).join(', ')
                      : 'No topics assigned'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Subjects
                  </div>
                  <div className="font-medium text-sm text-foreground">
                    {task.topics.length > 0
                      ? [...new Set(task.topics.map((topic) => topic.subject.name))].join(', ')
                      : 'No subjects'}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${task.status === 'Completed' ? 'bg-green-500' : 'bg-orange-500'}`}
                ></div>
                <div>
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    {task.status === 'Completed' ? (
                      <>
                        <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                        Submitted
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                        Due Date
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-sm text-foreground">
                      {task.status === 'Completed'
                        ? formatRelativeTime(task.updatedAt)
                        : formatDate(task.dueDate)}
                    </div>
                    {task.status !== 'Completed' &&
                      getDaysRemainingBadge(getDaysRemaining(task.dueDate))}
                  </div>
                </div>
              </div>

              {task.description && (
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1"></div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Description
                    </div>
                    <div className="text-xs text-foreground/80 leading-relaxed">
                      {task.description}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Compact Score Section */}
          <div className="border-t border-border/50 pt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Score
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="text-lg font-bold text-foreground">
                    {task.score !== null ? (
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm',
                          task.score >= 90
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : task.score >= 70
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                              : task.score >= 50
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
                        )}
                      >
                        {task.score}%
                      </span>
                    ) : (
                      <span className="text-muted-foreground px-3 py-1 rounded-lg bg-muted/50 text-sm">
                        No score
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleOpenModal}
                  className="h-8 px-3 border-2 border-dashed border-border hover:border-primary rounded-lg transition-all duration-200 hover:scale-105 group text-xs"
                >
                  <Edit className="h-3 w-3 mr-1 group-hover:rotate-12 transition-transform duration-200" />
                  Edit Score
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Score Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Task Score</DialogTitle>
            <DialogDescription>
              Enter a score for {task.clientName}&apos;s task: {task.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="score">Score (0-100)</Label>
              <Input
                id="score"
                type="number"
                min="0"
                max="100"
                value={scoreValue}
                onChange={(e) => setScoreValue(e.target.value)}
                placeholder="Enter score between 0-100"
                className={error ? 'border-red-500' : ''}
              />
              <p className="text-xs text-muted-foreground">
                💡 Adding a score will automatically mark the task as completed
              </p>
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel} disabled={isUpdating}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Score
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default function TutorTasksPage() {
  const searchParams = useSearchParams()
  const clientFilter = searchParams.get('client')

  const [tasks, setTasks] = useState<AssignedTask[]>([])
  const [loadingTasks, setLoadingTasks] = useState(true)
  const [updateSuccess, setUpdateSuccess] = useState(false)
  const [authError, setAuthError] = useState(false)
  const [selectedClient, setSelectedClient] = useState<string | null>(clientFilter)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null)
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)

  // Reset topic if it's not available in the currently selected subject (only main topics)
  useEffect(() => {
    if (selectedTopic && selectedSubject) {
      const topicsInSubject = [
        ...new Set(
          tasks
            .flatMap((task) => task.topics)
            .filter((topic) => topic.subject.name === selectedSubject && !topic.parent) // Only main topics
            .map((topic) => topic.name),
        ),
      ]
      if (!topicsInSubject.includes(selectedTopic)) {
        setSelectedTopic(null)
      }
    }
  }, [selectedSubject, selectedTopic, tasks])

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const data = await listAssignedTasksForCurrentTutor()
        if (active) {
          setTasks(data)
          setAuthError(false)
        }
      } catch (e) {
        console.error('Failed to load assigned tasks', e)
        if (active) {
          if (
            e instanceof Error &&
            (e.message === 'AUTHENTICATION_REQUIRED' || e.message === 'TUTOR_ACCESS_REQUIRED')
          ) {
            setAuthError(true)
          }
        }
      } finally {
        if (active) setLoadingTasks(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const handleScoreUpdate = async (taskId: number, score: number) => {
    try {
      const success = await updateTaskScore(taskId, score)
      if (success) {
        // Update the task in the local state with score, status, and current timestamp
        const currentTimestamp = new Date().toISOString()
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  score,
                  status: 'Completed',
                  updatedAt: currentTimestamp,
                }
              : task,
          ),
        )
        setUpdateSuccess(true)
        setTimeout(() => setUpdateSuccess(false), 3000)
      }
    } catch (error) {
      console.error('Failed to update score:', error)
    }
  }

  // Enhanced filtering with search, subject, topic, and client
  const filteredTasks = tasks.filter((task) => {
    // Search filter
    const searchMatch =
      !searchTerm ||
      task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.topics.some(
        (topic) =>
          topic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          topic.subject.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )

    // Client filter
    const clientMatch = !selectedClient || task.clientName === selectedClient

    // Subject filter
    const subjectMatch =
      !selectedSubject || task.topics.some((topic) => topic.subject.name === selectedSubject)

    // Topic filter
    const topicMatch = !selectedTopic || task.topics.some((topic) => topic.name === selectedTopic)

    return searchMatch && clientMatch && subjectMatch && topicMatch
  })

  // Get unique subjects for filter dropdown
  const allSubjects = [
    ...new Set(tasks.flatMap((task) => task.topics.map((topic) => topic.subject.name))),
  ].sort()

  // Get topics filtered by selected subject (only main topics, not subtopics)
  const availableTopics = selectedSubject
    ? // If a subject is selected, show only main topics from that subject
      [
        ...new Set(
          tasks
            .flatMap((task) => task.topics)
            .filter((topic) => topic.subject.name === selectedSubject && !topic.parent) // Filter out subtopics
            .map((topic) => topic.name),
        ),
      ].sort()
    : // If no subject is selected, show all main topics
      [
        ...new Set(
          tasks
            .flatMap((task) => task.topics)
            .filter((topic) => !topic.parent) // Filter out subtopics
            .map((topic) => topic.name),
        ),
      ].sort()

  // Group tasks by subject only (avoid topic redundancy)
  const groupedTasks = filteredTasks.reduce(
    (acc, task) => {
      // Get all unique subjects for this task
      const subjects = [...new Set(task.topics.map((topic) => topic.subject.name))]

      // Add task to each subject it belongs to (but only once per subject)
      subjects.forEach((subjectName) => {
        if (!acc[subjectName]) {
          acc[subjectName] = []
        }

        // Only add task once per subject to avoid duplicates
        const existingTask = acc[subjectName].find((t) => t.id === task.id)
        if (!existingTask) {
          acc[subjectName].push(task)
        }
      })

      return acc
    },
    {} as Record<string, AssignedTask[]>,
  )

  return (
    <div className="flex-1 space-y-6">
      {/* Compact Header */}
      <Card className="bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground border-0 rounded-xl shadow-lg overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        <CardContent className="relative p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
                <span>My Tasks</span>
                <span className="text-lg">📋</span>
              </h2>
              <p className="opacity-90 text-sm">View and manage scores for your assigned tasks</p>
            </div>
            <div className="hidden md:block">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <FileText className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <div className="text-lg font-bold">{filteredTasks.length}</div>
                <div className="text-xs opacity-80">
                  {selectedClient ? 'Client Tasks' : 'Total Tasks'}
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <div className="text-lg font-bold">
                  {filteredTasks.filter((t) => t.status === 'In Progress').length}
                </div>
                <div className="text-xs opacity-80">In Progress</div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-4 w-4" />
              </div>
              <div>
                <div className="text-lg font-bold">
                  {filteredTasks.filter((t) => t.status === 'Completed').length}
                </div>
                <div className="text-xs opacity-80">Completed</div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <div className="text-lg font-bold">
                  {
                    filteredTasks.filter(
                      (t) => getDaysRemaining(t.dueDate) <= 3 && getDaysRemaining(t.dueDate) >= 0,
                    ).length
                  }
                </div>
                <div className="text-xs opacity-80">Due Soon</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter Controls */}
      <Card className="rounded-lg shadow-md border-0 bg-gradient-to-br from-card to-card/80">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks, clients, topics, or subjects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Subject
                </label>
                <Select
                  value={selectedSubject || 'all-subjects'}
                  onValueChange={(value) => {
                    setSelectedSubject(value === 'all-subjects' ? null : value)
                    setSelectedTopic(null) // Reset topic when subject changes
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-subjects">All subjects</SelectItem>
                    {allSubjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Topic
                </label>
                <Select
                  value={selectedTopic || 'all-topics'}
                  onValueChange={(value) => setSelectedTopic(value === 'all-topics' ? null : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All topics" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-topics">All topics</SelectItem>
                    {availableTopics.map((topic) => (
                      <SelectItem key={topic} value={topic}>
                        {topic}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedSubject(null)
                    setSelectedTopic(null)
                    setSelectedClient(null)
                  }}
                  className="w-full"
                >
                  Clear All Filters
                </Button>
              </div>
            </div>

            {/* Active Filters Display */}
            {(searchTerm || selectedSubject || selectedTopic || selectedClient) && (
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground">Active filters:</span>
                {searchTerm && (
                  <Badge variant="secondary" className="gap-1">
                    Search: {searchTerm}
                    <button
                      onClick={() => setSearchTerm('')}
                      className="ml-1 hover:bg-red-100 rounded-full"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {selectedSubject && (
                  <Badge variant="secondary" className="gap-1">
                    Subject: {selectedSubject}
                    <button
                      onClick={() => setSelectedSubject(null)}
                      className="ml-1 hover:bg-red-100 rounded-full"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {selectedTopic && (
                  <Badge variant="secondary" className="gap-1">
                    Topic: {selectedTopic}
                    <button
                      onClick={() => setSelectedTopic(null)}
                      className="ml-1 hover:bg-red-100 rounded-full"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {selectedClient && (
                  <Badge variant="secondary" className="gap-1">
                    Client: {selectedClient}
                    <button
                      onClick={() => setSelectedClient(null)}
                      className="ml-1 hover:bg-red-100 rounded-full"
                    >
                      ×
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Legacy Client Filter - keeping for backward compatibility */}
      {selectedClient && false && (
        <Card className="rounded-lg shadow-md border-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                  <Filter className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="font-medium text-sm text-blue-800 dark:text-blue-300">
                    Filtered by Client: {selectedClient}
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400">
                    Showing {filteredTasks.length} tasks for this client
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedClient(null)}
                className="h-8 text-xs border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/30"
              >
                Clear Filter
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Authentication Error */}
      {authError && (
        <Card className="border-red-200 dark:border-red-800 bg-gradient-to-r from-red-50 to-red-100/50 dark:from-red-950/50 dark:to-red-900/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-red-800 dark:text-red-300 text-lg">
                  Authentication Required
                </h3>
                <p className="text-red-700 dark:text-red-400">
                  You need to log in as a tutor to view your assigned tasks.
                </p>
              </div>
            </div>
            <div className="text-center">
              <Button
                onClick={() => window.open('/superadmin', '_blank')}
                className="bg-red-600 hover:bg-red-700 text-white font-medium px-6 py-2 rounded-lg transition-all duration-200 hover:scale-105"
              >
                Go to Admin Login
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Message */}
      {updateSuccess && (
        <Card className="border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-green-100/50 dark:from-green-950/50 dark:to-green-900/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-center gap-3">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <span className="font-medium text-green-800 dark:text-green-300">
                Score updated successfully!
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tasks List */}
      <div className="space-y-4">
        {loadingTasks ? (
          <Card className="rounded-lg shadow-md border-0 bg-gradient-to-br from-card to-card/80">
            <CardContent className="p-6 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 animate-spin text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-foreground mb-1">
                    Loading your tasks...
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Please wait while we fetch your assignments
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : filteredTasks.length === 0 ? (
          <Card className="rounded-lg shadow-md border-0 bg-gradient-to-br from-card to-card/80">
            <CardContent className="p-6 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-foreground mb-1">
                    {selectedClient
                      ? `No tasks found for ${selectedClient}`
                      : 'No tasks assigned yet'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedClient
                      ? 'This client has no tasks assigned to you currently.'
                      : 'You&apos;ll see your assignments here once they&apos;re created'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedTasks).map(([subjectName, tasksInSubject]) => (
              <Card
                key={subjectName}
                className="rounded-lg shadow-md border-0 bg-gradient-to-br from-card to-card/80"
              >
                <CardContent className="p-4">
                  {/* Compact Subject Header */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground">{subjectName}</h2>
                      <p className="text-xs text-muted-foreground">{tasksInSubject.length} tasks</p>
                    </div>
                  </div>

                  {/* Tasks in this subject */}
                  <div className="grid gap-3">
                    {tasksInSubject.map((task) => (
                      <TaskCard key={task.id} task={task} onScoreUpdate={handleScoreUpdate} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
