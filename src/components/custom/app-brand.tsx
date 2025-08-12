'use client'

import React from 'react'
import { ThemeToggle } from '@/components/custom/theme-toggle'
import { cn } from '@/lib/utils'
import { ServerCog } from 'lucide-react'

interface AppBrandProps {
  panelLabel: string
  className?: string
  subtle?: boolean // allow future variants
}

// Using ServerCog icon as brand mark
function LogoMark() {
  return (
    <div
      className={cn(
        'relative flex items-center justify-center h-full w-full',
        '[&>svg]:h-4 [&>svg]:w-4 sm:[&>svg]:h-5 sm:[&>svg]:w-5',
      )}
    >
      <ServerCog className={cn('text-primary-foreground drop-shadow')} strokeWidth={2} />
    </div>
  )
}

export function AppBrand({ panelLabel, className, subtle }: AppBrandProps) {
  return (
    <div
      className={cn(
        'group relative w-full rounded-lg sm:rounded-xl overflow-hidden',
        subtle
          ? 'bg-background/40 backdrop-blur supports-[backdrop-filter]:bg-background/30 border border-border/50'
          : 'bg-gradient-to-br from-background/80 via-background/60 to-background/40 backdrop-blur-xl supports-[backdrop-filter]:bg-background/50 border border-border/60 shadow-sm',
        'after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:border after:border-white/5',
        className,
      )}
    >
      <div className="relative flex flex-col gap-1 px-2.5 sm:px-3 py-2.5 sm:py-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-md sm:rounded-lg bg-gradient-to-br from-primary via-primary/70 to-accent flex items-center justify-center shadow ring-1 ring-primary/40">
            <LogoMark />
          </div>
          <span className="font-bold tracking-tight text-[0.85rem] sm:text-[0.95rem] md:text-base whitespace-nowrap select-none">
            Sarh Task Hub
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide bg-secondary/40 text-secondary-foreground ring-1 ring-border/40">
            {panelLabel}
          </span>
          <ThemeToggle />
        </div>
      </div>
    </div>
  )
}
