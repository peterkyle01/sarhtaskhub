import React from 'react'

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return <main className="min-h-screen">{children}</main>
}
