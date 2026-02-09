'use client'

import { useState } from 'react'
import { Bell, Search, Plus, MessageSquare, Shield, X, ChevronRight, Menu, Flame } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth, usePermissions } from '@/lib/auth-context'
import Link from 'next/link'

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, isAdmin } = useAuth()
  const permissions = usePermissions()
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSearch, setShowSearch] = useState(false)

  // Get user initials
  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : 'U'

  const quickAddOptions = [
    { label: 'Add Player', href: '/players/add', icon: '👤' },
    { label: 'Add Opponent', href: '/opponents', icon: '⚔️' },
    { label: 'Add Venue', href: '/venues', icon: '📍' },
    { label: 'Add Season', href: '/season', icon: '📅' },
  ]

  return (
    <header className="sticky top-0 z-40 h-14 md:h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center justify-between px-3 md:px-6">
        {/* Left side - Menu button on mobile */}
        <div className="flex items-center gap-3">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-pitch-500 to-leather-500">
              <Flame className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-sm">Phoenix</span>
          </div>

          {/* Desktop search */}
          <div className="hidden md:flex items-center gap-4 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search players, matches..."
                className="h-9 w-full rounded-lg border bg-muted/50 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
                ⌘K
              </kbd>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 md:gap-2">
          {/* Mobile search toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden h-9 w-9"
            onClick={() => setShowSearch(!showSearch)}
          >
            <Search className="h-5 w-5" />
          </Button>

          {permissions.canManagePlayers && (
            <div className="relative">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1 md:gap-2 h-8 md:h-9 px-2 md:px-3"
                onClick={() => setShowQuickAdd(!showQuickAdd)}
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Quick Add</span>
              </Button>
              
              {showQuickAdd && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowQuickAdd(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-background border rounded-lg shadow-lg z-50 py-1">
                    {quickAddOptions.map((option) => (
                      <Link 
                        key={option.href} 
                        href={option.href}
                        onClick={() => setShowQuickAdd(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors"
                      >
                        <span>{option.icon}</span>
                        <span>{option.label}</span>
                        <ChevronRight className="h-3 w-3 ml-auto text-muted-foreground" />
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {permissions.canUseAISelector && (
            <Link href="/squad" className="hidden sm:block">
              <Button variant="ghost" size="icon" className="relative h-9 w-9">
                <MessageSquare className="h-5 w-5" />
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-pitch-500 text-[10px] font-bold text-white">
                  AI
                </span>
              </Button>
            </Link>
          )}

          <div className="relative">
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative h-9 w-9"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="h-5 w-5" />
            </Button>
            
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                <div className="absolute right-0 mt-2 w-72 md:w-80 bg-background border rounded-lg shadow-lg z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                    <button onClick={() => setShowNotifications(false)}>
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No new notifications</p>
                    <p className="text-xs mt-1">Notifications will appear here when you have upcoming matches.</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User avatar */}
          <div className="ml-1 md:ml-2 flex items-center gap-2 md:gap-3 pl-2 md:pl-4 border-l">
            <div className="text-right hidden md:block">
              <p className="text-sm font-medium flex items-center gap-1">
                {user?.username}
                {isAdmin && <Shield className="h-3 w-3 text-pitch-500" />}
              </p>
              <p className="text-xs text-muted-foreground">
                {isAdmin ? 'Admin' : 'Member'}
              </p>
            </div>
            <div className="h-8 w-8 md:h-9 md:w-9 rounded-full bg-gradient-to-br from-pitch-400 to-leather-500 flex items-center justify-center text-white font-semibold text-xs md:text-sm shadow-md shadow-pitch-500/25">
              {initials}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile search bar */}
      {showSearch && (
        <div className="md:hidden px-3 pb-3 border-b bg-background">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search players, matches..."
              className="h-9 w-full rounded-lg border bg-muted/50 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              autoFocus
            />
          </div>
        </div>
      )}
    </header>
  )
}
