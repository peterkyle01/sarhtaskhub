'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { CheckCircle, Clock, FileText, Edit, Save, X, Filter, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// Types
import { listAssignedTasksForCurrentTutor, AssignedTask } from '@/server-actions/tutors-actions'
import { updateTaskScore } from '@/server-actions/tasks-actions'

const scoreSchema = z.object({
  score: z
    .string()
    .min(1, 'Score is required')
    .refine((val) => {
      const num = Number(val)
      return !isNaN(num) && num >= 0 && num <= 100
    }, 'Score must be between 0 and 100'),
})

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

function TaskCard({
  task,
  onScoreUpdate,
}: {
  task: AssignedTask
  onScoreUpdate: (id: number, score: number) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    resolver: zodResolver(scoreSchema),
    defaultValues: {
      score: task.score?.toString() || '',
    },
  })

  const onSubmit = async (data: { score: string }) => {
    setIsUpdating(true)
    try {
      await onScoreUpdate(task.id, Number(data.score))
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update score:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleEdit = () => {
    setValue('score', task.score?.toString() || '')
    setIsEditing(true)
  }

  const handleCancel = () => {
    reset()
    setIsEditing(false)
  }

  return (
    <Card className="group hover:shadow-md transition-all duration-200 rounded-lg border border-border/50 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
      <CardContent className="p-4">
        {/* Compact Header with client name and badges */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-bold text-base text-foreground truncate">{task.clientName}</h3>
              <div className="flex items-center gap-1">{getStatusBadge(task.status)}</div>
            </div>
          </div>
        </div>

        {/* Compact Task Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
              <div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Course
                </div>
                <div className="font-medium text-sm text-foreground">{task.courseName}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
              <div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Task Type
                </div>
                <div className="font-medium text-sm text-foreground">{task.taskType}</div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
              <div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Due Date
                </div>
                <div className="font-medium text-sm text-foreground">
                  {formatDate(task.dueDate)}
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

            {isEditing ? (
              <form onSubmit={handleSubmit(onSubmit)} className="flex items-center gap-2">
                <div className="relative">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0-100"
                    className={cn(
                      'w-20 h-8 text-center text-sm font-bold bg-background/50 border-2 rounded-lg transition-all duration-200 focus:scale-105',
                      errors.score
                        ? 'border-red-500 focus:border-red-600'
                        : 'border-border focus:border-primary',
                    )}
                    {...register('score')}
                  />
                  <div className="absolute -top-5 left-1/2 transform -translate-x-1/2">
                    {errors.score && (
                      <span className="text-xs text-red-500 bg-background px-1 py-0.5 rounded-md shadow-sm">
                        {errors.score.message}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-1">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isUpdating}
                    className="h-8 px-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all duration-200 hover:scale-105 disabled:scale-100 text-xs"
                  >
                    {isUpdating ? (
                      <>
                        <Clock className="h-3 w-3 mr-1 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-3 w-3 mr-1" />
                        Save
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    className="h-8 px-3 border-2 rounded-lg transition-all duration-200 hover:scale-105 text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
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
                  onClick={handleEdit}
                  className="h-8 px-3 border-2 border-dashed border-border hover:border-primary rounded-lg transition-all duration-200 hover:scale-105 group text-xs"
                >
                  <Edit className="h-3 w-3 mr-1 group-hover:rotate-12 transition-transform duration-200" />
                  Edit Score
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
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
        // Update the task in the local state
        setTasks((prevTasks) =>
          prevTasks.map((task) => (task.id === taskId ? { ...task, score } : task)),
        )
        setUpdateSuccess(true)
        setTimeout(() => setUpdateSuccess(false), 3000)
      }
    } catch (error) {
      console.error('Failed to update score:', error)
    }
  }

  // Filter tasks by client if specified
  const filteredTasks = selectedClient
    ? tasks.filter((task) => task.clientName === selectedClient)
    : tasks

  // Group tasks by course (subject) and then by task type (topic)
  const groupedTasks = filteredTasks.reduce(
    (acc, task) => {
      const courseKey = task.courseName
      const taskTypeKey = task.taskType

      if (!acc[courseKey]) {
        acc[courseKey] = {}
      }
      if (!acc[courseKey][taskTypeKey]) {
        acc[courseKey][taskTypeKey] = []
      }
      acc[courseKey][taskTypeKey].push(task)

      return acc
    },
    {} as Record<string, Record<string, AssignedTask[]>>,
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
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
          </div>
        </CardContent>
      </Card>

      {/* Compact Client Filter */}
      {selectedClient && (
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
            {Object.entries(groupedTasks).map(([courseName, courseGroups]) => (
              <Card
                key={courseName}
                className="rounded-lg shadow-md border-0 bg-gradient-to-br from-card to-card/80"
              >
                <CardContent className="p-4">
                  {/* Compact Course Header */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground">{courseName}</h2>
                      <p className="text-xs text-muted-foreground">
                        {Object.values(courseGroups).flat().length} tasks in{' '}
                        {Object.keys(courseGroups).length} categories
                      </p>
                    </div>
                  </div>

                  {/* Compact Task Types */}
                  <div className="space-y-4">
                    {Object.entries(courseGroups).map(([taskType, tasksInType]) => (
                      <div key={taskType}>
                        {/* Compact Task Type Header */}
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-6 h-6 bg-secondary/20 rounded-lg flex items-center justify-center">
                            <Users className="h-3 w-3 text-secondary-foreground" />
                          </div>
                          <div>
                            <h3 className="text-base font-semibold text-foreground">{taskType}</h3>
                            <p className="text-xs text-muted-foreground">
                              {tasksInType.length} tasks
                            </p>
                          </div>
                        </div>

                        {/* Tasks in this type */}
                        <div className="grid gap-3">
                          {tasksInType.map((task) => (
                            <TaskCard key={task.id} task={task} onScoreUpdate={handleScoreUpdate} />
                          ))}
                        </div>
                      </div>
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
