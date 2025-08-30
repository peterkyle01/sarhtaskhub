'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, BookOpen, FileText, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { SubjectWithTopics } from '@/server-actions/subjects-actions'

interface HierarchicalTopicSelectorProps {
  subjects: SubjectWithTopics[]
  value: string
  onValueChange: (value: string) => void
  selectedTopics?: Set<string> // Add this to expose selected topics
  onSelectedTopicsChange?: (topics: Set<string>) => void // Add this callback
  placeholder?: string
  className?: string
}

export function HierarchicalTopicSelector({
  subjects,
  value,
  onValueChange,
  selectedTopics: externalSelectedTopics,
  onSelectedTopicsChange,
  placeholder: _placeholder = 'Select topic...',
  className,
}: HierarchicalTopicSelectorProps) {
  const [activeSubject, setActiveSubject] = useState(subjects[0]?.id || null)
  const [expandedTopics, setExpandedTopics] = useState<Set<number>>(new Set())
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(
    externalSelectedTopics || new Set(),
  )

  const activeSubjectData = subjects.find((s) => s.id === activeSubject)

  // Update selectedTopics when value changes
  useEffect(() => {
    if (value) {
      setSelectedTopics(new Set([value]))
    } else {
      setSelectedTopics(new Set())
    }
  }, [value])

  const toggleTopicExpansion = (topicId: number) => {
    const newExpanded = new Set(expandedTopics)
    if (newExpanded.has(topicId)) {
      newExpanded.delete(topicId)
    } else {
      newExpanded.add(topicId)
    }
    setExpandedTopics(newExpanded)
  }

  const handleTopicSelect = (topicId: number, isChecked: boolean) => {
    if (isChecked) {
      // When selecting a topic, automatically select all its subtopics
      const subject = activeSubjectData
      const topic = subject?.topics.find((t) => t.id === topicId)

      if (topic) {
        const newSelected = new Set(selectedTopics)
        newSelected.add(`topic-${topicId}`)

        // Add all subtopics
        topic.subtopics.forEach((subtopic) => {
          newSelected.add(`topic-${subtopic.id}`)
        })

        setSelectedTopics(newSelected)
        onSelectedTopicsChange?.(newSelected)

        // For multiple mode, set a representative value
        onValueChange(`multiple-${newSelected.size}`)
      }
    } else {
      // When deselecting a topic, remove it and all its subtopics
      const subject = activeSubjectData
      const topic = subject?.topics.find((t) => t.id === topicId)

      if (topic) {
        const newSelected = new Set(selectedTopics)
        newSelected.delete(`topic-${topicId}`)

        // Remove all subtopics
        topic.subtopics.forEach((subtopic) => {
          newSelected.delete(`topic-${subtopic.id}`)
        })

        setSelectedTopics(newSelected)
        onSelectedTopicsChange?.(newSelected)

        if (value === `topic-${topicId}`) {
          onValueChange('')
        }
      }
    }
  }

  const handleSubtopicSelect = (subtopicId: number, parentTopicId: number, isChecked: boolean) => {
    const newSelected = new Set(selectedTopics)

    if (isChecked) {
      newSelected.add(`topic-${subtopicId}`)
      onValueChange(`multiple-${newSelected.size}`)
    } else {
      newSelected.delete(`topic-${subtopicId}`)
      // Also deselect parent topic since not all subtopics are selected
      newSelected.delete(`topic-${parentTopicId}`)
      if (value === `topic-${subtopicId}`) {
        onValueChange('')
      }
    }

    setSelectedTopics(newSelected)
    onSelectedTopicsChange?.(newSelected)
  }

  const getSelectedInfo = () => {
    if (selectedTopics.size === 0) return null

    const topicCount = selectedTopics.size
    if (topicCount === 1) {
      const singleTopic = Array.from(selectedTopics)[0]
      if (singleTopic.startsWith('topic-')) {
        const topicId = parseInt(singleTopic.replace('topic-', ''))
        // Find the topic in any subject
        for (const subject of subjects) {
          const topic = subject.topics.find((t) => t.id === topicId)
          if (topic) return topic.name

          for (const parentTopic of subject.topics) {
            const subtopic = parentTopic.subtopics.find((st) => st.id === topicId)
            if (subtopic) return `${subtopic.name} (${parentTopic.name})`
          }
        }
      }
    }

    return `${topicCount} topics selected`
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Selected Info */}
      {selectedTopics.size > 0 && (
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-sm">
              <strong>Selected:</strong> {getSelectedInfo()}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedTopics(new Set())
                onSelectedTopicsChange?.(new Set())
                onValueChange('')
              }}
              className="h-8 px-3 text-xs self-start sm:self-auto"
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Subject Tabs */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Subjects:</Label>
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2 pb-3">
            {subjects.map((subject) => (
              <Button
                key={subject.id}
                variant={activeSubject === subject.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveSubject(subject.id)}
                className="flex-shrink-0 h-10 px-4 gap-2"
              >
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">{subject.name}</span>
                <span className="sm:hidden">{subject.name.slice(0, 8)}...</span>
                <Badge variant="secondary" className="text-xs">
                  {subject.topics.length}
                </Badge>
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Active Subject Content */}
      {activeSubjectData && (
        <Card>
          <CardHeader className="pb-4">
            <div>
              <CardTitle className="text-lg sm:text-xl">{activeSubjectData.name}</CardTitle>
              <CardDescription className="mt-1">
                {activeSubjectData.topics.length} topics •{' '}
                {activeSubjectData.topics.reduce((acc, topic) => acc + topic.subtopics.length, 0)}{' '}
                subtopics
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeSubjectData.topics.map((topic) => {
              const isExpanded = expandedTopics.has(topic.id)
              const hasSubtopics = topic.subtopics.length > 0
              const isSelected =
                value === `topic-${topic.id}` || selectedTopics.has(`topic-${topic.id}`)
              const allSubtopicsSelected =
                hasSubtopics && topic.subtopics.every((st) => selectedTopics.has(`topic-${st.id}`))

              return (
                <div key={topic.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {hasSubtopics && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleTopicExpansion(topic.id)}
                          className="h-8 w-8 p-0 flex-shrink-0"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                      <FolderOpen className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0 flex-1">
                        <span className="font-medium text-sm sm:text-base truncate">
                          {topic.name}
                        </span>
                        <div className="flex gap-2 flex-wrap">
                          {hasSubtopics && (
                            <Badge variant="outline" className="text-xs">
                              {topic.subtopics.length} subtopics
                            </Badge>
                          )}
                          {hasSubtopics && allSubtopicsSelected && (
                            <Badge variant="default" className="text-xs">
                              All selected
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 flex-shrink-0">
                      <Checkbox
                        id={`topic-${topic.id}`}
                        checked={isSelected || allSubtopicsSelected}
                        onCheckedChange={(checked: boolean) => {
                          handleTopicSelect(topic.id, checked)
                        }}
                        className="h-5 w-5"
                      />
                      <Label htmlFor={`topic-${topic.id}`} className="text-sm cursor-pointer">
                        <span className="hidden sm:inline">
                          Select {hasSubtopics ? '+ All Subtopics' : ''}
                        </span>
                        <span className="sm:hidden">Select</span>
                      </Label>
                    </div>
                  </div>

                  {/* Subtopics */}
                  {isExpanded && hasSubtopics && (
                    <div className="ml-2 sm:ml-8 space-y-3 pt-3 border-t">
                      {topic.subtopics.map((subtopic) => {
                        const isSubtopicSelected = selectedTopics.has(`topic-${subtopic.id}`)

                        return (
                          <div
                            key={subtopic.id}
                            className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <FileText className="w-4 h-4 text-purple-500 flex-shrink-0" />
                              <span className="text-sm truncate">{subtopic.name}</span>
                            </div>

                            <div className="flex items-center space-x-3 flex-shrink-0">
                              <Checkbox
                                id={`subtopic-${subtopic.id}`}
                                checked={isSubtopicSelected}
                                onCheckedChange={(checked: boolean) => {
                                  handleSubtopicSelect(subtopic.id, topic.id, checked)
                                }}
                                className="h-4 w-4"
                              />
                              <Label
                                htmlFor={`subtopic-${subtopic.id}`}
                                className="text-sm cursor-pointer"
                              >
                                Select
                              </Label>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Help Text */}
      <div className="text-xs text-muted-foreground space-y-2 p-3 bg-muted/30 rounded-lg">
        <p>
          <strong>Multiple Selection:</strong> Select multiple topics and subtopics for a single
          task. All selected topics will be associated with the task.
        </p>
        <p>
          <strong>Auto-selection:</strong> Selecting a topic automatically selects all its
          subtopics. You can also select individual subtopics.
        </p>
        <p className="hidden sm:block">
          <strong>Note:</strong> Tasks can now have multiple topics, allowing for comprehensive
          coverage of related subjects.
        </p>
      </div>
    </div>
  )
}
