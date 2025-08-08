import React from 'react'
import { cookies } from 'next/headers'
import { getPayload } from 'payload'
import payloadConfig from '@payload-config'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Home, Users, Upload, FileText } from 'lucide-react'
import type { Config } from '@/payload-types'
import { ThemeToggle } from '@/components/custom/theme-toggle'

// Replace extended interface with direct alias to generated type
// type BaseUser = Config['user']
// interface AppUser extends BaseUser { fullName?: string; role?: 'ADMIN' | 'WORKER'; profilePicture?: { url?: string } | null }
// Generated type already includes fields with correct required/optional status
// so we just alias it.
type AppUser = Config['user']

const COOKIE_NAME = 'payload-token'

const navigationItems = [
  { title: 'Dashboard', url: '/worker-dashboard', icon: Home },
  { title: 'Assigned Clients', url: '/worker-clients', icon: Users },
  { title: 'Submit Task', url: '/submit-task', icon: Upload },
]

async function fetchCurrentUser(): Promise<AppUser | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(COOKIE_NAME)?.value
    if (!token) return null
    const payload = await getPayload({ config: payloadConfig })
    // payload.auth with token argument (internal helper not documented fully) fallback to me route
    const me = await payload.find({
      collection: 'users',
      where: { id: { exists: true } },
      limit: 1,
    })
    // NOTE: Without a direct token verify helper exposed here, replace with real endpoint logic later.
    return (me.docs?.[0] as AppUser) || null
  } catch {
    return null
  }
}

function WorkerSidebar() {
  return (
    <Sidebar className="border-r bg-white dark:bg-slate-900 transition-colors">
      <SidebarHeader>
        <div className="flex items-center justify-between gap-2 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm">
              <FileText className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm tracking-tight text-slate-800 dark:text-slate-100">
                Sarh Task Hub
              </span>
              <span className="text-[10px] uppercase text-muted-foreground font-medium">
                Worker
              </span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] font-semibold tracking-wide text-muted-foreground/80">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className="rounded-md transition-colors hover:bg-blue-50 dark:hover:bg-blue-500/10 data-[active=true]:bg-blue-100 dark:data-[active=true]:bg-blue-500/20"
                  >
                    <a
                      href={item.url}
                      className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200"
                    >
                      <item.icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <div className="mt-auto px-4 py-4 border-t border-border/50 text-[11px] text-muted-foreground/70">
        <p className="font-mono">v1.0.0</p>
      </div>
      <SidebarRail />
    </Sidebar>
  )
}

export default async function WorkerDashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await fetchCurrentUser()
  const displayName = user?.fullName || user?.email || 'Worker'
  const avatarURL = (() => {
    const pic = user?.profilePicture
    if (pic && typeof pic === 'object' && 'url' in pic && typeof pic.url === 'string') {
      return pic.url || '/placeholder.svg'
    }
    return '/placeholder.svg'
  })()

  return (
    <SidebarProvider>
      <WorkerSidebar />
      <SidebarInset className="bg-slate-50 dark:bg-slate-950 transition-colors min-h-screen">
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white dark:bg-slate-900 border-border dark:border-slate-800 px-6 transition-colors">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <div className="h-4 w-px bg-border" />
            <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={avatarURL} alt={displayName} />
              <AvatarFallback>
                {displayName
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')}
              </AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <div className="font-medium text-gray-800 leading-tight">{displayName}</div>
              <div className="text-gray-500 text-xs">{user?.role || 'WORKER'}</div>
            </div>
          </div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
