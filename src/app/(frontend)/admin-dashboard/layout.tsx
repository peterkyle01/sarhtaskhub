import React from 'react'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { getCurrentUser } from '@/server-actions/user-actions'
import { AdminSidebar } from './admin-sidebar'
import { AutoCollapseWrapper } from './auto-collapse-wrapper'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

// Remove incompatible interface extension; use generated type directly
// type BaseUser = Config['user']
// interface AppUser extends BaseUser { fullName?: string; role?: 'ADMIN' | 'WORKER'; profilePicture?: { url?: string } | null }
// Generated type already includes fullName, role, profilePicture (number | Media)
// Use alias for clarity.
export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  return (
    <SidebarProvider>
      <AutoCollapseWrapper>
        <AdminSidebar user={user} />
      </AutoCollapseWrapper>
      <SidebarInset className="bg-[var(--background)] transition-colors min-h-screen">
        <header className="sticky top-0 z-40 flex h-14 sm:h-16 shrink-0 items-center justify-between border-b surface-gradient backdrop-blur supports-[backdrop-filter]:bg-[var(--card)]/80 border-[var(--border)] px-4 sm:px-6 transition-colors shadow-sm">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1 size-8 sm:size-7" />
            <div className="h-4 w-px bg-[var(--border)]" />
            <h1 className="font-semibold text-[clamp(.95rem,2.5vw,1.1rem)] sm:text-lg">
              Dashboard
            </h1>
          </div>
        </header>
        <div className="flex-1 p-3 sm:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
