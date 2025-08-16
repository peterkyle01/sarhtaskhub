'use client'

import { useState, useTransition } from 'react'
import { Search, Plus, Edit, Trash2, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
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
import { createTutor, deleteTutor, TutorDoc } from '@/server-actions/tutors-actions'
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

interface Props {
  initialTutors: TutorDoc[]
  availableUsers: { id: number; fullName?: string; email?: string }[]
}

function performanceScore(t: TutorDoc): number {
  return t.performance?.overallScore ?? 0
}

function ratingLabel(score: number) {
  if (score >= 90) return 'Excellent'
  if (score >= 80) return 'Good'
  if (score >= 70) return 'Average'
  return 'Needs Improvement'
}

export default function TutorsClient({ initialTutors, availableUsers }: Props) {
  // Whether add new tutor functionality should be enabled
  const canAdd = availableUsers.length > 0
  const [tutors, setTutors] = useState<TutorDoc[]>(initialTutors)
  const [searchTerm, setSearchTerm] = useState('')
  const [performanceFilter, setPerformanceFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isTaskHistoryModalOpen, setIsTaskHistoryModalOpen] = useState(false)
  const [selectedTutor, setSelectedTutor] = useState<TutorDoc | null>(null)
  const [newUserId, setNewUserId] = useState<string>('')
  const [_, startTransition] = useTransition()

  const itemsPerPage = 6

  const filtered = tutors.filter((t) => {
    if (!searchTerm) return true
    const query = searchTerm.toLowerCase()
    return (
      t.fullName?.toLowerCase().includes(query) ||
      t.email?.toLowerCase().includes(query) ||
      t.tutorId?.toLowerCase().includes(query)
    )
  })

  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage)

  function handleAddTutor() {
    startTransition(async () => {
      try {
        if (!newUserId) return
        const created = await createTutor({ userId: Number(newUserId) })
        if (created) setTutors((prev) => [created, ...prev])
        setIsAddModalOpen(false)
        setNewUserId('')
      } catch (e) {
        console.error(e)
      }
    })
  }

  function handleDelete(id: number) {
    startTransition(async () => {
      const ok = await deleteTutor(id)
      if (ok) setTutors((prev) => prev.filter((t) => t.id !== id))
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tutors</CardTitle>
              <CardDescription>Manage tutors and performance</CardDescription>
            </div>
            {canAdd && (
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
                      <Label htmlFor="userId">Select Existing Tutor User</Label>
                      <Select onValueChange={(v) => setNewUserId(v)} value={newUserId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose user" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableUsers.map((u) => (
                            <SelectItem key={u.id} value={String(u.id)}>
                              {(u.fullName || u.email) ?? `User ${u.id}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" onClick={handleAddTutor}>
                      Add Tutor
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
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
            <Select value={performanceFilter} onValueChange={setPerformanceFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Performance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Performance</SelectItem>
                <SelectItem value="excellent">Excellent (90+)</SelectItem>
                <SelectItem value="good">Good (80-89)</SelectItem>
                <SelectItem value="average">Average (70-79)</SelectItem>
                <SelectItem value="poor">Poor (&lt;70)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tutor</TableHead>
                  <TableHead>Tutor ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((t) => {
                  const score = performanceScore(t)
                  const isSynthetic = t.id < 0 // negative id means no actual profile document yet
                  return (
                    <TableRow key={t.id} className={isSynthetic ? 'opacity-80' : ''}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={'/placeholder.svg'} alt={t.fullName} />
                            <AvatarFallback>
                              {t.fullName
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{t.fullName}</div>
                            <div className="text-xs text-muted-foreground">
                              {ratingLabel(score)}
                              {isSynthetic && ' (no profile)'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{t.tutorId || '-'}</TableCell>
                      <TableCell>{t.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={score} className="w-16 h-2" />
                          <span className="text-sm font-medium w-8">{score}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(t.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedTutor(t)
                              setIsTaskHistoryModalOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {!isSynthetic && (
                            <>
                              <Button variant="ghost" size="sm">
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
                                    <AlertDialogTitle>Delete Tutor</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete {t.fullName}? This action
                                      cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-red-600 hover:bg-red-700"
                                      onClick={() => handleDelete(t.id)}
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
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
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filtered.length)} of{' '}
              {filtered.length} tutors
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

      <Dialog open={isTaskHistoryModalOpen} onOpenChange={setIsTaskHistoryModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Task History - {selectedTutor?.fullName}</DialogTitle>
            <DialogDescription>Coming soon: detailed tutor task history.</DialogDescription>
          </DialogHeader>
          <div className="py-4 text-sm text-muted-foreground">No history loaded.</div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
