/**
 * Server-side utility functions for user management
 * These functions run on the server and can be used in Server Components
 */

export function getRoleBadgeColor(role: string): string {
  switch (role.toLowerCase()) {
    case 'admin':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-400/20 dark:text-purple-200'
    case 'worker':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-400/20 dark:text-blue-200'
    case 'client':
      return 'bg-green-100 text-green-800 dark:bg-green-400/20 dark:text-green-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-400/20 dark:text-gray-200'
  }
}

// Map backend role values to user-friendly display labels
export function displayRole(role: string): string {
  switch (role?.toUpperCase()) {
    case 'WORKER':
      return 'Tutor'
    case 'ADMIN':
      return 'Admin'
    case 'CLIENT':
      return 'Client'
    default:
      return role
  }
}

export function formatUserDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getShortDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function getUserPermissionDescription(role: string): string {
  switch (role.toLowerCase()) {
    case 'admin':
      return 'Full system access'
    case 'worker':
      return 'Task management access'
    case 'client':
      return 'Client dashboard access'
    default:
      return 'Limited access'
  }
}

interface UserWithRole {
  role: string
}

export function getUserStats(users: UserWithRole[]): {
  total: number
  admins: number
  workers: number
  clients: number
} {
  return {
    total: users.length,
    admins: users.filter((u) => u.role === 'admin').length,
    workers: users.filter((u) => u.role === 'worker').length,
    clients: users.filter((u) => u.role === 'client').length,
  }
}
