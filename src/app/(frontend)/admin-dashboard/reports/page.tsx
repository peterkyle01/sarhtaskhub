'use client'

import { useState } from 'react'
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

// Mock activity log data
const mockActivityLogs = [
  {
    id: 'LOG001',
    type: 'task_completed',
    title: 'Task Completed',
    description: 'Task TSK002 (Statistics Assignment) marked as completed',
    actor: 'Mike Chen',
    actorRole: 'Worker',
    timestamp: '2024-02-07T14:30:00Z',
    details: {
      taskId: 'TSK002',
      clientName: 'Emily Johnson',
      score: 95,
      platform: 'ALEKS',
    },
  },
  {
    id: 'LOG002',
    type: 'client_onboarded',
    title: 'New Client Onboarded',
    description: 'Jessica Miller has been added to the system',
    actor: 'Sarah Wilson',
    actorRole: 'Admin',
    timestamp: '2024-02-07T13:15:00Z',
    details: {
      clientName: 'Jessica Miller',
      platform: 'ALEKS',
      courseName: 'Geometry',
    },
  },
  {
    id: 'LOG003',
    type: 'worker_edited',
    title: 'Worker Profile Updated',
    description: "Alex Thompson's profile information was modified",
    actor: 'Admin User',
    actorRole: 'Admin',
    timestamp: '2024-02-07T12:45:00Z',
    details: {
      workerName: 'Alex Thompson',
      changes: ['Email updated', 'Specialties modified'],
    },
  },
  {
    id: 'LOG004',
    type: 'task_assigned',
    title: 'Task Assigned',
    description: 'Task TSK006 assigned to Sarah Wilson',
    actor: 'Admin User',
    actorRole: 'Admin',
    timestamp: '2024-02-07T11:20:00Z',
    details: {
      taskId: 'TSK006',
      workerName: 'Sarah Wilson',
      clientName: 'Jessica Miller',
      taskType: 'Course',
    },
  },
  {
    id: 'LOG005',
    type: 'task_overdue',
    title: 'Task Overdue',
    description: 'Task TSK003 has passed its deadline',
    actor: 'System',
    actorRole: 'System',
    timestamp: '2024-02-07T10:00:00Z',
    details: {
      taskId: 'TSK003',
      clientName: 'Michael Brown',
      dueDate: '2024-02-06',
      platform: 'Cengage',
    },
  },
  {
    id: 'LOG006',
    type: 'worker_added',
    title: 'New Worker Added',
    description: 'Emma Davis joined the team',
    actor: 'Admin User',
    actorRole: 'Admin',
    timestamp: '2024-02-07T09:30:00Z',
    details: {
      workerName: 'Emma Davis',
      specialties: ['Calculus', 'Linear Algebra'],
    },
  },
  {
    id: 'LOG007',
    type: 'task_updated',
    title: 'Task Status Updated',
    description: 'Task TSK001 status changed to In Progress',
    actor: 'Sarah Wilson',
    actorRole: 'Worker',
    timestamp: '2024-02-07T08:45:00Z',
    details: {
      taskId: 'TSK001',
      clientName: 'John Smith',
      oldStatus: 'Pending',
      newStatus: 'In Progress',
    },
  },
  {
    id: 'LOG008',
    type: 'client_deleted',
    title: 'Client Removed',
    description: 'Client record for Test User was deleted',
    actor: 'Admin User',
    actorRole: 'Admin',
    timestamp: '2024-02-06T16:20:00Z',
    details: {
      clientName: 'Test User',
      reason: 'Duplicate entry',
    },
  },
]

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

  // Filter logs based on search term and filters
  const filteredLogs = mockActivityLogs.filter((log) => {
    const matchesSearch =
      log.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actor.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesActor = actorFilter === 'all' || log.actor === actorFilter
    const matchesType = typeFilter === 'all' || log.type === typeFilter

    let matchesDateRange = true
    if (dateRange.from && dateRange.to) {
      const logDate = new Date(log.timestamp)
      const fromDate = new Date(dateRange.from)
      const toDate = new Date(dateRange.to)
      matchesDateRange = logDate >= fromDate && logDate <= toDate
    }

    return matchesSearch && matchesActor && matchesType && matchesDateRange
  })

  const handleDownloadReport = () => {
    // Here you would implement the actual download functionality
    console.log('Downloading report with filters:', {
      searchTerm,
      actorFilter,
      typeFilter,
      dateRange,
    })
    // For demo purposes, we'll just show an alert
    alert('Report download started! (This is a demo)')
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
                <SelectItem value="worker_added">Worker Added</SelectItem>
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
            Recent system activities and changes ({filteredLogs.length} entries)
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

                        {/* Activity Details */}
                        {log.details && (
                          <div className="text-xs text-muted-foreground space-y-1">
                            {log.type === 'task_completed' && (
                              <div className="flex flex-wrap gap-4">
                                <span>Client: {log.details.clientName}</span>
                                <span>Score: {log.details.score}%</span>
                                <span>Platform: {log.details.platform}</span>
                              </div>
                            )}
                            {log.type === 'client_onboarded' && (
                              <div className="flex flex-wrap gap-4">
                                <span>Platform: {log.details.platform}</span>
                                <span>Course: {log.details.courseName}</span>
                              </div>
                            )}
                            {log.type === 'task_assigned' && (
                              <div className="flex flex-wrap gap-4">
                                <span>Worker: {log.details.workerName}</span>
                                <span>Client: {log.details.clientName}</span>
                                <span>Type: {log.details.taskType}</span>
                              </div>
                            )}
                            {log.type === 'worker_edited' && (
                              <div>Changes: {log.details.changes?.join(', ')}</div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actor and Timestamp */}
                      <div className="flex-shrink-0 text-right">
                        <div className="flex items-center gap-2 mb-1">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src="/placeholder.svg" alt={log.actor} />
                            <AvatarFallback className="text-xs">
                              {log.actor
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium">{log.actor}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatTimestamp(log.timestamp)}
                        </div>
                        <Badge variant="outline" className="text-xs mt-1">
                          {log.actorRole}
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
