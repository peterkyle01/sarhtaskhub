// Server-side user management page with accordion functionality
import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, AlertCircle, UserCheck, User } from 'lucide-react'
import { getAllUsers, getCurrentUser } from '@/server-actions/user-actions'
import { UserManagementClient } from './user-management-client'
import { UserAccordion } from './user-accordion'
import { getUserStats, getRoleBadgeColor } from '@/lib/user-utils'
import type { GeneratedTypes } from 'payload'

// Transform Payload user to match our interface
interface UserProfile {
  id: string
  email: string
  name: string
  role: string
  created_at: string
  created_by: string | null
  phone?: string
}

function transformPayloadUser(user: GeneratedTypes['user']): UserProfile {
  return {
    id: user.id.toString(),
    email: user.email,
    name: user.fullName,
    role: user.role.toLowerCase(), // Convert ADMIN/WORKER/CLIENT to admin/worker/client for consistency
    created_at: user.createdAt,
    created_by: null, // Payload doesn't track who created users by default
    phone: user.phone,
  }
}

// Server-side stats card component
function UserStatsCards({ stats }: { stats: ReturnType<typeof getUserStats> }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{stats.total}</div>
          <p className="text-xs text-muted-foreground">Active accounts</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Administrators</CardTitle>
          <UserCheck className="h-4 w-4 text-purple-600 dark:text-purple-300" />
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-2xl font-bold text-foreground">{stats.admins}</div>
          <Badge className={getRoleBadgeColor('admin')}>Admin Role</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Workers</CardTitle>
          <Users className="h-4 w-4 text-blue-600 dark:text-blue-300" />
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-2xl font-bold text-foreground">{stats.workers}</div>
          <Badge className={getRoleBadgeColor('worker')}>Worker Role</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Clients</CardTitle>
          <User className="h-4 w-4 text-green-600 dark:text-green-300" />
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-2xl font-bold text-foreground">{stats.clients}</div>
          <Badge className={getRoleBadgeColor('client')}>Client Role</Badge>
        </CardContent>
      </Card>
    </div>
  )
}

export default async function UserPage() {
  // Fetch data on the server
  const [currentUser, allUsers] = await Promise.all([getCurrentUser(), getAllUsers()])

  // Transform Payload users to our interface
  const users: UserProfile[] = allUsers.map(transformPayloadUser)

  // Transform current user
  const user = currentUser ? transformPayloadUser(currentUser) : null

  // Calculate stats on the server
  const userStats = getUserStats(users)

  return (
    <div className="space-y-6">
      {user && user.email === 'admin@121212.com' && user.role !== 'admin' && (
        <Card className="border-orange-200 bg-orange-50 dark:border-orange-400/30 dark:bg-orange-500/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-300" />
              <div className="flex-1">
                <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                  Your account role needs to be updated to admin
                </p>
                <p className="text-sm text-orange-600 dark:text-orange-300/80">
                  Click the button to fix your role and access admin features
                </p>
              </div>
              <form
                action={async () => {
                  'use server'
                  if (user) {
                    const { updateUserRole } = await import('@/server-actions/user-actions')
                    await updateUserRole(parseInt(user.id), 'ADMIN')
                  }
                }}
              >
                <Button type="submit" size="sm" className="bg-orange-600 hover:bg-orange-700">
                  Fix Role
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">User Management</h2>
          <p className="text-muted-foreground">
            View detailed profiles and manage worker and client accounts
          </p>
        </div>

        <UserManagementClient />
      </div>

      {/* Server-rendered stats cards */}
      <UserStatsCards stats={userStats} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            All User Profiles ({users.length})
          </CardTitle>
          <CardDescription>
            Click on any user to view their complete profile information
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserAccordion users={users} />

          {users.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No users yet</h3>
              <p className="text-muted-foreground">
                Create your first worker or client account to get started.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
