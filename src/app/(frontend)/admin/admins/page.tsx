import { getAllAdmins, getAdminStats } from '@/server-actions/admin-actions'
import { getCurrentUser } from '@/server-actions/auth-actions'
import AdminsClient from './admins-client'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export default async function AdminsPage() {
  const [admins, stats, currentUser] = await Promise.all([
    getAllAdmins(),
    getAdminStats(),
    getCurrentUser(),
  ])

  return <AdminsClient initialAdmins={admins} stats={stats} currentUser={currentUser} />
}
