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
import { Users, UserCheck, User, ChevronDown, ChevronUp, Eye } from 'lucide-react'
import { updateUserDetailsAction } from '@/server-actions/user-actions'
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
  // Removed editUserId & pwdUserId states; consolidated into inline basic edit
  const [basicEditUserId, setBasicEditUserId] = useState<string | null>(null)
  const [basicEditValues, setBasicEditValues] = useState<{
    fullName: string
    phone: string
    role: string
    password: string
  }>({ fullName: '', phone: '', role: 'ADMIN', password: '' })

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
                          <CardTitle className="text-sm font-medium flex justify-between items-center text-muted-foreground">
                            <span>Basic Information</span>
                            {basicEditUserId === userProfile.id ? (
                              <div className="flex items-center gap-1">
                                <Button
                                  size={'sm'}
                                  variant={'link'}
                                  className="hover:text-blue-600 dark:hover:text-blue-300"
                                  form={`basic-info-form-${userProfile.id}`}
                                  type="submit"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Save
                                </Button>
                                <Button
                                  size={'sm'}
                                  variant={'link'}
                                  className="text-muted-foreground/70 hover:text-destructive"
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setBasicEditUserId(null)
                                  }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size={'sm'}
                                variant={'link'}
                                className="hover:text-blue-600 dark:hover:text-blue-300"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setBasicEditUserId(userProfile.id)
                                  setBasicEditValues({
                                    fullName: userProfile.name,
                                    phone: userProfile.phone || '',
                                    role: userProfile.role.toUpperCase(),
                                    password: '',
                                  })
                                }}
                              >
                                Edit
                              </Button>
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {basicEditUserId === userProfile.id ? (
                            <form
                              id={`basic-info-form-${userProfile.id}`}
                              action={updateUserDetailsAction}
                              onSubmit={() => {
                                setBasicEditUserId(null)
                              }}
                              className="space-y-3"
                            >
                              <input type="hidden" name="userId" value={userProfile.id} />
                              <div>
                                <Label
                                  className="text-xs font-medium text-muted-foreground"
                                  htmlFor={`fullName-inline-${userProfile.id}`}
                                >
                                  Full Name
                                </Label>
                                <Input
                                  id={`fullName-inline-${userProfile.id}`}
                                  name="fullName"
                                  value={basicEditValues.fullName}
                                  onChange={(e) =>
                                    setBasicEditValues((v) => ({ ...v, fullName: e.target.value }))
                                  }
                                  className="mt-1 h-8 text-sm"
                                  required
                                />
                              </div>
                              <div>
                                <Label
                                  className="text-xs font-medium text-muted-foreground"
                                  htmlFor={`phone-inline-${userProfile.id}`}
                                >
                                  Phone Number
                                </Label>
                                <Input
                                  id={`phone-inline-${userProfile.id}`}
                                  name="phone"
                                  value={basicEditValues.phone}
                                  onChange={(e) =>
                                    setBasicEditValues((v) => ({ ...v, phone: e.target.value }))
                                  }
                                  className="mt-1 h-8 text-sm"
                                />
                              </div>
                              <div>
                                <Label
                                  className="text-xs font-medium text-muted-foreground"
                                  htmlFor={`role-inline-${userProfile.id}`}
                                >
                                  Role
                                </Label>
                                <select
                                  id={`role-inline-${userProfile.id}`}
                                  name="role"
                                  value={basicEditValues.role}
                                  onChange={(e) =>
                                    setBasicEditValues((v) => ({ ...v, role: e.target.value }))
                                  }
                                  className="mt-1 h-8 text-sm rounded-md border bg-background px-2 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
                                >
                                  <option value="ADMIN">Admin</option>
                                  <option value="WORKER">Worker</option>
                                  <option value="CLIENT">Client</option>
                                </select>
                              </div>
                              <div>
                                <Label
                                  className="text-xs font-medium text-muted-foreground"
                                  htmlFor={`password-inline-${userProfile.id}`}
                                >
                                  Set New Password (optional)
                                </Label>
                                <Input
                                  id={`password-inline-${userProfile.id}`}
                                  name="password"
                                  type="password"
                                  value={basicEditValues.password}
                                  onChange={(e) =>
                                    setBasicEditValues((v) => ({ ...v, password: e.target.value }))
                                  }
                                  placeholder="Leave blank to keep current"
                                  className="mt-1 h-8 text-sm"
                                />
                                <p className="text-[10px] text-muted-foreground mt-1">
                                  Min 8 chars, include numbers & symbols.
                                </p>
                              </div>
                            </form>
                          ) : (
                            <>
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
                            </>
                          )}
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

                    {/* Removed bottom action buttons & panels now redundant */}
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
