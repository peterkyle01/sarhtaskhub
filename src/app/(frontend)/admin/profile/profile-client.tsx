'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  updateCurrentAdminProfile,
  updateCurrentAdminPassword,
  uploadAdminProfilePicture,
  AdminDoc,
} from '@/server-actions/admin-actions'
import { Eye, EyeOff, Save, User, Key, Upload, Camera } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  initialProfile: AdminDoc
}

export function AdminProfileClient({ initialProfile }: Props) {
  const [profile, setProfile] = useState(initialProfile)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const router = useRouter()

  // Check if this is a SuperAdmin (doesn't have fullName field)
  const isSuperAdmin = !('fullName' in profile)

  const [profileData, setProfileData] = useState({
    fullName: 'fullName' in profile ? profile.fullName || '' : '',
    phone: 'phone' in profile ? profile.phone || '' : '',
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  function handleProfileUpdate() {
    if (!profileData.fullName.trim()) return

    startTransition(async () => {
      try {
        const updated = await updateCurrentAdminProfile(profileData)
        if (updated) {
          setProfile(updated)
          setMessage({ type: 'success', text: 'Profile updated successfully!' })
          router.refresh()
        } else {
          setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' })
        }
      } catch (e) {
        console.error('Failed to update profile:', e)
        setMessage({ type: 'error', text: 'An error occurred while updating your profile.' })
      }
    })
  }

  function handlePasswordUpdate() {
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      setMessage({ type: 'error', text: 'Please fill in all password fields.' })
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New password and confirmation do not match.' })
      return
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters long.' })
      return
    }

    startTransition(async () => {
      try {
        const result = await updateCurrentAdminPassword(
          passwordData.currentPassword,
          passwordData.newPassword,
        )

        if (result.success) {
          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
          setMessage({ type: 'success', text: 'Password updated successfully!' })
        } else {
          setMessage({ type: 'error', text: result.error || 'Failed to update password.' })
        }
      } catch (e) {
        console.error('Failed to update password:', e)
        setMessage({ type: 'error', text: 'An error occurred while updating your password.' })
      }
    })
  }

  function handleProfilePictureUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Please upload a JPEG, PNG, or WebP image.' })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({
        type: 'error',
        text: 'File size too large. Please upload an image smaller than 5MB.',
      })
      return
    }

    setIsUploadingImage(true)

    const formData = new FormData()
    formData.append('file', file)

    uploadAdminProfilePicture(formData)
      .then(async (result) => {
        if (result.success && result.mediaId) {
          // Update profile with new profile picture
          const updatedProfile = await updateCurrentAdminProfile({
            ...profileData,
            profilePicture: result.mediaId,
          })

          if (updatedProfile) {
            setProfile(updatedProfile)
            setMessage({ type: 'success', text: 'Profile picture updated successfully!' })
            router.refresh()
          } else {
            setMessage({ type: 'error', text: 'Failed to update profile with new picture.' })
          }
        } else {
          setMessage({ type: 'error', text: result.error || 'Failed to upload image.' })
        }
      })
      .catch((e) => {
        console.error('Failed to upload profile picture:', e)
        setMessage({ type: 'error', text: 'An error occurred while uploading your image.' })
      })
      .finally(() => {
        setIsUploadingImage(false)
        // Reset the file input
        event.target.value = ''
      })
  }

  const avatarURL = (() => {
    if ('profilePicture' in profile) {
      const pic = profile.profilePicture
      if (pic && typeof pic === 'object' && 'url' in pic && typeof pic.url === 'string') {
        return pic.url || '/placeholder.svg'
      }
    }
    return '/placeholder.svg'
  })()

  const displayName = ('fullName' in profile ? profile.fullName : null) || profile.email

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`p-4 rounded-lg border ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Information Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <User className="h-5 w-5" />
              <div>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  {isSuperAdmin
                    ? 'View your account information'
                    : 'Update your personal details and preferences'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Picture and Basic Info */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar
                  className={`h-20 w-20 ring-2 ring-background shadow-lg transition-opacity ${isUploadingImage ? 'opacity-50' : ''}`}
                >
                  <AvatarImage src={avatarURL} alt={displayName} className="object-cover" />
                  <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-primary/20 to-secondary/20">
                    {displayName
                      .split(' ')
                      .map((n: string) => n[0])
                      .join('')
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {isUploadingImage && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full">
                    <Upload className="h-6 w-6 text-white animate-spin" />
                  </div>
                )}
                {!isSuperAdmin && (
                  <input
                    id="profile-picture-input"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleProfilePictureUpload}
                    className="hidden"
                    disabled={isUploadingImage}
                  />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{displayName}</h3>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-xs text-muted-foreground">
                    {isSuperAdmin ? 'Active Super Admin' : 'Active Admin'}
                  </span>
                </div>
                {!isSuperAdmin && (
                  <div className="mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('profile-picture-input')?.click()}
                      disabled={isUploadingImage}
                      className="text-xs"
                    >
                      {isUploadingImage ? (
                        <>
                          <Upload className="h-3 w-3 mr-1 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Camera className="h-3 w-3 mr-1" />
                          Change Photo
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">Max 5MB • JPEG, PNG, WebP</p>
                  </div>
                )}
              </div>
            </div>

            {!isSuperAdmin && (
              <>
                <Separator />

                {/* Editable Fields */}
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={profileData.fullName}
                      onChange={(e) =>
                        setProfileData((prev) => ({ ...prev, fullName: e.target.value }))
                      }
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      disabled
                      className="opacity-50"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email address cannot be changed. Contact super admin if needed.
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) =>
                        setProfileData((prev) => ({ ...prev, phone: e.target.value }))
                      }
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleProfileUpdate}
                  disabled={isPending || !profileData.fullName.trim()}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isPending ? 'Updating...' : 'Update Profile'}
                </Button>
              </>
            )}

            {isSuperAdmin && (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  Super Admin accounts have read-only profile information.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Password Change Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Key className="h-5 w-5" />
              <div>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your account password for security</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))
                  }
                  placeholder="Enter your current password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))
                  }
                  placeholder="Enter your new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                  }
                  placeholder="Confirm your new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>Password requirements:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>At least 6 characters long</li>
                <li>Include a mix of letters and numbers for better security</li>
              </ul>
            </div>

            <Button
              onClick={handlePasswordUpdate}
              disabled={
                isPending ||
                !passwordData.currentPassword ||
                !passwordData.newPassword ||
                !passwordData.confirmPassword
              }
              className="w-full"
              variant="outline"
            >
              <Key className="h-4 w-4 mr-2" />
              {isPending ? 'Updating...' : 'Update Password'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Admin Role Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your administrative access and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">
                {isSuperAdmin ? 'Super Administrator' : 'Administrator'}
              </p>
              <p className="text-sm text-muted-foreground">
                {isSuperAdmin
                  ? 'Highest level access with full system control and user management'
                  : 'Full access to manage tutors, clients, subjects, and tasks'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
