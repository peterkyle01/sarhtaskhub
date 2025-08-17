import React from 'react'
import { redirect } from 'next/navigation'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { AutoCollapseWrapper } from './auto-collapse-wrapper'
import { requireTutor } from '@/server-actions/auth-actions'
import { TutorSidebar } from './tutor-sidebar'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

// Replace extended interface with direct alias to generated type
// type BaseUser = Config['user']
// interface AppUser extends BaseUser { fullName?: string; role?: 'ADMIN' | 'TUTOR'; profilePicture?: { url?: string } | null }
// Generated type already includes fields with correct required/optional status
// so we just alias it.

export default async function TutorDashboardLayout({ children }: { children: React.ReactNode }) {
  let user

  try {
    user = await requireTutor()
  } catch (error) {
    // Redirect to login if not authenticated or not a tutor
    if (error instanceof Error && error.message === 'AUTHENTICATION_REQUIRED') {
      redirect('/')
    } else if (error instanceof Error && error.message === 'TUTOR_ACCESS_REQUIRED') {
      redirect('/admin') // Redirect admins to their own dashboard
    }
    redirect('/') // Fallback redirect
  }

  return (
    <SidebarProvider>
      <AutoCollapseWrapper>
        <TutorSidebar user={user} />
        <SidebarInset className="bg-[var(--background)] transition-colors min-h-screen panel-gradient">
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
      </AutoCollapseWrapper>
    </SidebarProvider>
  )
}
