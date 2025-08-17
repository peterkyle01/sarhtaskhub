'use server'

import { getPayload } from 'payload'
import config from '@/payload.config'
import { revalidatePath } from 'next/cache'
import type { Subject, Topic } from '@/payload-types'

export interface SubjectWithTopics extends Subject {
  topics: TopicWithSubtopics[]
}

export interface TopicWithSubtopics extends Topic {
  subtopics: Topic[]
}

export async function getAllSubjectsWithTopics(): Promise<SubjectWithTopics[]> {
  try {
    const payload = await getPayload({ config })

    // Get all subjects
    const subjectsResult = await payload.find({
      collection: 'subjects',
      limit: 1000,
      sort: 'name',
    })

    // Get all topics with their relationships
    const topicsResult = await payload.find({
      collection: 'topics',
      limit: 1000,
      depth: 2,
      sort: 'name',
    })

    const subjects = subjectsResult.docs as Subject[]
    const topics = topicsResult.docs as Topic[]

    // Group topics by subject and organize parent-child relationships
    const subjectsWithTopics: SubjectWithTopics[] = subjects.map((subject) => {
      // Get all topics for this subject
      const subjectTopics = topics.filter((topic) => {
        const subjectId = typeof topic.subject === 'object' ? topic.subject.id : topic.subject
        return subjectId === subject.id
      })

      // Separate parent topics (no parent) and subtopics (have parent)
      const parentTopics = subjectTopics.filter((topic) => !topic.parent)
      const allSubtopics = subjectTopics.filter((topic) => topic.parent)

      // Build the hierarchy
      const topicsWithSubtopics: TopicWithSubtopics[] = parentTopics.map((parentTopic) => {
        const subtopics = allSubtopics.filter((subtopic) => {
          const parentId =
            typeof subtopic.parent === 'object' ? subtopic.parent?.id : subtopic.parent
          return parentId === parentTopic.id
        })

        return {
          ...parentTopic,
          subtopics,
        }
      })

      return {
        ...subject,
        topics: topicsWithSubtopics,
      }
    })

    return subjectsWithTopics
  } catch (error) {
    console.error('Failed to fetch subjects with topics:', error)
    return []
  }
}

export async function createSubject(
  name: string,
): Promise<{ success: boolean; error?: string; subject?: Subject }> {
  try {
    const payload = await getPayload({ config })

    const result = await payload.create({
      collection: 'subjects',
      data: { name },
    })

    revalidatePath('/admin/subjects')
    return { success: true, subject: result as Subject }
  } catch (error) {
    console.error('Failed to create subject:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create subject',
    }
  }
}

export async function updateSubject(
  id: number,
  name: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = await getPayload({ config })

    await payload.update({
      collection: 'subjects',
      id,
      data: { name },
    })

    revalidatePath('/admin/subjects')
    return { success: true }
  } catch (error) {
    console.error('Failed to update subject:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update subject',
    }
  }
}

export async function deleteSubject(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = await getPayload({ config })

    // Check if subject has topics
    const topicsResult = await payload.find({
      collection: 'topics',
      where: {
        subject: { equals: id },
      },
      limit: 1,
    })

    if (topicsResult.docs.length > 0) {
      return {
        success: false,
        error: 'Cannot delete subject with existing topics. Please delete all topics first.',
      }
    }

    await payload.delete({
      collection: 'subjects',
      id,
    })

    revalidatePath('/admin/subjects')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete subject:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete subject',
    }
  }
}

export async function createTopic(
  name: string,
  subjectId: number,
  parentId?: number,
): Promise<{ success: boolean; error?: string; topic?: Topic }> {
  try {
    const payload = await getPayload({ config })

    const data: {
      name: string
      subject: number
      parent?: number
    } = {
      name,
      subject: subjectId,
    }

    if (parentId) {
      data.parent = parentId
    }

    const result = await payload.create({
      collection: 'topics',
      data,
    })

    revalidatePath('/admin/subjects')
    return { success: true, topic: result as Topic }
  } catch (error) {
    console.error('Failed to create topic:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create topic',
    }
  }
}

export async function updateTopic(
  id: number,
  name: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = await getPayload({ config })

    await payload.update({
      collection: 'topics',
      id,
      data: { name },
    })

    revalidatePath('/admin/subjects')
    return { success: true }
  } catch (error) {
    console.error('Failed to update topic:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update topic',
    }
  }
}

export async function deleteTopic(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = await getPayload({ config })

    // Check if topic has subtopics
    const subtopicsResult = await payload.find({
      collection: 'topics',
      where: {
        parent: { equals: id },
      },
      limit: 1,
    })

    if (subtopicsResult.docs.length > 0) {
      return {
        success: false,
        error: 'Cannot delete topic with existing subtopics. Please delete all subtopics first.',
      }
    }

    await payload.delete({
      collection: 'topics',
      id,
    })

    revalidatePath('/admin/subjects')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete topic:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete topic',
    }
  }
}
