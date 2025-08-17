import React from 'react'
import { getAllSubjectsWithTopics } from '@/server-actions/subjects-actions'
import { SubjectsClient } from './subjects-client'

export default async function SubjectsPage() {
  const subjects = await getAllSubjectsWithTopics()

  return <SubjectsClient initialSubjects={subjects} />
}
