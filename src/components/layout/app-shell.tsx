'use client'

import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Sidebar } from './sidebar'
import { Header } from './header'

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const pathname = usePathname()

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">🏏</div>
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900">
        <div className="text-center text-white">
          <div className="text-6xl mb-4">🏏</div>
          <p className="text-lg">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // Authenticated layout
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col pl-64">
        <Header />
        <main className="flex-1 p-6 cricket-gradient">
          {children}
        </main>
      </div>
    </div>
  )
}
