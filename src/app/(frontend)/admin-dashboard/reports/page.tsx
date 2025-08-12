'use client'

import { useEffect, useState } from 'react'
import {
  Search,
  Download,
  Calendar,
  Clock,
  UserPlus,
  Edit,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'

interface UILogMetadata {
  clientName?: string
  workerName?: string
  changes?: string[]
  [key: string]: unknown
}

interface UILog {
  id: number | string
  type: string
  title: string
  description?: string | null
  actorName?: string
  actorRole?: string
  createdAt: string
  metadata?: UILogMetadata | null
}

function safeField<T extends object>(obj: unknown, key: keyof T): string | undefined {
  if (obj && typeof obj === 'object' && key in obj) {
    const val = (obj as T)[key]
    return typeof val === 'string' ? val : undefined
  }
  return undefined
}

const actors = ['Mike Chen', 'Sarah Wilson', 'Admin User', 'System', 'Lisa Rodriguez', 'John Doe']

function getActivityIcon(type: string) {
  switch (type) {
    case 'task_completed':
      return <CheckCircle className="h-4 w-4 text-green-600" />
    case 'task_assigned':
      return <UserPlus className="h-4 w-4 text-blue-600" />
    case 'task_updated':
      return <Edit className="h-4 w-4 text-blue-600" />
    case 'task_overdue':
      return <AlertCircle className="h-4 w-4 text-red-600" />
    case 'client_onboarded':
      return <UserPlus className="h-4 w-4 text-green-600" />
    case 'client_deleted':
      return <Trash2 className="h-4 w-4 text-red-600" />
    case 'worker_added':
      return <Plus className="h-4 w-4 text-green-600" />
    case 'worker_edited':
      return <Edit className="h-4 w-4 text-orange-600" />
    default:
      return <Clock className="h-4 w-4 text-gray-600" />
  }
}

function getActivityBadge(type: string) {
  const badges = {
    task_completed: { label: 'Task', color: 'bg-green-100 text-green-800' },
    task_assigned: { label: 'Task', color: 'bg-blue-100 text-blue-800' },
    task_updated: { label: 'Task', color: 'bg-blue-100 text-blue-800' },
    task_overdue: { label: 'Task', color: 'bg-red-100 text-red-800' },
    client_onboarded: { label: 'Client', color: 'bg-green-100 text-green-800' },
    client_deleted: { label: 'Client', color: 'bg-red-100 text-red-800' },
    worker_added: { label: 'Worker', color: 'bg-green-100 text-green-800' },
    worker_edited: { label: 'Worker', color: 'bg-orange-100 text-orange-800' },
  }

  const badge = badges[type as keyof typeof badges] || {
    label: 'System',
    color: 'bg-gray-100 text-gray-800',
  }
  return <Badge className={`${badge.color} hover:${badge.color} text-xs`}>{badge.label}</Badge>
}

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

  if (diffInHours < 1) return 'Just now'
  if (diffInHours < 24) return `${diffInHours}h ago`
  if (diffInHours < 48) return 'Yesterday'
  return date.toLocaleDateString()
}

export default function ReportsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [actorFilter, setActorFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false)
  const [logs, setLogs] = useState<UILog[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      try {
        const { fetchActivityLogs } = await import('@/server-actions/activity-actions')
        const fetched = await fetchActivityLogs({})
        if (!active) return
        const mapped: UILog[] = fetched.map((l) => ({
          id: l.id,
          type: l.type,
          title: l.title,
          description: l.description || undefined,
          actorName: safeField<{ fullName: string }>(l.actor, 'fullName'),
          actorRole: safeField<{ role: string }>(l.actor, 'role'),
          createdAt: l.createdAt,
          metadata: (l.metadata || null) as UILogMetadata | null,
        }))
        setLogs(mapped)
      } catch (e) {
        console.error('Failed to load activity logs', e)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  // Filter logs based on search term and filters
  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.actorName || '').toLowerCase().includes(searchTerm.toLowerCase())

    const matchesActor = actorFilter === 'all' || log.actorName === actorFilter
    const matchesType = typeFilter === 'all' || log.type === typeFilter

    let matchesDateRange = true
    if (dateRange.from && dateRange.to) {
      const logDate = new Date(log.createdAt)
      const fromDate = new Date(dateRange.from)
      const toDate = new Date(dateRange.to)
      matchesDateRange = logDate >= fromDate && logDate <= toDate
    }

    return matchesSearch && matchesActor && matchesType && matchesDateRange
  })

  function toCSV(rows: UILog[]): string {
    const headers = [
      'id',
      'type',
      'title',
      'description',
      'actorName',
      'actorRole',
      'createdAt',
      'metadata',
    ]
    const escape = (v: unknown) => {
      if (v === null || v === undefined) return ''
      const str = String(v)
      if (/[",\n]/.test(str)) return '"' + str.replace(/"/g, '""') + '"'
      return str
    }
    const lines = [headers.join(',')]
    for (const l of rows) {
      lines.push(
        [
          l.id,
          l.type,
          l.title,
          l.description || '',
          l.actorName || '',
          l.actorRole || '',
          l.createdAt,
          l.metadata ? JSON.stringify(l.metadata) : '',
        ]
          .map(escape)
          .join(','),
      )
    }
    return lines.join('\n')
  }

  const handleDownloadReport = () => {
    const csv = toCSV(filteredLogs)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19)
    a.href = url
    a.download = `activity-report-${stamp}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const clearDateFilter = () => {
    setDateRange({ from: '', to: '' })
  }

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Activity Filters</CardTitle>
              <CardDescription>Filter and search through system activity logs</CardDescription>
            </div>
            <Button onClick={handleDownloadReport} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            {/* Search Bar */}
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Actor Filter */}
            <Select value={actorFilter} onValueChange={setActorFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {actors.map((actor) => (
                  <SelectItem key={actor} value={actor}>
                    {actor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Activity Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Activities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activities</SelectItem>
                <SelectItem value="task_completed">Task Completed</SelectItem>
                <SelectItem value="task_assigned">Task Assigned</SelectItem>
                <SelectItem value="task_updated">Task Updated</SelectItem>
                <SelectItem value="client_onboarded">Client Added</SelectItem>
                <SelectItem value="worker_added">Tutor Added</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Range Filter */}
            <Popover open={isDateFilterOpen} onOpenChange={setIsDateFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {dateRange.from && dateRange.to
                    ? `${new Date(dateRange.from).toLocaleDateString()} - ${new Date(dateRange.to).toLocaleDateString()}`
                    : 'Date Range'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="from-date">From Date</Label>
                    <Input
                      id="from-date"
                      type="date"
                      value={dateRange.from}
                      onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="to-date">To Date</Label>
                    <Input
                      id="to-date"
                      type="date"
                      value={dateRange.to}
                      onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => setIsDateFilterOpen(false)} className="flex-1">
                      Apply
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={clearDateFilter}
                      className="flex-1"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Activity Timeline</CardTitle>
          <CardDescription>
            Recent system activities and changes (
            {loading ? 'Loading...' : filteredLogs.length + ' entries'})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No activities found matching your filters.</p>
              </div>
            ) : (
              filteredLogs.map((log) => (
                <Card
                  key={log.id}
                  className="shadow-sm border-l-4 border-l-blue-200 hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Activity Icon */}
                      <div className="flex-shrink-0 mt-1">{getActivityIcon(log.type)}</div>

                      {/* Activity Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm">{log.title}</h4>
                          {getActivityBadge(log.type)}
                        </div>

                        <p className="text-sm text-muted-foreground mb-2">{log.description}</p>

                        {log.metadata && (
                          <div className="text-xs text-muted-foreground space-y-1">
                            {log.type === 'task_completed' && log.metadata.clientName && (
                              <div className="flex flex-wrap gap-4">
                                <span>Client: {log.metadata.clientName}</span>
                              </div>
                            )}
                            {log.type === 'task_assigned' && (
                              <div className="flex flex-wrap gap-4">
                                {log.metadata.workerName && (
                                  <span>Worker: {log.metadata.workerName}</span>
                                )}
                                {log.metadata.clientName && (
                                  <span>Client: {log.metadata.clientName}</span>
                                )}
                              </div>
                            )}
                            {log.type === 'worker_edited' &&
                              Array.isArray(log.metadata.changes) && (
                                <div>Changes: {log.metadata.changes.join(', ')}</div>
                              )}
                          </div>
                        )}
                      </div>

                      {/* Actor and Timestamp */}
                      <div className="flex-shrink-0 text-right">
                        <div className="flex items-center gap-2 mb-1">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src="/placeholder.svg" alt={log.actorName || 'User'} />
                            <AvatarFallback className="text-xs">
                              {(log.actorName || 'U')
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium">{log.actorName || '—'}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatTimestamp(log.createdAt)}
                        </div>
                        <Badge variant="outline" className="text-xs mt-1">
                          {log.actorRole || 'System'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
