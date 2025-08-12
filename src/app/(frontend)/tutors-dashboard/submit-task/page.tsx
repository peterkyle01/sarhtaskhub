'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Upload, CheckCircle, Clock, FileText, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

// Types
import { listAssignedTasksForCurrentWorker } from '@/server-actions/worker-actions'
import { updateTaskStatus } from '@/server-actions/tasks-actions'

interface AssignedTask {
  id: number
  clientName: string
  courseName: string
  taskType: string
  platform: string
  dueTime: string // ISO full datetime
  dueDate: string // derived date part
  status: 'Completed' | 'In Progress' | 'Pending'
  priority: 'high' | 'medium' | 'low'
  estimatedTime: string
}

const formSchema = z
  .object({
    taskId: z.string().min(1, { message: 'Please select a task.' }),
    status: z.enum(['In Progress', 'Completed'], { message: 'Please select a status.' }),
    notes: z.string().optional(),
    score: z.string().optional(),
    file: z.any().optional(), // FileList or File object
  })
  .superRefine((data, ctx) => {
    if (data.status === 'Completed') {
      if (!data.score || data.score.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Score is required for completed tasks.',
          path: ['score'],
        })
      } else {
        const scoreNum = Number(data.score)
        if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Score must be a number between 0 and 100.',
            path: ['score'],
          })
        }
      }
    }
  })

type SubmissionFormValues = z.infer<typeof formSchema>

function getStatusBadge(status: string) {
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

function getPriorityBadge(priority: string) {
  const colors: Record<string, string> = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-emerald-100 text-emerald-700',
  }
  return (
    <Badge className={`${colors[priority] || 'bg-gray-100 text-gray-700'} text-xs rounded-full`}>
      {priority}
    </Badge>
  )
}

function getDaysUntilDue(dueDate: string) {
  const due = new Date(dueDate)
  const today = new Date()
  const diffTime = due.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return { text: `${Math.abs(diffDays)} days overdue`, color: 'text-red-600' }
  if (diffDays === 0) return { text: 'Due today', color: 'text-orange-600' }
  if (diffDays === 1) return { text: 'Due tomorrow', color: 'text-orange-600' }
  return { text: `${diffDays} days left`, color: 'text-muted-foreground' }
}

export default function SubmitTaskPage() {
  const [submissionSuccess, setSubmissionSuccess] = useState(false)
  const [selectedTaskDetails, setSelectedTaskDetails] = useState<AssignedTask | null>(null)
  const [tasks, setTasks] = useState<AssignedTask[]>([])
  const [loadingTasks, setLoadingTasks] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const data = await listAssignedTasksForCurrentWorker()
        type RawTask = {
          id: number
          clientName: string
          courseName: string
          taskType: string
          platform: string
          dueTime: string
          status: 'Completed' | 'In Progress' | 'Pending'
          priority: 'high' | 'medium' | 'low'
          estimatedTime: string
        }
        if (active) {
          const mapped = (data as RawTask[]).map((d) => ({
            ...d,
            dueDate: d.dueTime ? d.dueTime.split('T')[0] : '',
          }))
          setTasks(mapped)
        }
      } catch (e) {
        console.error('Failed to load assigned tasks', e)
      } finally {
        if (active) setLoadingTasks(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const form = useForm<SubmissionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      taskId: '',
      status: 'In Progress',
      notes: '',
      score: '',
      file: undefined,
    },
  })

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = form
  const selectedStatus = watch('status')
  const selectedTaskId = watch('taskId')

  // Update task details when task is selected
  const handleTaskSelect = (taskId: string) => {
    setValue('taskId', taskId)
    const task = tasks.find((t) => String(t.id) === taskId || t.id === Number(taskId))
    setSelectedTaskDetails(task || null)
  }

  const onSubmit = async (data: SubmissionFormValues) => {
    const taskIdNum = Number(data.taskId)
    if (!taskIdNum) return
    try {
      await updateTaskStatus(taskIdNum, data.status, {
        score: data.score ? Number(data.score) : undefined,
        notes: data.notes || undefined,
      })
      setSubmissionSuccess(true)
      // Refresh tasks list
      const refreshed = await listAssignedTasksForCurrentWorker()
      type RawTask = {
        id: number
        clientName: string
        courseName: string
        taskType: string
        platform: string
        dueTime: string
        status: 'Completed' | 'In Progress' | 'Pending'
        priority: 'high' | 'medium' | 'low'
        estimatedTime: string
      }
      const mapped = (refreshed as RawTask[]).map((d) => ({
        ...d,
        dueDate: d.dueTime ? d.dueTime.split('T')[0] : '',
      }))
      setTasks(mapped)
      reset()
      setSelectedTaskDetails(null)
      setTimeout(() => setSubmissionSuccess(false), 5000)
    } catch (e) {
      console.error('Failed to submit task update', e)
    }
  }

  return (
    <div className="flex-1 space-y-4 sm:space-y-6">
      {/* Header */}
      <Card className="bg-[var(--primary)] text-[var(--primary-foreground)] border-0 rounded-xl sm:rounded-2xl shadow">
        <CardContent className="p-4 sm:p-6 flex flex-col gap-3 sm:gap-4">
          <div>
            <h2 className="text-lg sm:text-2xl font-bold mb-1">Submit Task 📝</h2>
            <p className="opacity-80 text-sm sm:text-base">
              Update task status and submit your completed work
            </p>
          </div>
          <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm">
            <span className="flex items-center gap-1 opacity-90">
              <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {tasks.length} Assigned Tasks
            </span>
            <span className="flex items-center gap-1 opacity-90">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {tasks.filter((t) => t.status === 'In Progress').length} In Progress
            </span>
            <span className="flex items-center gap-1 opacity-90">
              <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {tasks.filter((t) => t.status === 'Completed').length} Completed
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3 min-w-0">
        {/* Task Submission Form */}
        <Card className="lg:col-span-2 rounded-xl sm:rounded-2xl shadow-sm border border-[var(--border)] bg-[var(--card)]">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-xl text-foreground">
              Task Submission Form
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Update task status and submit your completed work.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            {submissionSuccess && (
              <div className="bg-green-100 text-green-800 p-3 rounded-lg mb-4 text-center text-sm border border-green-200">
                <CheckCircle className="h-4 w-4 inline mr-2" />
                Task submitted successfully!
              </div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
              {/* Task Selector */}
              <div className="grid gap-2">
                <Label htmlFor="taskId" className="text-sm font-medium">
                  Select Task
                </Label>
                <Select onValueChange={handleTaskSelect} value={selectedTaskId}>
                  <SelectTrigger
                    className={cn('rounded-xl border-gray-200', errors.taskId && 'border-red-500')}
                  >
                    <SelectValue placeholder="Choose a task to update" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingTasks && (
                      <SelectItem value="__loading" disabled>
                        Loading...
                      </SelectItem>
                    )}
                    {!loadingTasks &&
                      tasks.map((task) => (
                        <SelectItem key={task.id} value={String(task.id)}>
                          {task.id} - {task.clientName} ({task.courseName})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {errors.taskId && (
                  <p className="text-red-500 text-xs mt-1">
                    {typeof errors.taskId.message === 'string'
                      ? errors.taskId.message
                      : 'Please select a task'}
                  </p>
                )}
              </div>

              {/* Status Selector */}
              <div className="grid gap-2">
                <Label htmlFor="status" className="text-sm font-medium">
                  Task Status
                </Label>
                <Select
                  onValueChange={(value) =>
                    setValue('status', value as 'In Progress' | 'Completed')
                  }
                  value={selectedStatus}
                >
                  <SelectTrigger
                    className={cn('rounded-xl border-gray-200', errors.status && 'border-red-500')}
                  >
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="text-red-500 text-xs mt-1">{errors.status.message}</p>
                )}
              </div>

              {/* Score Input (only if completed) */}
              {selectedStatus === 'Completed' && (
                <div className="grid gap-2">
                  <Label htmlFor="score" className="text-sm font-medium">
                    Score (%)
                  </Label>
                  <Input
                    id="score"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Enter score (0-100)"
                    className={cn('rounded-xl border-gray-200', errors.score && 'border-red-500')}
                    {...register('score')}
                  />
                  {errors.score && (
                    <p className="text-red-500 text-xs mt-1">{errors.score.message}</p>
                  )}
                </div>
              )}

              {/* Notes */}
              <div className="grid gap-2">
                <Label htmlFor="notes" className="text-sm font-medium">
                  Notes (Optional)
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes or comments about your progress..."
                  className="rounded-xl border-gray-200 min-h-[100px]"
                  {...register('notes')}
                />
              </div>

              {/* File Upload */}
              <div className="grid gap-2">
                <Label htmlFor="file" className="text-sm font-medium">
                  Attach File (Optional)
                </Label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-gray-300 transition-colors">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <Input
                    id="file"
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.jpg,.png"
                    {...register('file')}
                  />
                  <Label
                    htmlFor="file"
                    className="cursor-pointer text-sm text-gray-600 hover:text-gray-800"
                  >
                    Click to upload or drag and drop
                    <br />
                    <span className="text-xs text-gray-400">
                      PDF, DOC, TXT, JPG, PNG (max 10MB)
                    </span>
                  </Label>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
              >
                {isSubmitting ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Submit Task
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Task Details & Quick Actions */}
        <div className="space-y-4 sm:space-y-6 min-w-0">
          {/* Selected Task Details */}
          {selectedTaskDetails && (
            <Card className="rounded-xl sm:rounded-2xl shadow-sm border border-[var(--border)] bg-[var(--card)]">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-sm sm:text-lg text-foreground">Task Details</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
                <div>
                  <h4 className="font-medium text-sm sm:text-base text-foreground mb-2">
                    {selectedTaskDetails.clientName}
                  </h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {selectedTaskDetails.courseName} - {selectedTaskDetails.taskType}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedTaskDetails.status)}
                  {getPriorityBadge(selectedTaskDetails.priority)}
                </div>

                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="text-muted-foreground">Due Date:</span>
                  <span
                    className={`font-medium ${getDaysUntilDue(selectedTaskDetails.dueDate).color}`}
                  >
                    {new Date(selectedTaskDetails.dueDate).toLocaleDateString()}
                  </span>
                </div>

                <div className="text-center">
                  <span
                    className={`text-xs sm:text-sm font-medium ${getDaysUntilDue(selectedTaskDetails.dueDate).color}`}
                  >
                    {getDaysUntilDue(selectedTaskDetails.dueDate).text}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <Card className="rounded-xl sm:rounded-2xl shadow-sm border border-[var(--border)] bg-[var(--card)]">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-sm sm:text-lg text-foreground">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-lg sm:text-2xl font-bold text-blue-600">
                    {tasks.filter((t) => t.status === 'In Progress').length}
                  </div>
                  <div className="text-[10px] sm:text-xs text-blue-600">In Progress</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-lg sm:text-2xl font-bold text-yellow-600">
                    {tasks.filter((t) => t.status === 'Pending').length}
                  </div>
                  <div className="text-[10px] sm:text-xs text-yellow-600">Pending</div>
                </div>
              </div>

              {/* Urgent Tasks Alert */}
              {tasks.some(
                (task) =>
                  getDaysUntilDue(task.dueDate).text.includes('overdue') ||
                  getDaysUntilDue(task.dueDate).text.includes('today'),
              ) && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800">Urgent Tasks</span>
                  </div>
                  <p className="text-xs text-red-700">
                    You have tasks that are due today or overdue. Please prioritize these
                    submissions.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
