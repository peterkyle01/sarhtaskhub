'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { Label } from '@/components/ui/label'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  UserCog,
  Mail,
  Phone,
  Calendar,
  Key,
  Shield,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { Admin } from '@/payload-types'
import type { Config } from '@/payload-types'
import {
  createAdmin,
  updateAdmin,
  deleteAdmin,
  updateAdminPassword,
} from '@/server-actions/admin-actions'

interface AdminsClientProps {
  initialAdmins: Admin[]
  stats: {
    total: number
    recentlyCreated: number
  }
  currentUser: Config['user'] | null
}

export default function AdminsClient({ initialAdmins, stats, currentUser }: AdminsClientProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')

  // Check if the current user is an admin and get their ID
  const currentAdminId = currentUser?.collection === 'admins' ? currentUser.id : null

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)

  // Form states
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null)
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  })

  // Loading states
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  const [error, setError] = useState('')

  const refreshData = () => {
    router.refresh()
  }

  // Filter admins based on search term
  const filteredAdmins = initialAdmins.filter(
    (admin) =>
      admin.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (admin.phone && admin.phone.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  const resetForm = () => {
    setFormData({ fullName: '', email: '', phone: '', password: '', confirmPassword: '' })
    setPasswordData({ newPassword: '', confirmPassword: '' })
    setError('')
  }

  const handleCreateAdmin = async () => {
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.password.trim()) {
      setError('Full name, email, and password are required')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    setIsCreating(true)
    setError('')

    try {
      const result = await createAdmin({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim() || undefined,
      })

      if (result.success) {
        resetForm()
        setShowCreateDialog(false)
        refreshData()
      } else {
        setError(result.error || 'Failed to create admin')
      }
    } catch (_error) {
      setError('An unexpected error occurred')
    } finally {
      setIsCreating(false)
    }
  }

  const handleUpdateAdmin = async () => {
    if (!editingAdmin || !formData.fullName.trim() || !formData.email.trim()) {
      setError('Full name and email are required')
      return
    }

    setIsUpdating(true)
    setError('')

    try {
      const result = await updateAdmin(editingAdmin.id, {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
      })

      if (result.success) {
        resetForm()
        setEditingAdmin(null)
        setShowEditDialog(false)
        refreshData()
      } else {
        setError(result.error || 'Failed to update admin')
      }
    } catch (_error) {
      setError('An unexpected error occurred')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleUpdatePassword = async () => {
    if (!editingAdmin || !passwordData.newPassword.trim()) {
      setError('New password is required')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    setIsUpdatingPassword(true)
    setError('')

    try {
      const result = await updateAdminPassword(editingAdmin.id, passwordData.newPassword)

      if (result.success) {
        resetForm()
        setEditingAdmin(null)
        setShowPasswordDialog(false)
        refreshData()
      } else {
        setError(result.error || 'Failed to update password')
      }
    } catch (_error) {
      setError('An unexpected error occurred')
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const handleDeleteAdmin = async (adminId: number) => {
    // Additional client-side protection
    if (currentAdminId === adminId) {
      setError('You cannot delete your own account')
      return
    }

    setIsDeleting(true)
    setError('')

    try {
      const result = await deleteAdmin(adminId)
      if (result.success) {
        refreshData()
      } else {
        setError(result.error || 'Failed to delete admin')
      }
    } catch (_error) {
      setError('An unexpected error occurred')
    } finally {
      setIsDeleting(false)
    }
  }

  const openEditDialog = (admin: Admin) => {
    setEditingAdmin(admin)
    setFormData({
      fullName: admin.fullName,
      email: admin.email,
      phone: admin.phone || '',
      password: '',
      confirmPassword: '',
    })
    setShowEditDialog(true)
  }

  const openPasswordDialog = (admin: Admin) => {
    setEditingAdmin(admin)
    setPasswordData({ newPassword: '', confirmPassword: '' })
    setShowPasswordDialog(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 border border-red-200 bg-red-50 text-red-700 rounded-lg">{error}</div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Admins</h1>
          <p className="text-muted-foreground">Manage admin accounts and permissions</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2" onClick={resetForm}>
              <Plus className="w-4 h-4" />
              Add Admin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Admin</DialogTitle>
              <DialogDescription>Add a new admin to the system.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  placeholder="Admin full name"
                  value={formData.fullName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="Phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password (min. 6 characters)"
                  value={formData.password}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                  }
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateAdmin}
                  disabled={
                    isCreating ||
                    !formData.fullName.trim() ||
                    !formData.email.trim() ||
                    !formData.password.trim()
                  }
                >
                  {isCreating ? 'Creating...' : 'Create Admin'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Total Admins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Recently Added
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.recentlyCreated}</div>
            <p className="text-sm text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="w-5 h-5" />
            All Admins ({filteredAdmins.length})
          </CardTitle>
          <CardDescription>Search and manage admin accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search admins by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {filteredAdmins.length === 0 ? (
            <div className="text-center py-8">
              <UserCog className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm ? 'No admins found' : 'No admins yet'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? 'Try adjusting your search terms'
                  : 'Get started by adding your first admin'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Admin
                </Button>
              )}
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdmins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Shield className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex items-center gap-2">
                            {admin.fullName}
                            {currentAdminId === admin.id && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                You
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          {admin.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        {admin.phone ? (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            {admin.phone}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(admin.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => openEditDialog(admin)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openPasswordDialog(admin)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Key className="w-4 h-4" />
                          </Button>
                          {currentAdminId !== admin.id ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Admin</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete &ldquo;{admin.fullName}&rdquo;?
                                    This action cannot be undone and will remove all admin
                                    privileges for this user.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteAdmin(admin.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                    disabled={isDeleting}
                                  >
                                    {isDeleting ? 'Deleting...' : 'Delete'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled
                              className="text-muted-foreground cursor-not-allowed"
                              title="Cannot delete your own account"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Admin</DialogTitle>
            <DialogDescription>Update admin information.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-fullName">Full Name *</Label>
              <Input
                id="edit-fullName"
                placeholder="Admin full name"
                value={formData.fullName}
                onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="admin@example.com"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                placeholder="Phone number"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleUpdateAdmin}
                disabled={isUpdating || !formData.fullName.trim() || !formData.email.trim()}
              >
                {isUpdating ? 'Updating...' : 'Update Admin'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Update Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="bg-white dark:bg-gray-900 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle>Update Password</DialogTitle>
            <DialogDescription>Change the password for {editingAdmin?.fullName}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password *</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Enter new password (min. 6 characters)"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-new-password">Confirm New Password *</Label>
              <Input
                id="confirm-new-password"
                type="password"
                placeholder="Confirm new password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                }
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleUpdatePassword}
                disabled={isUpdatingPassword || !passwordData.newPassword.trim()}
              >
                {isUpdatingPassword ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
