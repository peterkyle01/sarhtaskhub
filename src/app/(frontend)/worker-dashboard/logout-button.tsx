'use client'

import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { logout } from '@/server-actions/user-actions'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function LogoutButton() {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      const result = await logout()
      if (result.success) {
        router.push('/')
        router.refresh()
      }
    } catch (error) {
      console.error('Logout failed:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="w-full justify-start gap-3 h-11 bg-destructive/5 border-destructive/20 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-destructive/10 group-hover:bg-destructive-foreground/20 transition-colors">
        <LogOut className="h-4 w-4" />
      </div>
      <span className="font-medium">{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
    </Button>
  )
}
