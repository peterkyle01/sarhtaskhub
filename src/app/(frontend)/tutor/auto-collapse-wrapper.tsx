'use client'

import React from 'react'
import { useSidebar } from '@/components/ui/sidebar'

export function AutoCollapseWrapper({ children }: { children: React.ReactNode }) {
  const { setOpen, isMobile } = useSidebar()
  React.useEffect(() => {
    if (!isMobile && typeof window !== 'undefined' && window.innerWidth < 1024) {
      setOpen(false)
    }
  }, [isMobile, setOpen])
  return <>{children}</>
}
