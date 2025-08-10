'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Users, Mail, UserCheck, User, ChevronDown, ChevronUp, Eye, KeyRound } from 'lucide-react'
import {
  sendWelcomeEmailAction,
  resetPasswordAction,
  updateUserDetailsAction,
  setUserPasswordAction,
} from '@/server-actions/user-actions'
import { getRoleBadgeColor } from '@/lib/user-utils'
import { Input } from '@/components/ui/input'

interface UserProfile {
  id: string
  email: string
  name: string
  role: string
  created_at: string
  created_by: string | null
  phone?: string
}

interface UserAccordionProps {
  users: UserProfile[]
}

export function UserAccordion({ users }: UserAccordionProps) {
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)
  const [editUserId, setEditUserId] = useState<string | null>(null)
  const [pwdUserId, setPwdUserId] = useState<string | null>(null)

  const toggleUserExpansion = (userId: string) => {
    setExpandedUserId(expandedUserId === userId ? null : userId)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12"></TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="w-12"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((userProfile) => (
          <React.Fragment key={userProfile.id}>
            <TableRow
              className="cursor-pointer hover:bg-accent/50 dark:hover:bg-accent/30 transition-colors"
              onClick={() => toggleUserExpansion(userProfile.id)}
            >
              <TableCell>
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-400/20 rounded-full flex items-center justify-center">
                  {userProfile.role === 'admin' ? (
                    <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                  ) : userProfile.role === 'worker' ? (
                    <Users className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                  ) : (
                    <User className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                  )}
                </div>
              </TableCell>
              <TableCell className="font-medium text-foreground">{userProfile.name}</TableCell>
              <TableCell className="text-foreground/90">{userProfile.email}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{userProfile.phone}</TableCell>
              <TableCell>
                <Badge className={getRoleBadgeColor(userProfile.role)}>
                  {userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(userProfile.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {expandedUserId === userProfile.id ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </TableCell>
            </TableRow>

            {expandedUserId === userProfile.id && (
              <TableRow>
                <TableCell colSpan={7} className="bg-muted/40 dark:bg-muted/20 p-0">
                  <div
                    className="p-6 space-y-6"
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <Eye className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                      <h3 className="text-lg font-semibold text-foreground">
                        Detailed Profile Information
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            Basic Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">
                              Full Name
                            </Label>
                            <p className="text-sm font-medium text-foreground">
                              {userProfile.name}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">
                              Email Address
                            </Label>
                            <p className="text-sm text-foreground/90">{userProfile.email}</p>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">
                              Phone Number
                            </Label>
                            <p className="text-sm text-foreground/80">
                              {userProfile.phone || 'Not provided'}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">
                              User Role
                            </Label>
                            <div className="mt-1">
                              <Badge className={getRoleBadgeColor(userProfile.role)}>
                                {userProfile.role.charAt(0).toUpperCase() +
                                  userProfile.role.slice(1)}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            Account Details
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">
                              User ID
                            </Label>
                            <p className="text-xs font-mono text-muted-foreground break-all">
                              {userProfile.id}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">
                              Account Created
                            </Label>
                            <p className="text-sm text-foreground/80">
                              {formatDate(userProfile.created_at)}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">
                              Created By
                            </Label>
                            <p className="text-sm text-foreground/80">
                              {userProfile.created_by ? 'Admin User' : 'System Registration'}
                            </p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium text-muted-foreground">
                            Access & Permissions
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">
                              Dashboard Access
                            </Label>
                            <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                              ✓ Enabled
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">
                              Role Permissions
                            </Label>
                            <p className="text-sm text-foreground/80">
                              {userProfile.role === 'admin'
                                ? 'Full system access'
                                : userProfile.role === 'worker'
                                  ? 'Task management access'
                                  : 'Client dashboard access'}
                            </p>
                          </div>
                          <div>
                            <Label className="text-xs font-medium text-muted-foreground">
                              Account Status
                            </Label>
                            <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                              Active
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
                      {/* Edit Profile Toggle */}
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        className="flex items-center gap-2"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditUserId(editUserId === userProfile.id ? null : userProfile.id)
                        }}
                      >
                        <UserCheck className="w-4 h-4" />{' '}
                        {editUserId === userProfile.id ? 'Close Edit' : 'Edit Profile'}
                      </Button>

                      {/* Set Password Toggle */}
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setPwdUserId(pwdUserId === userProfile.id ? null : userProfile.id)
                        }}
                      >
                        {pwdUserId === userProfile.id ? 'Close Password' : 'Set Password'}
                      </Button>

                      {/* Existing server-side email form */}
                      <form
                        action={sendWelcomeEmailAction}
                        className="flex items-center"
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <input type="hidden" name="email" value={userProfile.email} />
                        <input type="hidden" name="name" value={userProfile.name} />
                        <Button
                          variant="outline"
                          size="sm"
                          type="submit"
                          className="flex items-center gap-2"
                        >
                          <Mail className="w-4 h-4" /> Send Email
                        </Button>
                      </form>

                      {/* Temp password generation */}
                      {userProfile.role !== 'admin' && (
                        <form
                          action={resetPasswordAction}
                          className="flex items-center"
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <input type="hidden" name="userId" value={userProfile.id} />
                          <Button
                            variant="outline"
                            size="sm"
                            type="submit"
                            className="text-orange-600 hover:text-orange-700"
                          >
                            Temp Password
                          </Button>
                        </form>
                      )}

                      {/* Edit Form Panel */}
                      {editUserId === userProfile.id && (
                        <div
                          className="basis-full w-full rounded-lg border border-border/70 bg-gradient-to-br from-accent/40 via-background to-background dark:from-accent/10 backdrop-blur-sm shadow-sm ring-1 ring-border/40 p-5 space-y-5 animate-in fade-in slide-in-from-top-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                                <UserCheck className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold leading-tight">
                                  Update Profile
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  Modify basic user details
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditUserId(null)
                              }}
                              className="text-xs"
                            >
                              Close
                            </Button>
                          </div>
                          <form
                            action={updateUserDetailsAction}
                            className="space-y-4"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input type="hidden" name="userId" value={userProfile.id} />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-1.5">
                                <Label
                                  htmlFor={`fullName-${userProfile.id}`}
                                  className="text-xs uppercase tracking-wide text-muted-foreground"
                                >
                                  Full Name
                                </Label>
                                <Input
                                  id={`fullName-${userProfile.id}`}
                                  name="fullName"
                                  defaultValue={userProfile.name}
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label
                                  htmlFor={`phone-${userProfile.id}`}
                                  className="text-xs uppercase tracking-wide text-muted-foreground"
                                >
                                  Phone
                                </Label>
                                <Input
                                  id={`phone-${userProfile.id}`}
                                  name="phone"
                                  defaultValue={userProfile.phone}
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label
                                  htmlFor={`role-${userProfile.id}`}
                                  className="text-xs uppercase tracking-wide text-muted-foreground"
                                >
                                  Role
                                </Label>
                                <select
                                  id={`role-${userProfile.id}`}
                                  name="role"
                                  defaultValue={userProfile.role.toUpperCase()}
                                  className="h-8 text-sm rounded-md border bg-background px-2 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                                >
                                  <option value="ADMIN">Admin</option>
                                  <option value="WORKER">Worker</option>
                                  <option value="CLIENT">Client</option>
                                </select>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-1">
                              <Button type="submit" size="sm" className="gap-1">
                                Save Changes
                              </Button>
                              <Button
                                type="reset"
                                variant="outline"
                                size="sm"
                                className="gap-1"
                                onClick={(e) => {
                                  e.stopPropagation()
                                }}
                              >
                                Reset
                              </Button>
                            </div>
                          </form>
                        </div>
                      )}

                      {/* Set Password Panel */}
                      {pwdUserId === userProfile.id && (
                        <div
                          className="basis-full w-full rounded-lg border border-border/70 bg-gradient-to-br from-primary/5 via-background to-background dark:from-primary/10 backdrop-blur-sm shadow-sm ring-1 ring-border/40 p-5 space-y-5 animate-in fade-in slide-in-from-top-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                                <KeyRound className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold leading-tight">
                                  Set Password
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  Manually override user password
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setPwdUserId(null)
                              }}
                              className="text-xs"
                            >
                              Close
                            </Button>
                          </div>
                          <form
                            action={setUserPasswordAction}
                            className="space-y-4"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input type="hidden" name="userId" value={userProfile.id} />
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-1.5 md:col-span-2">
                                <Label
                                  htmlFor={`password-${userProfile.id}`}
                                  className="text-xs uppercase tracking-wide text-muted-foreground"
                                >
                                  New Password
                                </Label>
                                <Input
                                  id={`password-${userProfile.id}`}
                                  name="password"
                                  type="password"
                                  placeholder="Enter new password"
                                  required
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                                  Guidelines
                                </Label>
                                <ul className="text-[10px] leading-relaxed text-muted-foreground list-disc pl-4 pr-2">
                                  <li>Min 8 chars</li>
                                  <li>Use numbers</li>
                                  <li>Use symbols</li>
                                </ul>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 pt-1">
                              <Button type="submit" size="sm" className="gap-1">
                                Update Password
                              </Button>
                              <Button
                                type="reset"
                                variant="outline"
                                size="sm"
                                className="gap-1"
                                onClick={(e) => {
                                  e.stopPropagation()
                                }}
                              >
                                Clear
                              </Button>
                            </div>
                          </form>
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </React.Fragment>
        ))}
      </TableBody>
    </Table>
  )
}
