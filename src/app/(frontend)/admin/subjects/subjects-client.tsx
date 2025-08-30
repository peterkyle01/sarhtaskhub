'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Plus,
  BookOpen,
  FileText,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  Search,
  MoreHorizontal,
  Filter,
  FolderOpen,
} from 'lucide-react'
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
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<number | null>(null)

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
  const [_isDeleting, setIsDeleting] = useState(false)

  const [error, setError] = useState('')

  // Filter and search logic
  const filteredData = useMemo(() => {
    const allItems: Array<{
      type: 'subject' | 'topic' | 'subtopic'
      id: number
      name: string
      subjectId: number
      subjectName: string
      parentTopicId?: number
      parentTopicName?: string
      topicCount?: number
      subtopicCount?: number
      isVisible?: boolean
    }> = []

    subjects.forEach((subject) => {
      // Add subject
      if (!selectedSubjectFilter || selectedSubjectFilter === subject.id) {
        const isSubjectExpanded = expandedSubjects.has(subject.id)

        allItems.push({
          type: 'subject',
          id: subject.id,
          name: subject.name,
          subjectId: subject.id,
          subjectName: subject.name,
          topicCount: subject.topics.length,
          subtopicCount: subject.topics.reduce((acc, topic) => acc + topic.subtopics.length, 0),
          isVisible: true,
        })

        // Only add topics if subject is expanded
        if (isSubjectExpanded) {
          subject.topics.forEach((topic) => {
            const isTopicExpanded = expandedTopics.has(topic.id)

            allItems.push({
              type: 'topic',
              id: topic.id,
              name: topic.name,
              subjectId: subject.id,
              subjectName: subject.name,
              subtopicCount: topic.subtopics.length,
              isVisible: true,
            })

            // Only add subtopics if topic is expanded
            if (isTopicExpanded) {
              topic.subtopics.forEach((subtopic) => {
                allItems.push({
                  type: 'subtopic',
                  id: subtopic.id,
                  name: subtopic.name,
                  subjectId: subject.id,
                  subjectName: subject.name,
                  parentTopicId: topic.id,
                  parentTopicName: topic.name,
                  isVisible: true,
                })
              })
            }
          })
        }
      }
    })

    // Filter by search term - if searching, show all matching items regardless of expansion
    if (searchTerm) {
      const searchItems: typeof allItems = []

      subjects.forEach((subject) => {
        if (!selectedSubjectFilter || selectedSubjectFilter === subject.id) {
          // Check if subject matches
          const subjectMatches = subject.name.toLowerCase().includes(searchTerm.toLowerCase())

          if (subjectMatches) {
            searchItems.push({
              type: 'subject',
              id: subject.id,
              name: subject.name,
              subjectId: subject.id,
              subjectName: subject.name,
              topicCount: subject.topics.length,
              subtopicCount: subject.topics.reduce((acc, topic) => acc + topic.subtopics.length, 0),
              isVisible: true,
            })
          }

          subject.topics.forEach((topic) => {
            const topicMatches = topic.name.toLowerCase().includes(searchTerm.toLowerCase())

            if (topicMatches) {
              searchItems.push({
                type: 'topic',
                id: topic.id,
                name: topic.name,
                subjectId: subject.id,
                subjectName: subject.name,
                subtopicCount: topic.subtopics.length,
                isVisible: true,
              })
            }

            topic.subtopics.forEach((subtopic) => {
              const subtopicMatches =
                subtopic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                topic.name.toLowerCase().includes(searchTerm.toLowerCase())

              if (subtopicMatches) {
                searchItems.push({
                  type: 'subtopic',
                  id: subtopic.id,
                  name: subtopic.name,
                  subjectId: subject.id,
                  subjectName: subject.name,
                  parentTopicId: topic.id,
                  parentTopicName: topic.name,
                  isVisible: true,
                })
              }
            })
          })
        }
      })

      return searchItems
    }

    return allItems.filter((item) => item.isVisible)
  }, [subjects, searchTerm, selectedSubjectFilter, expandedSubjects, expandedTopics])

  const refreshData = () => {
    router.refresh()
  }

  const toggleSubjectExpansion = (subjectId: number) => {
    const newExpanded = new Set(expandedSubjects)
    if (newExpanded.has(subjectId)) {
      newExpanded.delete(subjectId)
      // Also collapse all topics when collapsing subject
      const subject = subjects.find((s) => s.id === subjectId)
      if (subject) {
        const newExpandedTopics = new Set(expandedTopics)
        subject.topics.forEach((topic) => {
          newExpandedTopics.delete(topic.id)
        })
        setExpandedTopics(newExpandedTopics)
      }
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

  const getItemIcon = (type: string, hasChildren?: boolean, _isExpanded?: boolean) => {
    switch (type) {
      case 'subject':
        return <BookOpen className="w-4 h-4 text-blue-500" />
      case 'topic':
        return hasChildren ? (
          <FolderOpen className="w-4 h-4 text-green-500" />
        ) : (
          <FileText className="w-4 h-4 text-green-500" />
        )
      case 'subtopic':
        return <div className="w-2 h-2 rounded-full bg-muted-foreground/60 ml-1" />
      default:
        return null
    }
  }

  const getIndentation = (type: string) => {
    switch (type) {
      case 'subject':
        return ''
      case 'topic':
        return 'pl-6'
      case 'subtopic':
        return 'pl-12'
      default:
        return ''
    }
  }

  const getExpandButton = (item: {
    type: 'subject' | 'topic' | 'subtopic'
    id: number
    topicCount?: number
    subtopicCount?: number
  }) => {
    if (item.type === 'subject' && (item.topicCount || 0) > 0) {
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            toggleSubjectExpansion(item.id)
          }}
          className="h-6 w-6 p-0 mr-1"
        >
          {expandedSubjects.has(item.id) ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
        </Button>
      )
    }

    if (item.type === 'topic' && (item.subtopicCount || 0) > 0) {
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            toggleTopicExpansion(item.id)
          }}
          className="h-6 w-6 p-0 mr-1"
        >
          {expandedTopics.has(item.id) ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
        </Button>
      )
    }

    return <div className="w-6 mr-1" /> // Spacer for alignment
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 border border-red-200 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Compact Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Subjects & Topics</h1>
          <p className="text-sm text-muted-foreground">
            {subjects.length} subjects • {subjects.reduce((acc, s) => acc + s.topics.length, 0)}{' '}
            topics • {filteredData.length} items shown
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Expand all subjects
              const allSubjectIds = new Set(subjects.map((s) => s.id))
              setExpandedSubjects(allSubjectIds)
            }}
          >
            Expand All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Collapse all
              setExpandedSubjects(new Set())
              setExpandedTopics(new Set())
            }}
          >
            Collapse All
          </Button>
          <Dialog open={showCreateSubject} onOpenChange={setShowCreateSubject}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Subject
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Subject</DialogTitle>
                <DialogDescription>
                  Add a new subject to organize topics and tasks.
                </DialogDescription>
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
      </div>

      {/* Compact Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search subjects, topics, or subtopics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  <Filter className="w-4 h-4 mr-1" />
                  {selectedSubjectFilter
                    ? subjects.find((s) => s.id === selectedSubjectFilter)?.name
                    : 'All Subjects'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setSelectedSubjectFilter(null)}>
                  All Subjects
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {subjects.map((subject) => (
                  <DropdownMenuItem
                    key={subject.id}
                    onClick={() => setSelectedSubjectFilter(subject.id)}
                  >
                    {subject.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="mb-2">
                {searchTerm ? 'No items match your search' : 'No subjects yet'}
              </p>
              {!searchTerm && (
                <Button size="sm" onClick={() => setShowCreateSubject(true)}>
                  Create First Subject
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b">
                  <TableHead className="w-[50%] font-medium">Name</TableHead>
                  <TableHead className="font-medium">Type</TableHead>
                  <TableHead className="font-medium">Subject</TableHead>
                  <TableHead className="font-medium">Count</TableHead>
                  <TableHead className="w-[100px] font-medium">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item) => (
                  <TableRow key={`${item.type}-${item.id}`} className="hover:bg-muted/20">
                    <TableCell className={`${getIndentation(item.type)} py-2`}>
                      <div className="flex items-center gap-1">
                        {getExpandButton(item)}
                        {getItemIcon(
                          item.type,
                          item.type === 'topic' && (item.subtopicCount || 0) > 0,
                        )}
                        <span className="font-medium text-sm">{item.name}</span>
                        {item.type === 'subtopic' && item.parentTopicName && (
                          <Badge variant="outline" className="text-xs">
                            {item.parentTopicName}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      <Badge
                        variant={
                          item.type === 'subject'
                            ? 'default'
                            : item.type === 'topic'
                              ? 'secondary'
                              : 'outline'
                        }
                        className="text-xs"
                      >
                        {item.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2 text-sm text-muted-foreground">
                      {item.type !== 'subject' ? item.subjectName : '-'}
                    </TableCell>
                    <TableCell className="py-2 text-sm">
                      {item.type === 'subject' && (
                        <span className="text-muted-foreground">
                          {item.topicCount}T, {item.subtopicCount}ST
                        </span>
                      )}
                      {item.type === 'topic' && (
                        <span className="text-muted-foreground">
                          {item.subtopicCount} subtopics
                        </span>
                      )}
                      {item.type === 'subtopic' && <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell className="py-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {item.type === 'subject' && (
                            <>
                              <DropdownMenuItem onClick={() => openCreateTopic(item.id)}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Topic
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  const subject = subjects.find((s) => s.id === item.id)
                                  if (subject) openEditSubject(subject)
                                }}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Subject
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem
                                    onSelect={(e) => e.preventDefault()}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Subject
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Subject</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Delete &quot;{item.name}&quot; and all its topics/subtopics?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteSubject(item.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                          {item.type === 'topic' && (
                            <>
                              <DropdownMenuItem
                                onClick={() => openCreateTopic(item.subjectId, item.id)}
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Subtopic
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  const subject = subjects.find((s) => s.id === item.subjectId)
                                  const topic = subject?.topics.find((t) => t.id === item.id)
                                  if (topic) openEditTopic(topic)
                                }}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Topic
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem
                                    onSelect={(e) => e.preventDefault()}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Topic
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Topic</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Delete &quot;{item.name}&quot; and all its subtopics?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteTopic(item.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                          {item.type === 'subtopic' && (
                            <>
                              <DropdownMenuItem
                                onClick={() => {
                                  const subject = subjects.find((s) => s.id === item.subjectId)
                                  const topic = subject?.topics.find(
                                    (t) => t.id === item.parentTopicId,
                                  )
                                  const subtopic = topic?.subtopics.find((st) => st.id === item.id)
                                  if (subtopic) openEditTopic(subtopic)
                                }}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Subtopic
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem
                                    onSelect={(e) => e.preventDefault()}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Subtopic
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Subtopic</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Delete &quot;{item.name}&quot;?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteTopic(item.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
