import React from 'react'
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
  SidebarFooter,
} from '@/components/ui/sidebar'
import { Home, Users, Upload, FileText } from 'lucide-react'
import type { Config } from '@/payload-types'
import { ThemeToggle } from '@/components/custom/theme-toggle'
import { LogoutButton } from './logout-button'
import { getCurrentUser } from '@/server-actions/user-actions'

// Replace extended interface with direct alias to generated type
// type BaseUser = Config['user']
// interface AppUser extends BaseUser { fullName?: string; role?: 'ADMIN' | 'WORKER'; profilePicture?: { url?: string } | null }
// Generated type already includes fields with correct required/optional status
// so we just alias it.
type AppUser = Config['user']

const navigationItems = [
  { title: 'Dashboard', url: '/worker-dashboard', icon: Home },
  { title: 'Assigned Clients', url: '/worker-clients', icon: Users },
  { title: 'Submit Task', url: '/submit-task', icon: Upload },
]

function WorkerSidebar({ user }: { user: AppUser | null }) {
  const displayName = user?.fullName || user?.email || 'Worker'
  const avatarURL = (() => {
    const pic = user?.profilePicture
    if (pic && typeof pic === 'object' && 'url' in pic && typeof pic.url === 'string') {
      return pic.url || '/placeholder.svg'
    }
    return '/placeholder.svg'
  })()

  return (
    <Sidebar className="border-r border-border/40 bg-card/50 backdrop-blur-xl text-[var(--sidebar-foreground)] transition-all duration-300 shadow-lg">
      <SidebarHeader className="border-b border-border/20">
        <div className="flex items-center justify-between gap-3 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg">
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-foreground">
                Sarh Task Hub
              </span>
              <span className="text-[10px] uppercase text-muted-foreground font-semibold tracking-wider bg-secondary/50 px-2 py-0.5 rounded-full">
                Worker Panel
              </span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-bold tracking-wide text-muted-foreground/90 uppercase mb-3 px-3">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className="rounded-xl transition-all duration-200 hover:bg-accent/80 hover:shadow-md data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:shadow-md data-[active=true]:border-primary/20 focus-visible:ring-2 focus-visible:ring-primary/50 group"
                  >
                    <a
                      href={item.url}
                      className="flex items-center gap-3 text-sm font-medium px-3 py-3 text-foreground/80 hover:text-foreground transition-colors"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50 group-hover:bg-accent group-data-[active=true]:bg-primary/20 transition-colors">
                        <item.icon className="h-4 w-4" />
                      </div>
                      <span className="font-medium">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border/20 bg-card/30 backdrop-blur-sm">
        <div className="p-4 space-y-4">
          {/* User Profile Section */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-background/50 border border-border/20 shadow-sm hover:shadow-md transition-all duration-200">
            <Avatar className="h-10 w-10 ring-2 ring-background shadow-md">
              <AvatarImage src={avatarURL} alt={displayName} />
              <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-primary/20 to-secondary/20 text-foreground">
                {displayName
                  .split(' ')
                  .map((n: string) => n[0])
                  .join('')
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-foreground truncate">{displayName}</div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs text-muted-foreground font-medium">
                  {user?.role || 'WORKER'}
                </span>
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <LogoutButton />

          {/* Version Info */}
          <div className="pt-2 border-t border-border/10">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground/60">
              <span className="font-mono font-medium">v1.0.0</span>
              <div className="flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                <span className="uppercase tracking-wide font-semibold">Online</span>
              </div>
            </div>
          </div>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

export default async function WorkerDashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  return (
    <SidebarProvider>
      <WorkerSidebar user={user} />
      <SidebarInset className="bg-[var(--background)] transition-colors min-h-screen">
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-[var(--card)] border-[var(--border)] px-6 transition-colors">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <div className="h-4 w-px bg-[var(--border)]" />
            <h1 className="text-lg font-semibold">Dashboard</h1>
          </div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
