'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Eye, Calendar, FileText, Users, List, LayoutGrid } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

// Types
// (Legacy Client interface removed; using AssignedClientSummary from server actions)

interface _ClientTask {
  id: string
  title: string
  type: string
  status: string
  dueDate: string
  score: number | null
  completedDate: string | null
}

// Data now fetched from server actions

import {
  listAssignedClientsForCurrentTutor,
  type AssignedClientSummary,
} from '@/server-actions/tutors-actions'

function getPlatformBadge(platform: string) {
  // Skip showing "Online" platform or empty/Remote defaults
  if (!platform || platform === 'Online' || platform === 'Remote') return null

  const colors: Record<string, string> = {
    Cengage:
      'bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-400/20 dark:text-blue-300 dark:hover:bg-blue-400/25',
    ALEKS:
      'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-400/20 dark:text-green-300 dark:hover:bg-green-400/25',
  }
  return (
    <Badge className={`${colors[platform] || 'bg-gray-100 text-gray-800'} text-xs rounded-full`}>
      {platform}
    </Badge>
  )
}

export default function AssignedClientsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [clients, setClients] = useState<AssignedClientSummary[]>([])
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const data = await listAssignedClientsForCurrentTutor()
        if (active) setClients(data)
      } catch (e) {
        console.error('Failed to load assigned clients', e)
      } finally {
        // no-op (loading state removed)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  // Filter clients based on search term only
  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.courseName.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  const handleViewTasks = async (client: AssignedClientSummary) => {
    // Navigate to tasks page with client filter
    router.push(`/tutor/tasks?client=${encodeURIComponent(client.name)}`)
  }

  const totalClients = clients.length
  const activeClients = clients.filter((c) => c.taskCounts.pending > 0).length
  const completedClients = clients.filter(
    (c) => c.taskCounts.total === c.taskCounts.completed,
  ).length

  return (
    <div className="flex-1 space-y-6">
      {/* Compact Header */}
      <Card className="bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground border-0 rounded-xl shadow-lg overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
        <CardContent className="relative p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
                <span>Assigned Clients</span>
                <span className="text-lg">👥</span>
              </h2>
              <p className="opacity-90 text-sm">
                Manage your assigned clients and track their progress
              </p>
            </div>
            <div className="hidden sm:block">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <div className="text-lg font-bold">{totalClients}</div>
                <div className="text-xs opacity-80">Total</div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <div className="text-lg font-bold">{activeClients}</div>
                <div className="text-xs opacity-80">Active</div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <div className="text-lg font-bold">{completedClients}</div>
                <div className="text-xs opacity-80">Done</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Filters & View Toggle */}
      <Card className="rounded-xl shadow-sm border border-border/40 bg-background/60 backdrop-blur">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Search className="h-4 w-4" />
              </div>
              <Input
                placeholder="Search by name or course"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 rounded-lg"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <div className="flex border border-border/60 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 h-10 flex items-center gap-1 text-xs font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted text-muted-foreground'
                  }`}
                  aria-label="List view"
                >
                  <List className="h-4 w-4" />
                  List
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 h-10 flex items-center gap-1 text-xs font-medium transition-colors border-l border-border/60 ${
                    viewMode === 'grid'
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted text-muted-foreground'
                  }`}
                  aria-label="Grid view"
                >
                  <LayoutGrid className="h-4 w-4" />
                  Grid
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="text-muted-foreground">Legend:</span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Completed
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Pending
            </span>
          </div>
        </CardContent>
      </Card>

      {filteredClients.length > 0 && viewMode === 'list' && (
        <div className="space-y-5">
          {filteredClients.map((client) => {
            const { completed, pending, total } = client.taskCounts
            const pct = (val: number) => (total ? Math.round((val / total) * 100) : 0)
            return (
              <Card
                key={client.id}
                className="group border border-border/50 hover:border-primary/40 transition-colors rounded-xl bg-background/70 backdrop-blur-sm shadow-sm hover:shadow-md"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-stretch gap-6">
                    {/* Left: Avatar + Basic */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="relative shrink-0">
                        <Avatar className="h-14 w-14">
                          <AvatarImage src={'/placeholder.svg'} alt={client.name} />
                          <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                            {client.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className="min-w-0 space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-semibold text-base truncate max-w-[200px] sm:max-w-[250px] md:max-w-[300px]">
                            {client.name}
                          </h3>
                          {getPlatformBadge(client.platform)}
                          <span className="text-xs text-muted-foreground hidden sm:inline">
                            • {client.taskCounts.total} tasks
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" /> Joined{' '}
                          {new Date(client.joinDate).toLocaleDateString()}
                        </p>
                        <p className="text-sm font-medium truncate max-w-[250px] md:max-w-[300px] text-foreground/90 flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5" /> {client.courseName}
                        </p>
                      </div>
                    </div>

                    {/* Middle: Progress Bar + counts */}
                    <div className="flex-1 flex flex-col justify-center gap-3 min-w-[240px] md:px-4">
                      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
                        <span>Progress</span>
                        <span>
                          {completed}/{total}
                        </span>
                      </div>
                      <div className="h-3 w-full rounded-full bg-muted overflow-hidden ring-1 ring-border/50">
                        <div className="h-full flex">
                          <div style={{ width: pct(completed) + '%' }} className="bg-green-500" />
                          <div style={{ width: pct(pending) + '%' }} className="bg-amber-500" />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {completed > 0 && (
                          <span className="px-2 py-1 rounded-md bg-green-500/15 text-green-600 dark:text-green-400">
                            {completed} ✅ Completed
                          </span>
                        )}
                        {pending > 0 && (
                          <span className="px-2 py-1 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-300">
                            {pending} ⏳ Pending
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions / Deadlines */}
                    <div className="flex flex-row md:flex-col items-end gap-3 md:gap-3 w-full md:w-auto justify-between md:justify-start pt-2">
                      {client.nextDeadline ? (
                        <div className="px-3 py-2 rounded-lg border text-xs flex items-center gap-2 bg-orange-500/5 border-orange-300/40 dark:border-orange-800/50 text-orange-700 dark:text-orange-300">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(client.nextDeadline).toLocaleDateString()}
                        </div>
                      ) : (
                        <div className="px-3 py-2 rounded-lg border text-xs text-muted-foreground border-border/40">
                          No deadline
                        </div>
                      )}
                      <Button
                        size="sm"
                        onClick={() => handleViewTasks(client)}
                        className="h-10 text-sm px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                      >
                        <Eye className="h-4 w-4 mr-2" /> View Tasks
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {filteredClients.length > 0 && viewMode === 'grid' && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredClients.map((client) => (
            <Card
              key={client.id}
              className="group hover:shadow-md transition-all duration-200 rounded-xl border border-border/40 bg-background/70 backdrop-blur-sm"
            >
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={'/placeholder.svg'} alt={client.name} />
                    <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {client.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                      {client.name}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">{client.courseName}</p>
                  </div>
                  <div className="text-right">
                    <Badge className="text-xs bg-muted/50" variant="outline">
                      {client.taskCounts.total} tasks
                    </Badge>
                  </div>
                </div>
                <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                  <div className="flex h-full">
                    <div
                      style={{
                        width: (client.taskCounts.completed / client.taskCounts.total) * 100 + '%',
                      }}
                      className="bg-green-500"
                    />
                    <div
                      style={{
                        width: (client.taskCounts.pending / client.taskCounts.total) * 100 + '%',
                      }}
                      className="bg-amber-500"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  {client.taskCounts.completed > 0 && (
                    <span className="px-2 py-1 rounded bg-green-500/15 text-green-600 dark:text-green-400">
                      {client.taskCounts.completed} ✅
                    </span>
                  )}
                  {client.taskCounts.pending > 0 && (
                    <span className="px-2 py-1 rounded bg-amber-500/15 text-amber-600 dark:text-amber-300">
                      {client.taskCounts.pending} ⏳
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between pt-2">
                  {client.nextDeadline ? (
                    <span className="text-xs flex items-center gap-1.5 text-orange-600 dark:text-orange-300">
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(client.nextDeadline).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">No deadline</span>
                  )}
                  <Button
                    size="sm"
                    onClick={() => handleViewTasks(client)}
                    className="h-8 text-xs px-3"
                  >
                    <Eye className="h-3 w-3 mr-1" /> View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {/* Enhanced Empty State */}
      {filteredClients.length === 0 && (
        <Card className="rounded-2xl shadow-lg border-0 bg-gradient-to-br from-card to-card/80">
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center gap-6">
              <div className="w-24 h-24 bg-muted/30 rounded-full flex items-center justify-center">
                <Users className="h-12 w-12 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2">No clients found</h3>
                <p className="text-lg text-muted-foreground">
                  Try adjusting your search or filter criteria to find clients.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
