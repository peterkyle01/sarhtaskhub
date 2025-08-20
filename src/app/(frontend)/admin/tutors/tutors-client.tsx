'use client'

import { useState, useTransition } from 'react'
import { Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight, KeyRound } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { Label } from '@/components/ui/label'
import {
  createTutor,
  deleteTutor,
  updateTutor,
  resetTutorPassword,
  TutorDoc,
} from '@/server-actions/tutors-actions'
import { Subject } from '@/payload-types'
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface Props {
  initialTutors: TutorDoc[]
  availableSubjects: Subject[]
}

export default function TutorsClient({ initialTutors, availableSubjects }: Props) {
  const [tutors, setTutors] = useState<TutorDoc[]>(initialTutors)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isPasswordResetModalOpen, setIsPasswordResetModalOpen] = useState(false)
  const [editingTutor, setEditingTutor] = useState<TutorDoc | null>(null)
  const [resetPasswordTutor, setResetPasswordTutor] = useState<TutorDoc | null>(null)
  const [newTutorData, setNewTutorData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
  })
  const [editTutorData, setEditTutorData] = useState({
    fullName: '',
    phone: '',
    subjects: [] as number[],
  })
  const [newPassword, setNewPassword] = useState('')
  const [isPending, startTransition] = useTransition()

  const itemsPerPage = 6

  const filtered = tutors.filter((t) => {
    const matchesSearch =
      !searchTerm ||
      [t.fullName, t.email, t.phone]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(searchTerm.toLowerCase()))

    return matchesSearch
  })

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage)

  function handleAddTutor() {
    if (
      !newTutorData.fullName.trim() ||
      !newTutorData.email.trim() ||
      !newTutorData.password.trim()
    )
      return

    startTransition(async () => {
      try {
        const created = await createTutor(newTutorData)
        if (created) {
          setTutors((prev) => [created, ...prev])
          setIsAddModalOpen(false)
          setNewTutorData({ fullName: '', email: '', phone: '', password: '' })
        }
      } catch (e) {
        console.error('Failed to create tutor:', e)
      }
    })
  }

  function handleEditTutor() {
    if (!editingTutor || !editTutorData.fullName.trim()) return

    startTransition(async () => {
      try {
        const updated = await updateTutor(editingTutor.id, editTutorData)
        if (updated) {
          setTutors((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
          setIsEditModalOpen(false)
          setEditingTutor(null)
          setEditTutorData({ fullName: '', phone: '', subjects: [] })
        }
      } catch (e) {
        console.error('Failed to update tutor:', e)
      }
    })
  }

  function openEditModal(tutor: TutorDoc) {
    setEditingTutor(tutor)

    // Extract subject IDs from the tutor's subjects
    const subjectIds = Array.isArray(tutor.subjects)
      ? tutor.subjects
          .map((subject) => (typeof subject === 'object' && subject ? subject.id : Number(subject)))
          .filter(Boolean)
      : []

    setEditTutorData({
      fullName: tutor.fullName,
      phone: tutor.phone || '',
      subjects: subjectIds,
    })
    setIsEditModalOpen(true)
  }

  function handleDelete(id: number) {
    startTransition(async () => {
      try {
        const success = await deleteTutor(id)
        if (success) {
          setTutors((prev) => prev.filter((t) => t.id !== id))
        }
      } catch (e) {
        console.error('Failed to delete tutor:', e)
      }
    })
  }

  function openPasswordResetModal(tutor: TutorDoc) {
    setResetPasswordTutor(tutor)
    setNewPassword('')
    setIsPasswordResetModalOpen(true)
  }

  function handlePasswordReset() {
    if (!resetPasswordTutor || !newPassword.trim()) return

    startTransition(async () => {
      try {
        const success = await resetTutorPassword(resetPasswordTutor.id, newPassword)
        if (success) {
          setIsPasswordResetModalOpen(false)
          setResetPasswordTutor(null)
          setNewPassword('')
        }
      } catch (e) {
        console.error('Failed to reset password:', e)
      }
    })
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tutors</CardTitle>
                <CardDescription>Manage tutor accounts and information</CardDescription>
              </div>
              <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Tutor
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add New Tutor</DialogTitle>
                    <DialogDescription>Create a new tutor account.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={newTutorData.fullName}
                        onChange={(e) =>
                          setNewTutorData((prev) => ({ ...prev, fullName: e.target.value }))
                        }
                        placeholder="Enter full name"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newTutorData.email}
                        onChange={(e) =>
                          setNewTutorData((prev) => ({ ...prev, email: e.target.value }))
                        }
                        placeholder="Enter email address"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="phone">Phone (Optional)</Label>
                      <Input
                        id="phone"
                        value={newTutorData.phone}
                        onChange={(e) =>
                          setNewTutorData((prev) => ({ ...prev, phone: e.target.value }))
                        }
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newTutorData.password}
                        onChange={(e) =>
                          setNewTutorData((prev) => ({ ...prev, password: e.target.value }))
                        }
                        placeholder="Enter password"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="submit"
                      onClick={handleAddTutor}
                      disabled={
                        isPending ||
                        !newTutorData.fullName.trim() ||
                        !newTutorData.email.trim() ||
                        !newTutorData.password.trim()
                      }
                    >
                      {isPending ? 'Creating...' : 'Add Tutor'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Edit Tutor</DialogTitle>
                    <DialogDescription>Update tutor information.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="editFullName">Full Name</Label>
                      <Input
                        id="editFullName"
                        value={editTutorData.fullName}
                        onChange={(e) =>
                          setEditTutorData((prev) => ({ ...prev, fullName: e.target.value }))
                        }
                        placeholder="Enter full name"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="editEmail">Email</Label>
                      <Input
                        id="editEmail"
                        type="email"
                        value={editingTutor?.email || ''}
                        disabled
                        className="opacity-50"
                        placeholder="Email cannot be changed"
                      />
                      <p className="text-xs text-muted-foreground">
                        Email addresses cannot be modified after account creation
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="editPhone">Phone</Label>
                      <Input
                        id="editPhone"
                        value={editTutorData.phone}
                        onChange={(e) =>
                          setEditTutorData((prev) => ({ ...prev, phone: e.target.value }))
                        }
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Subjects</Label>
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {availableSubjects.map((subject) => {
                            const isSelected = editTutorData.subjects.includes(subject.id)
                            return (
                              <Badge
                                key={subject.id}
                                variant={isSelected ? 'default' : 'outline'}
                                className={`cursor-pointer ${
                                  isSelected ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-gray-100'
                                }`}
                                onClick={() => {
                                  setEditTutorData((prev) => ({
                                    ...prev,
                                    subjects: isSelected
                                      ? prev.subjects.filter((id) => id !== subject.id)
                                      : [...prev.subjects, subject.id],
                                  }))
                                }}
                              >
                                {subject.name}
                              </Badge>
                            )
                          })}
                        </div>
                        {availableSubjects.length === 0 && (
                          <p className="text-sm text-muted-foreground">
                            No subjects available. Create subjects first.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="submit"
                      onClick={handleEditTutor}
                      disabled={isPending || !editTutorData.fullName.trim()}
                    >
                      {isPending ? 'Updating...' : 'Update Tutor'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={isPasswordResetModalOpen} onOpenChange={setIsPasswordResetModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Reset Password</DialogTitle>
                    <DialogDescription>
                      Reset password for {resetPasswordTutor?.fullName}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="submit"
                      onClick={handlePasswordReset}
                      disabled={isPending || !newPassword.trim()}
                    >
                      {isPending ? 'Resetting...' : 'Reset Password'}
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
                  placeholder="Search tutors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {tutors.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No tutors found. Add your first tutor to get started.</p>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tutor</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Subjects</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginated.map((t) => {
                        // Handle subjects - they could be objects or IDs
                        const subjects = Array.isArray(t.subjects)
                          ? t.subjects
                              .map((subject) =>
                                typeof subject === 'object' && subject
                                  ? subject.name
                                  : String(subject),
                              )
                              .filter(Boolean)
                          : []

                        return (
                          <TableRow key={t.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage
                                    src={
                                      typeof t.profilePicture === 'object' && t.profilePicture
                                        ? t.profilePicture.url || undefined
                                        : undefined
                                    }
                                    alt={t.fullName}
                                    className="object-cover"
                                  />
                                  <AvatarFallback>
                                    {t.fullName
                                      ?.split(' ')
                                      .map((n) => n[0])
                                      .join('') || 'T'}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{t.fullName}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{t.email}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {t.phone || '-'}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {subjects.length > 0 ? (
                                  subjects.slice(0, 3).map((subject, index) => (
                                    <span
                                      key={index}
                                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                    >
                                      {subject}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-xs text-muted-foreground">No subjects</span>
                                )}
                                {subjects.length > 3 && (
                                  <span className="text-xs text-muted-foreground">
                                    +{subjects.length - 3} more
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(t.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => openEditModal(t)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Edit tutor</p>
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => openPasswordResetModal(t)}
                                    >
                                      <KeyRound className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Reset password</p>
                                  </TooltipContent>
                                </Tooltip>
                                <AlertDialog>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="text-red-600 hover:text-red-700"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Delete tutor</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Tutor</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete {t.fullName}? This action
                                        cannot be undone and will remove their account and all
                                        associated data.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        className="bg-red-600 hover:bg-red-700"
                                        onClick={() => handleDelete(t.id)}
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
                      {Math.min(startIndex + itemsPerPage, filtered.length)} of {filtered.length}{' '}
                      tutors
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
      </div>
    </TooltipProvider>
  )
}
