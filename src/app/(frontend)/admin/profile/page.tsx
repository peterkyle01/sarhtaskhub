import { redirect } from 'next/navigation'
import { getCurrentAdminProfile } from '@/server-actions/admin-actions'
import { AdminProfileClient } from './profile-client'

export default async function AdminProfilePage() {
  try {
    const adminProfile = await getCurrentAdminProfile()

    if (!adminProfile) {
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
        <AdminProfileClient initialProfile={adminProfile} />
      </div>
    )
  } catch (error) {
    console.error('Error loading admin profile page:', error)
    redirect('/login')
  }
}
