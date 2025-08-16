'use client'

import React from 'react'
import { useState, useTransition } from 'react'
import { createClient, updateClient } from '@/server-actions/client-actions'
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
import { useRouter } from 'next/navigation'

export interface TutorUser {
  id: string | number
  fullName?: string
  email?: string
}

export interface ClientItem {
  id: string | number
  name: string
  platform: string
  courseName: string
  deadline?: string
  progress: string
  assignedTutor?: TutorUser | string | number | null
  notes?: string
}
interface Props {
  initialClients: ClientItem[]
  tutors: TutorUser[]
  clientUsers?: { id: string | number; fullName?: string; email?: string }[]
}

function getProgressBadge(status: string) {
  switch (status) {
    case 'Completed':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>
    case 'In Progress':
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">In Progress</Badge>
    case 'Not Started':
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Not Started</Badge>
    case 'Overdue':
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Overdue</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

function getPlatformBadge(platform: string) {
  return platform === 'Cengage' ? (
    <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Cengage</Badge>
  ) : (
    <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">ALEKS</Badge>
  )
}

function getDeadlineStatus(deadline: string) {
  const today = new Date()
  const deadlineDate = new Date(deadline)
  const diffTime = deadlineDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return 'overdue'
  if (diffDays <= 3) return 'urgent'
  if (diffDays <= 7) return 'upcoming'
  return 'normal'
}

export default function ClientsClient({ initialClients, tutors, clientUsers = [] }: Props) {
  const [searchTerm, setSearchTerm] = useState('')
  const [platformFilter, setPlatformFilter] = useState('all')
  const [deadlineFilter, setDeadlineFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<ClientItem | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [optimisticClients, setOptimisticClients] = useState<ClientItem[]>(initialClients)
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  const itemsPerPage = 5

  const filteredClients = optimisticClients.filter((client) => {
    const name = client.name || ''
    const courseName = client.courseName || ''
    const clientId = client.id || ''
    const platform = client.platform || ''
    const matchesSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(clientId).toLowerCase().includes(searchTerm.toLowerCase())
    const matchesPlatform = platformFilter === 'all' || platform === platformFilter
    const deadlineRaw = client.deadline
    const deadlineStatus = deadlineRaw ? getDeadlineStatus(deadlineRaw) : 'normal'
    const matchesDeadline =
      deadlineFilter === 'all' ||
      (deadlineFilter === 'urgent' &&
        (deadlineStatus === 'urgent' || deadlineStatus === 'overdue')) ||
      (deadlineFilter === 'upcoming' && deadlineStatus === 'upcoming') ||
      (deadlineFilter === 'normal' && deadlineStatus === 'normal')
    return matchesSearch && matchesPlatform && matchesDeadline
  })

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedClients = filteredClients.slice(startIndex, startIndex + itemsPerPage)

  async function handleCreate(formData: FormData) {
    const tempId = 'temp-' + Date.now()
    const optimistic: ClientItem = {
      id: tempId,
      // removed clientId
      name: '', // will resolve to user fullName after refresh
      platform: formData.get('platform') as string,
      courseName: formData.get('courseName') as string,
      deadline: (formData.get('deadline') as string) || undefined,
      progress: 'Not Started',
      assignedTutor: (formData.get('assignedTutor') as string) || undefined,
      notes: (formData.get('notes') as string) || undefined,
    }
    setOptimisticClients((prev) => [optimistic, ...prev])
    setIsAddModalOpen(false)
    startTransition(async () => {
      try {
        await createClient(formData)
        // Force refresh to get updated data from server
        router.refresh()
        // Small delay to ensure server revalidation is complete
        setTimeout(() => router.refresh(), 100)
      } catch (_e) {
        // rollback on error
        setOptimisticClients((prev) => prev.filter((c) => c.id !== tempId))
        // Show error message to user
        console.error('Failed to create client:', _e)
      }
    })
  }

  function handleEditSave(data: Partial<ClientItem>) {
    if (!editingClient) return
    const updatedClient: ClientItem = {
      ...editingClient,
      ...data,
      id: editingClient.id,
      // removed clientId
    }
    console.log('handleEditSave - received data:', data)
    console.log(
      'handleEditSave - updatedClient.assignedTutor:',
      updatedClient.assignedTutor,
      typeof updatedClient.assignedTutor,
    )

    const finalAssignedTutor =
      typeof updatedClient.assignedTutor === 'object' && updatedClient.assignedTutor
        ? Number(updatedClient.assignedTutor.id)
        : typeof updatedClient.assignedTutor === 'number'
          ? updatedClient.assignedTutor
          : typeof updatedClient.assignedTutor === 'string' && updatedClient.assignedTutor
            ? Number(updatedClient.assignedTutor)
            : null

    console.log('handleEditSave - final assignedTutor:', finalAssignedTutor)

    setOptimisticClients((prev) =>
      prev.map((client) => (client.id === updatedClient.id ? updatedClient : client)),
    )
    startTransition(async () => {
      try {
        await updateClient(updatedClient.id, {
          platform: updatedClient.platform as 'Cengage' | 'ALEKS' | undefined,
          courseName: updatedClient.courseName,
          deadline: updatedClient.deadline,
          assignedTutor: finalAssignedTutor,
          notes: updatedClient.notes,
        })
        // Force refresh to get updated data from server
        router.refresh()
        // Small delay to ensure server revalidation is complete
        setTimeout(() => router.refresh(), 100)
      } catch (_e) {
        setOptimisticClients((prev) =>
          prev.map((client) => (client.id === updatedClient.id ? editingClient : client)),
        )
        // Show error message to user
        console.error('Failed to update client:', _e)
      }
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Clients</CardTitle>
              <CardDescription>
                Manage and track all your clients and their progress
              </CardDescription>
            </div>
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Client
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Client</DialogTitle>
                  <DialogDescription>
                    Enter the client details below to add them to the system.
                  </DialogDescription>
                </DialogHeader>
                <form action={handleCreate} className="grid gap-4 py-4">
                  {/* Removed explicit Client Name field; will use selected user fullName */}
                  <div className="grid gap-2">
                    <Label htmlFor="platform">Platform</Label>
                    <Select
                      onValueChange={(v) => {
                        const hidden =
                          document.querySelector<HTMLInputElement>('input[name="platform"]')
                        if (hidden) hidden.value = v
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cengage">Cengage</SelectItem>
                        <SelectItem value="ALEKS">ALEKS</SelectItem>
                      </SelectContent>
                    </Select>
                    <input type="hidden" name="platform" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="courseName">Course Name</Label>
                    <Input
                      id="courseName"
                      name="courseName"
                      placeholder="Enter course name"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="deadline">Deadline</Label>
                    <Input id="deadline" name="deadline" type="date" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="assignedTutor">Assigned Tutor</Label>
                    <Select
                      onValueChange={(v) => {
                        const hidden = document.querySelector<HTMLInputElement>(
                          'input[name="assignedTutor"]',
                        )
                        if (hidden) hidden.value = v
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select tutor" />
                      </SelectTrigger>
                      <SelectContent>
                        {tutors.map((t) => (
                          <SelectItem key={String(t.id)} value={String(t.id)}>
                            {t.fullName || t.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <input type="hidden" name="assignedTutor" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="user">Client User</Label>
                    <Select
                      onValueChange={(v) => {
                        const hidden =
                          document.querySelector<HTMLInputElement>('input[name="user"]')
                        if (hidden) hidden.value = v
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select client user" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientUsers.map((u) => (
                          <SelectItem key={String(u.id)} value={String(u.id)}>
                            {u.fullName || u.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <input type="hidden" name="user" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea id="notes" name="notes" placeholder="Additional notes..." />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={pending}>
                      {pending ? 'Adding...' : 'Add Client'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="Cengage">Cengage</SelectItem>
                <SelectItem value="ALEKS">ALEKS</SelectItem>
              </SelectContent>
            </Select>
            <Select value={deadlineFilter} onValueChange={setDeadlineFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Deadline" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Deadlines</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Course Name</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Progress Status</TableHead>
                  <TableHead>Assigned Tutor</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedClients.map((client) => (
                  <TableRow
                    key={String(client.id)}
                    className={String(client.id).startsWith('temp-') ? 'opacity-60' : ''}
                  >
                    <TableCell className="font-medium">{String(client.id)}</TableCell>
                    <TableCell>{client.name}</TableCell>
                    <TableCell>{getPlatformBadge(client.platform)}</TableCell>
                    <TableCell>{client.courseName}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>
                          {client.deadline ? new Date(client.deadline).toLocaleDateString() : '-'}
                        </span>
                        <span
                          className={`text-xs ${
                            client.deadline && getDeadlineStatus(client.deadline) === 'overdue'
                              ? 'text-red-600'
                              : client.deadline && getDeadlineStatus(client.deadline) === 'urgent'
                                ? 'text-orange-600'
                                : client.deadline &&
                                    getDeadlineStatus(client.deadline) === 'upcoming'
                                  ? 'text-yellow-600'
                                  : 'text-muted-foreground'
                          }`}
                        >
                          {client.deadline
                            ? getDeadlineStatus(client.deadline) === 'overdue'
                              ? 'Overdue'
                              : getDeadlineStatus(client.deadline) === 'urgent'
                                ? 'Due soon'
                                : getDeadlineStatus(client.deadline) === 'upcoming'
                                  ? 'Upcoming'
                                  : '—'
                            : '—'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getProgressBadge(client.progress)}</TableCell>
                    <TableCell>
                      {typeof client.assignedTutor === 'object' &&
                      client.assignedTutor !== null &&
                      !Array.isArray(client.assignedTutor)
                        ? client.assignedTutor.fullName || client.assignedTutor.email
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingClient(client)
                            setIsEditOpen(true)
                          }}
                        >
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
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to{' '}
              {Math.min(startIndex + itemsPerPage, filteredClients.length)} of{' '}
              {filteredClients.length} clients
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" /> Previous
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
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <EditClientDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        client={editingClient}
        tutors={tutors}
        onSave={handleEditSave}
      />
    </div>
  )
}

// Edit dialog component appended
function EditClientDialog({
  open,
  onOpenChange,
  client,
  tutors,
  onSave,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  client: ClientItem | null
  tutors: TutorUser[]
  onSave: (data: Partial<ClientItem>) => void
}) {
  const unset = {
    platform: !client?.platform,
    courseName: !client?.courseName,
    deadline: !client?.deadline,
  }
  const [formState, setFormState] = React.useState({
    platform: client?.platform || '',
    courseName: client?.courseName || '',
    deadline: client?.deadline ? client.deadline.slice(0, 10) : '',
    assignedTutor:
      client && typeof client.assignedTutor === 'object' && client.assignedTutor !== null
        ? String(client.assignedTutor.id)
        : client && typeof client.assignedTutor === 'number'
          ? String(client.assignedTutor)
          : client && typeof client.assignedTutor === 'string'
            ? client.assignedTutor
            : '',
    notes: client?.notes || '',
  })
  React.useEffect(() => {
    setFormState({
      platform: client?.platform || '',
      courseName: client?.courseName || '',
      deadline: client?.deadline ? client.deadline.slice(0, 10) : '',
      assignedTutor:
        client && typeof client.assignedTutor === 'object' && client.assignedTutor !== null
          ? String(client.assignedTutor.id)
          : client && typeof client.assignedTutor === 'number'
            ? String(client.assignedTutor)
            : client && typeof client.assignedTutor === 'string'
              ? client.assignedTutor
              : '',
      notes: client?.notes || '',
    })
  }, [client])
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        {!client ? (
          <div className="py-8 text-sm text-muted-foreground">No client selected.</div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Edit Client</DialogTitle>
              <DialogDescription>
                Update non-user fields below. Name is managed on the Users page.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-1">
                <Label>Name</Label>
                <div className="text-sm font-medium">{client.name || '—'}</div>
                <p className="text-xs text-muted-foreground">
                  Edit this name from Users &gt; User Management.
                </p>
              </div>
              <div className="grid gap-2">
                <Label>
                  Platform{' '}
                  {unset.platform && <span className="text-xs text-orange-600">(unset)</span>}
                </Label>
                <Select
                  value={formState.platform}
                  onValueChange={(v) => setFormState((s) => ({ ...s, platform: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cengage">Cengage</SelectItem>
                    <SelectItem value="ALEKS">ALEKS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-courseName">
                  Course Name{' '}
                  {unset.courseName && <span className="text-xs text-orange-600">(unset)</span>}
                </Label>
                <Input
                  id="edit-courseName"
                  value={formState.courseName}
                  onChange={(e) => setFormState((s) => ({ ...s, courseName: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-deadline">
                  Deadline{' '}
                  {unset.deadline && <span className="text-xs text-orange-600">(unset)</span>}
                </Label>
                <Input
                  id="edit-deadline"
                  type="date"
                  value={formState.deadline}
                  onChange={(e) => setFormState((s) => ({ ...s, deadline: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Assigned Tutor</Label>
                <Select
                  value={formState.assignedTutor}
                  onValueChange={(v) => setFormState((s) => ({ ...s, assignedTutor: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tutor" />
                  </SelectTrigger>
                  <SelectContent>
                    {tutors.map((t) => (
                      <SelectItem key={String(t.id)} value={String(t.id)}>
                        {t.fullName || t.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  value={formState.notes}
                  onChange={(e) => setFormState((s) => ({ ...s, notes: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const tutorValue = formState.assignedTutor
                    ? Number(formState.assignedTutor)
                    : null
                  console.log(
                    'Edit form - assignedTutor value:',
                    formState.assignedTutor,
                    'converted to:',
                    tutorValue,
                  )
                  onSave({
                    platform: formState.platform,
                    courseName: formState.courseName,
                    deadline: formState.deadline,
                    assignedTutor: tutorValue,
                    notes: formState.notes,
                  })
                  onOpenChange(false)
                }}
              >
                Save
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
