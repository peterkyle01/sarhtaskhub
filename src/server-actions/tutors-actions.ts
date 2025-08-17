'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { Tutor } from '@/payload-types'

export type TutorDoc = Tutor

export async function listTutors(): Promise<TutorDoc[]> {
  try {
    const payload = await getPayload({ config })

    const result = await payload.find({
      collection: 'tutors',
      limit: 500,
      sort: '-createdAt',
      depth: 2, // Include relationships like subjects
    })

    console.log('Tutors found:', result.totalDocs)
    console.log(
      'Tutor docs:',
      result.docs.map((t) => ({
        id: t.id,
        fullName: t.fullName,
        email: t.email,
        subjects: t.subjects,
        phone: t.phone,
      })),
    )

    return result.docs
  } catch (error) {
    console.error('Error listing tutors:', error)
    return []
  }
}

export async function createTutor(data: {
  fullName: string
  email: string
  phone?: string
}): Promise<TutorDoc | null> {
  try {
    const payload = await getPayload({ config })

    // Create the tutor account with auth
    const result = await payload.create({
      collection: 'tutors',
      data: {
        ...data,
        password: 'temp123!', // They'll need to reset this
        role: 'tutor',
      },
    })

    return result
  } catch (error) {
    console.error('Error creating tutor:', error)
    return null
  }
}

export async function updateTutor(
  id: number,
  data: Partial<{
    fullName: string
    phone: string
    subjects: number[]
  }>,
): Promise<TutorDoc | null> {
  try {
    const payload = await getPayload({ config })

    const result = await payload.update({
      collection: 'tutors',
      id,
      data,
    })

    return result
  } catch (error) {
    console.error('Error updating tutor:', error)
    return null
  }
}

export async function deleteTutor(id: number): Promise<boolean> {
  try {
    const payload = await getPayload({ config })

    await payload.delete({
      collection: 'tutors',
      id,
    })

    return true
  } catch (error) {
    console.error('Error deleting tutor:', error)
    return false
  }
}

export async function getTutorStats() {
  try {
    const payload = await getPayload({ config })

    const result = await payload.find({
      collection: 'tutors',
      limit: 0, // Just get count
    })

    // Get tutors with subjects count
    const tutorsWithSubjects = await payload.find({
      collection: 'tutors',
      where: {
        subjects: {
          exists: true,
        },
      },
      limit: 0,
    })

    // Get subjects count
    const subjectsResult = await payload.find({
      collection: 'subjects',
      limit: 0,
    })

    const total = result.totalDocs
    const withSubjects = tutorsWithSubjects.totalDocs
    const withoutSubjects = total - withSubjects
    const totalSubjects = subjectsResult.totalDocs

    return {
      total,
      withSubjects,
      withoutSubjects,
      totalSubjects,
    }
  } catch (error) {
    console.error('Error getting tutor stats:', error)
    return {
      total: 0,
      withSubjects: 0,
      withoutSubjects: 0,
      totalSubjects: 0,
    }
  }
}

export async function listSubjects() {
  try {
    const payload = await getPayload({ config })

    const result = await payload.find({
      collection: 'subjects',
      limit: 500,
      sort: 'name',
    })

    return result.docs
  } catch (error) {
    console.error('Error listing subjects:', error)
    return []
  }
}
