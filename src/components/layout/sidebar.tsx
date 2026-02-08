'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Calendar,
  Trophy,
  MapPin,
  Image,
  Sparkles,
  BarChart3,
  Settings,
  Swords,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Players', href: '/players', icon: Users },
  { name: 'Matches', href: '/matches', icon: Calendar },
  { name: 'Squad Selector', href: '/squad', icon: Sparkles },
  { name: 'Opponents', href: '/opponents', icon: Swords },
  { name: 'Venues', href: '/venues', icon: MapPin },
  { name: 'Statistics', href: '/stats', icon: BarChart3 },
  { name: 'Media', href: '/media', icon: Image },
  { name: 'Season', href: '/season', icon: Trophy },
]

const bottomNav = [
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-midnight-950 text-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-midnight-800">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pitch-500 to-pitch-600 shadow-lg">
          <span className="text-xl">🏏</span>
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-tight">My Cricket Team</h1>
          <p className="text-xs text-midnight-400">Team Manager</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col h-[calc(100vh-4rem)] px-3 py-4">
        <div className="flex-1 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href))
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-pitch-600 text-white shadow-lg shadow-pitch-600/25'
                    : 'text-midnight-300 hover:bg-midnight-800 hover:text-white'
                )}
              >
                <item.icon className={cn(
                  'h-5 w-5 flex-shrink-0',
                  isActive ? 'text-white' : 'text-midnight-400'
                )} />
                {item.name}
                {item.name === 'Squad Selector' && (
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-stumps-500/20 text-stumps-400 font-semibold">
                    AI
                  </span>
                )}
              </Link>
            )
          })}
        </div>

        {/* Bottom navigation */}
        <div className="border-t border-midnight-800 pt-4 mt-4">
          {bottomNav.map((item) => {
            const isActive = pathname === item.href
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-midnight-800 text-white'
                    : 'text-midnight-400 hover:bg-midnight-800 hover:text-white'
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {item.name}
              </Link>
            )
          })}
        </div>

        {/* Season info card */}
        <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-pitch-900/50 to-midnight-900 border border-pitch-800/30">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-4 w-4 text-stumps-400" />
            <span className="text-xs font-semibold text-stumps-400">CURRENT SEASON</span>
          </div>
          <p className="text-sm font-medium text-white">Winter League 2026</p>
          <div className="mt-2 flex items-center gap-2 text-xs text-midnight-300">
            <span className="text-pitch-400 font-semibold">3rd</span>
            <span>of 8 teams</span>
            <span className="text-midnight-600">•</span>
            <span>W4 L1 D1</span>
          </div>
        </div>
      </nav>
    </div>
  )
}

