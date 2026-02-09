'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { Flame } from 'lucide-react'

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-800 via-orange-700 to-amber-600">
        <div className="text-center text-white">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/25">
              <Flame className="h-12 w-12 text-white" />
            </div>
          </div>
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  // Auth pages don't need shell
  if (pathname === '/login' || pathname === '/register') {
    return <>{children}</>
  }

  // Redirect to login if not authenticated
  if (!user) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login'
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-800 via-orange-700 to-amber-600">
        <div className="text-center text-white">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/25">
              <Flame className="h-12 w-12 text-white" />
            </div>
          </div>
          <p className="text-lg">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // Authenticated layout
  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col lg:pl-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 md:p-6 cricket-gradient">
          {children}
        </main>
      </div>
    </div>
  )
}
