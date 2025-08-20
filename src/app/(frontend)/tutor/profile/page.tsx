import { redirect } from 'next/navigation'
import { getCurrentTutorProfile, listSubjects } from '@/server-actions/tutors-actions'
import { TutorProfileClient } from './profile-client'

export default async function TutorProfilePage() {
  try {
    const [tutorProfile, availableSubjects] = await Promise.all([
      getCurrentTutorProfile(),
      listSubjects(),
    ])

    if (!tutorProfile) {
      redirect('/login')
    }

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profile Settings</h1>
          <p className="text-muted-foreground">
            Manage your personal information and account settings.
          </p>
        </div>
        <TutorProfileClient initialProfile={tutorProfile} availableSubjects={availableSubjects} />
      </div>
    )
  } catch (error) {
    console.error('Error loading tutor profile page:', error)
    redirect('/login')
  }
}
