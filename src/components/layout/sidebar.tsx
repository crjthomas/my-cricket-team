'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth, usePermissions } from '@/lib/auth-context'
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
  Lock,
  LogOut,
  Shield,
  Flame,
  X,
  Target,
} from 'lucide-react'

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout, isAdmin } = useAuth()
  const permissions = usePermissions()

  // Navigation items with permission checks
  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, allowed: true },
    { name: 'Players', href: '/players', icon: Users, allowed: permissions.canViewPlayers, adminOnly: permissions.canManagePlayers },
    { name: 'Matches', href: '/matches', icon: Calendar, allowed: permissions.canViewMatches, adminOnly: permissions.canManageMatches },
    { name: 'Squad Selector', href: '/squad', icon: Sparkles, allowed: permissions.canUseAISelector, adminOnly: true, aiFeature: true },
    { name: 'Practice Match', href: '/practice', icon: Target, allowed: isAdmin, adminOnly: true },
    { name: 'Opponents', href: '/opponents', icon: Swords, allowed: isAdmin },
    { name: 'Venues', href: '/venues', icon: MapPin, allowed: isAdmin },
    { name: 'Statistics', href: '/stats', icon: BarChart3, allowed: permissions.canViewStats },
    { name: 'Media', href: '/media', icon: Image, allowed: permissions.canViewGallery },
    { name: 'Season', href: '/season', icon: Trophy, allowed: true },
  ]

  const bottomNav = [
    { name: 'Settings', href: '/settings', icon: Settings, allowed: permissions.canManageSettings },
  ]

  const handleLogout = async () => {
    await logout()
    window.location.href = '/login'
  }

  const handleNavClick = () => {
    // Close sidebar on mobile after navigation
    if (onClose) {
      onClose()
    }
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-midnight-950 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="flex h-16 items-center justify-between gap-3 px-4 lg:px-6 border-b border-midnight-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pitch-500 to-leather-500 shadow-lg shadow-pitch-500/25">
              <Flame className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">Phoenix</h1>
              <p className="text-xs text-midnight-400">Team Manager</p>
            </div>
          </div>
          
          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-midnight-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col h-[calc(100vh-4rem)] px-3 py-4 overflow-y-auto">
          <div className="flex-1 space-y-1">
            {navigation.map((item) => {
              if (!item.allowed) return null
              
              const isActive = pathname === item.href || 
                (item.href !== '/' && pathname.startsWith(item.href))
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={handleNavClick}
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
                  {item.aiFeature && (
                    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-stumps-500/20 text-stumps-400 font-semibold">
                      AI
                    </span>
                  )}
                  {item.adminOnly && !item.aiFeature && (
                    <Shield className="ml-auto h-3 w-3 text-midnight-500" />
                  )}
                </Link>
              )
            })}
          </div>

          {/* Bottom navigation */}
          <div className="border-t border-midnight-800 pt-4 mt-4 space-y-1">
            {bottomNav.map((item) => {
              if (!item.allowed) return null
              
              const isActive = pathname === item.href
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={handleNavClick}
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
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-midnight-400 hover:bg-midnight-800 hover:text-white transition-all duration-200"
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              Logout
            </button>
          </div>

          {/* User info card */}
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-pitch-900/50 to-midnight-900 border border-pitch-800/30">
            <div className="flex items-center gap-2 mb-2">
              {isAdmin ? (
                <>
                  <Shield className="h-4 w-4 text-stumps-400" />
                  <span className="text-xs font-semibold text-stumps-400">ADMIN</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 text-midnight-400" />
                  <span className="text-xs font-semibold text-midnight-400">VIEWER</span>
                </>
              )}
            </div>
            <p className="text-sm font-medium text-white truncate">{user?.username}</p>
            <p className="mt-1 text-xs text-midnight-400">
              {isAdmin ? 'Full access' : 'View-only'}
            </p>
          </div>
        </nav>
      </div>
    </>
  )
}
