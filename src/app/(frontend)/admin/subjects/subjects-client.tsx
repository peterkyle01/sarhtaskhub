'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Plus, BookOpen, FileText, Edit, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { SubjectWithTopics } from '@/server-actions/subjects-actions'
import type { Topic } from '@/payload-types'
import {
  createSubject,
  updateSubject,
  deleteSubject,
  createTopic,
  updateTopic,
  deleteTopic,
} from '@/server-actions/subjects-actions'

interface SubjectsClientProps {
  initialSubjects: SubjectWithTopics[]
}

export function SubjectsClient({ initialSubjects }: SubjectsClientProps) {
  const router = useRouter()
  const subjects = initialSubjects
  const [expandedSubjects, setExpandedSubjects] = useState<Set<number>>(new Set())
  const [expandedTopics, setExpandedTopics] = useState<Set<number>>(new Set())

  // Dialog states
  const [showCreateSubject, setShowCreateSubject] = useState(false)
  const [showCreateTopic, setShowCreateTopic] = useState(false)
  const [showEditSubject, setShowEditSubject] = useState(false)
  const [showEditTopic, setShowEditTopic] = useState(false)

  // Form states
  const [newSubjectName, setNewSubjectName] = useState('')
  const [newTopicName, setNewTopicName] = useState('')
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null)
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null)
  const [selectedParentTopicId, setSelectedParentTopicId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')

  // Loading states
  const [isCreatingSubject, setIsCreatingSubject] = useState(false)
  const [isCreatingTopic, setIsCreatingTopic] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [error, setError] = useState('')

  const refreshData = () => {
    router.refresh()
  }

  const toggleSubjectExpansion = (subjectId: number) => {
    const newExpanded = new Set(expandedSubjects)
    if (newExpanded.has(subjectId)) {
      newExpanded.delete(subjectId)
    } else {
      newExpanded.add(subjectId)
    }
    setExpandedSubjects(newExpanded)
  }

  const toggleTopicExpansion = (topicId: number) => {
    const newExpanded = new Set(expandedTopics)
    if (newExpanded.has(topicId)) {
      newExpanded.delete(topicId)
    } else {
      newExpanded.add(topicId)
    }
    setExpandedTopics(newExpanded)
  }

  const handleCreateSubject = async () => {
    if (!newSubjectName.trim()) return

    setIsCreatingSubject(true)
    setError('')

    try {
      const result = await createSubject(newSubjectName.trim())
      if (result.success) {
        setNewSubjectName('')
        setShowCreateSubject(false)
        refreshData()
      } else {
        setError(result.error || 'Failed to create subject')
      }
    } catch (_error) {
      setError('An unexpected error occurred')
    } finally {
      setIsCreatingSubject(false)
    }
  }

  const handleCreateTopic = async () => {
    if (!newTopicName.trim() || !selectedSubjectId) return

    setIsCreatingTopic(true)
    setError('')

    try {
      const result = await createTopic(
        newTopicName.trim(),
        selectedSubjectId,
        selectedParentTopicId || undefined,
      )
      if (result.success) {
        setNewTopicName('')
        setSelectedSubjectId(null)
        setSelectedParentTopicId(null)
        setShowCreateTopic(false)
        refreshData()
      } else {
        setError(result.error || 'Failed to create topic')
      }
    } catch (_error) {
      setError('An unexpected error occurred')
    } finally {
      setIsCreatingTopic(false)
    }
  }

  const handleUpdateSubject = async () => {
    if (!editName.trim() || !selectedSubjectId) return

    setIsUpdating(true)
    setError('')

    try {
      const result = await updateSubject(selectedSubjectId, editName.trim())
      if (result.success) {
        setEditName('')
        setSelectedSubjectId(null)
        setShowEditSubject(false)
        refreshData()
      } else {
        setError(result.error || 'Failed to update subject')
      }
    } catch (_error) {
      setError('An unexpected error occurred')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleUpdateTopic = async () => {
    if (!editName.trim() || !selectedTopicId) return

    setIsUpdating(true)
    setError('')

    try {
      const result = await updateTopic(selectedTopicId, editName.trim())
      if (result.success) {
        setEditName('')
        setSelectedTopicId(null)
        setShowEditTopic(false)
        refreshData()
      } else {
        setError(result.error || 'Failed to update topic')
      }
    } catch (_error) {
      setError('An unexpected error occurred')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteSubject = async (subjectId: number) => {
    setIsDeleting(true)
    setError('')

    try {
      const result = await deleteSubject(subjectId)
      if (result.success) {
        refreshData()
      } else {
        setError(result.error || 'Failed to delete subject')
      }
    } catch (_error) {
      setError('An unexpected error occurred')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteTopic = async (topicId: number) => {
    setIsDeleting(true)
    setError('')

    try {
      const result = await deleteTopic(topicId)
      if (result.success) {
        refreshData()
      } else {
        setError(result.error || 'Failed to delete topic')
      }
    } catch (_error) {
      setError('An unexpected error occurred')
    } finally {
      setIsDeleting(false)
    }
  }

  const openEditSubject = (subject: SubjectWithTopics) => {
    setSelectedSubjectId(subject.id)
    setEditName(subject.name)
    setShowEditSubject(true)
  }

  const openEditTopic = (topic: Topic) => {
    setSelectedTopicId(topic.id)
    setEditName(topic.name)
    setShowEditTopic(true)
  }

  const openCreateTopic = (subjectId: number, parentTopicId?: number) => {
    setSelectedSubjectId(subjectId)
    setSelectedParentTopicId(parentTopicId || null)
    setShowCreateTopic(true)
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 border border-red-200 bg-red-50 text-red-700 rounded-lg">{error}</div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Subjects & Topics</h1>
          <p className="text-muted-foreground">
            Manage subjects, topics, and subtopics for the task system
          </p>
        </div>
        <Dialog open={showCreateSubject} onOpenChange={setShowCreateSubject}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Subject
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Subject</DialogTitle>
              <DialogDescription>Add a new subject to organize topics and tasks.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Subject name"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateSubject()}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateSubject(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateSubject}
                  disabled={isCreatingSubject || !newSubjectName.trim()}
                >
                  {isCreatingSubject ? 'Creating...' : 'Create Subject'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Subjects List */}
      <div className="space-y-4">
        {subjects.map((subject) => (
          <Card key={subject.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleSubjectExpansion(subject.id)}
                    className="h-8 w-8 p-0"
                  >
                    {expandedSubjects.has(subject.id) ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </Button>
                  <BookOpen className="w-5 h-5 text-blue-500" />
                  <div>
                    <CardTitle className="text-lg">{subject.name}</CardTitle>
                    <CardDescription>
                      {subject.topics.length} topics,{' '}
                      {subject.topics.reduce((acc, topic) => acc + topic.subtopics.length, 0)}{' '}
                      subtopics
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openCreateTopic(subject.id)}
                    className="flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Add Topic
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEditSubject(subject)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Subject</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete &ldquo;{subject.name}&rdquo;? This action
                          cannot be undone. All topics and subtopics under this subject will also be
                          deleted.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteSubject(subject.id)}
                          className="bg-red-600 hover:bg-red-700"
                          disabled={isDeleting}
                        >
                          {isDeleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>

            {expandedSubjects.has(subject.id) && (
              <CardContent className="pt-0">
                {subject.topics.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No topics yet</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openCreateTopic(subject.id)}
                      className="mt-2"
                    >
                      Add First Topic
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {subject.topics.map((topic) => (
                      <div key={topic.id} className="border rounded-lg p-4 bg-muted/20">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {topic.subtopics.length > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleTopicExpansion(topic.id)}
                                className="h-6 w-6 p-0"
                              >
                                {expandedTopics.has(topic.id) ? (
                                  <ChevronDown className="w-3 h-3" />
                                ) : (
                                  <ChevronRight className="w-3 h-3" />
                                )}
                              </Button>
                            )}
                            <FileText className="w-4 h-4 text-green-500" />
                            <span className="font-medium">{topic.name}</span>
                            {topic.subtopics.length > 0 && (
                              <Badge variant="secondary" className="text-xs">
                                {topic.subtopics.length} subtopics
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openCreateTopic(subject.id, topic.id)}
                              className="h-7 w-7 p-0"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditTopic(topic)}
                              className="h-7 w-7 p-0"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Topic</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete &ldquo;{topic.name}&rdquo;? This
                                    will also delete all subtopics.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteTopic(topic.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>

                        {expandedTopics.has(topic.id) && topic.subtopics.length > 0 && (
                          <div className="ml-6 space-y-2 border-l-2 border-muted pl-4">
                            {topic.subtopics.map((subtopic) => (
                              <div
                                key={subtopic.id}
                                className="flex items-center justify-between py-1"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />
                                  <span className="text-sm">{subtopic.name}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEditTopic(subtopic)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Subtopic</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete &ldquo;{subtopic.name}
                                          &rdquo;?
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDeleteTopic(subtopic.id)}
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}

        {subjects.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">No subjects yet</h3>
              <p className="text-muted-foreground mb-4">
                Get started by creating your first subject
              </p>
              <Button onClick={() => setShowCreateSubject(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Subject
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Topic Dialog */}
      <Dialog open={showCreateTopic} onOpenChange={setShowCreateTopic}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New {selectedParentTopicId ? 'Subtopic' : 'Topic'}</DialogTitle>
            <DialogDescription>
              Add a new {selectedParentTopicId ? 'subtopic' : 'topic'} to organize tasks.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder={`${selectedParentTopicId ? 'Subtopic' : 'Topic'} name`}
              value={newTopicName}
              onChange={(e) => setNewTopicName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateTopic()}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateTopic(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateTopic}
                disabled={isCreatingTopic || !newTopicName.trim()}
              >
                {isCreatingTopic
                  ? 'Creating...'
                  : `Create ${selectedParentTopicId ? 'Subtopic' : 'Topic'}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Subject Dialog */}
      <Dialog open={showEditSubject} onOpenChange={setShowEditSubject}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subject</DialogTitle>
            <DialogDescription>Update the subject name.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Subject name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUpdateSubject()}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditSubject(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateSubject} disabled={isUpdating || !editName.trim()}>
                {isUpdating ? 'Updating...' : 'Update Subject'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Topic Dialog */}
      <Dialog open={showEditTopic} onOpenChange={setShowEditTopic}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Topic</DialogTitle>
            <DialogDescription>Update the topic name.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Topic name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUpdateTopic()}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditTopic(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateTopic} disabled={isUpdating || !editName.trim()}>
                {isUpdating ? 'Updating...' : 'Update Topic'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
