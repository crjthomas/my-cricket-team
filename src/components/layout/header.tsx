'use client'

import { Bell, Search, Plus, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Header() {
  return (
    <header className="sticky top-0 z-40 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center justify-between px-6">
        {/* Search */}
        <div className="flex items-center gap-4 flex-1 max-w-md">
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

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Quick Add</span>
          </Button>

          <Button variant="ghost" size="icon" className="relative">
            <MessageSquare className="h-5 w-5" />
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-pitch-500 text-[10px] font-bold text-white">
              AI
            </span>
          </Button>

          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-leather-500 text-[10px] font-bold text-white">
              3
            </span>
          </Button>

          {/* User avatar */}
          <div className="ml-2 flex items-center gap-3 pl-4 border-l">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">Captain</p>
              <p className="text-xs text-muted-foreground">Raj Kumar</p>
            </div>
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-pitch-400 to-pitch-600 flex items-center justify-center text-white font-semibold text-sm shadow-md">
              RK
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

