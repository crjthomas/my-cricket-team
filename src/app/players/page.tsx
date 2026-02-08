'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Plus, 
  Search, 
  Filter,
  ArrowUpDown,
  MoreVertical,
  Star,
  TrendingUp,
  Users
} from 'lucide-react'
import Link from 'next/link'
import { cn, getRoleColor, getFormColor } from '@/lib/utils'

// Mock data - would come from GraphQL in production
const players = [
  {
    id: '1',
    name: 'Raj Kumar',
    jerseyNumber: 7,
    primaryRole: 'BATSMAN',
    battingStyle: 'RIGHT_HAND',
    bowlingStyle: 'MEDIUM',
    battingPosition: 'TOP_ORDER',
    battingSkill: 9,
    bowlingSkill: 4,
    fieldingSkill: 8,
    captainChoice: 1,
    isCaptain: true,
    currentForm: 'EXCELLENT',
    matchesPlayed: 6,
    matchesAvailable: 6,
    runsScored: 285,
    wicketsTaken: 0,
    catches: 4,
  },
  {
    id: '2',
    name: 'Amit Singh',
    jerseyNumber: 11,
    primaryRole: 'ALL_ROUNDER',
    battingStyle: 'LEFT_HAND',
    bowlingStyle: 'SPIN_OFF',
    battingPosition: 'MIDDLE_ORDER',
    battingSkill: 7,
    bowlingSkill: 8,
    fieldingSkill: 7,
    captainChoice: 1,
    isCaptain: false,
    currentForm: 'GOOD',
    matchesPlayed: 5,
    matchesAvailable: 6,
    runsScored: 145,
    wicketsTaken: 8,
    catches: 3,
  },
  {
    id: '3',
    name: 'Vikram Patel',
    jerseyNumber: 45,
    primaryRole: 'BOWLER',
    battingStyle: 'RIGHT_HAND',
    bowlingStyle: 'FAST',
    battingPosition: 'LOWER_ORDER',
    battingSkill: 3,
    bowlingSkill: 9,
    fieldingSkill: 6,
    captainChoice: 1,
    isCaptain: false,
    currentForm: 'EXCELLENT',
    matchesPlayed: 6,
    matchesAvailable: 6,
    runsScored: 15,
    wicketsTaken: 12,
    catches: 2,
  },
  {
    id: '4',
    name: 'Suresh Menon',
    jerseyNumber: 1,
    primaryRole: 'WICKETKEEPER',
    battingStyle: 'RIGHT_HAND',
    bowlingStyle: 'NONE',
    battingPosition: 'MIDDLE_ORDER',
    battingSkill: 7,
    bowlingSkill: 1,
    fieldingSkill: 9,
    captainChoice: 1,
    isCaptain: false,
    isWicketkeeper: true,
    currentForm: 'GOOD',
    matchesPlayed: 6,
    matchesAvailable: 6,
    runsScored: 168,
    wicketsTaken: 0,
    catches: 8,
  },
  {
    id: '5',
    name: 'Karthik Nair',
    jerseyNumber: 23,
    primaryRole: 'BATSMAN',
    battingStyle: 'RIGHT_HAND',
    bowlingStyle: 'MEDIUM',
    battingPosition: 'OPENER',
    battingSkill: 8,
    bowlingSkill: 3,
    fieldingSkill: 7,
    captainChoice: 2,
    isCaptain: false,
    currentForm: 'AVERAGE',
    matchesPlayed: 2,
    matchesAvailable: 6,
    runsScored: 35,
    wicketsTaken: 0,
    catches: 1,
  },
  {
    id: '6',
    name: 'Pradeep Iyer',
    jerseyNumber: 18,
    primaryRole: 'BATSMAN',
    battingStyle: 'LEFT_HAND',
    bowlingStyle: 'SPIN_LEG',
    battingPosition: 'OPENER',
    battingSkill: 8,
    bowlingSkill: 4,
    fieldingSkill: 6,
    captainChoice: 1,
    isCaptain: false,
    currentForm: 'EXCELLENT',
    matchesPlayed: 5,
    matchesAvailable: 6,
    runsScored: 198,
    wicketsTaken: 1,
    catches: 2,
  },
]

const roleFilters = ['ALL', 'BATSMAN', 'BOWLER', 'ALL_ROUNDER', 'WICKETKEEPER']

export default function PlayersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState<'name' | 'runs' | 'wickets' | 'form'>('name')

  const filteredPlayers = players
    .filter(player => {
      const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesRole = roleFilter === 'ALL' || player.primaryRole === roleFilter
      return matchesSearch && matchesRole
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'runs':
          return b.runsScored - a.runsScored
        case 'wickets':
          return b.wicketsTaken - a.wicketsTaken
        case 'form':
          const formOrder = { EXCELLENT: 0, GOOD: 1, AVERAGE: 2, POOR: 3 }
          return formOrder[a.currentForm as keyof typeof formOrder] - formOrder[b.currentForm as keyof typeof formOrder]
        default:
          return a.name.localeCompare(b.name)
      }
    })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Players</h1>
          <p className="text-muted-foreground mt-1">
            Manage your team roster and player profiles
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Player
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-pitch-100 dark:bg-pitch-900">
              <Users className="h-5 w-5 text-pitch-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{players.length}</p>
              <p className="text-sm text-muted-foreground">Total Players</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {players.filter(p => p.currentForm === 'EXCELLENT').length}
              </p>
              <p className="text-sm text-muted-foreground">In Excellent Form</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-stumps-100 dark:bg-stumps-900">
              <Star className="h-5 w-5 text-stumps-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {players.filter(p => p.captainChoice === 1).length}
              </p>
              <p className="text-sm text-muted-foreground">First Choice</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-leather-100 dark:bg-leather-900">
              <Users className="h-5 w-5 text-leather-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {players.filter(p => p.matchesPlayed / p.matchesAvailable < 0.5).length}
              </p>
              <p className="text-sm text-muted-foreground">Need More Games</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-lg border bg-background pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex gap-2">
              {roleFilters.map((role) => (
                <Button
                  key={role}
                  variant={roleFilter === role ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRoleFilter(role)}
                >
                  {role === 'ALL' ? 'All' : role.replace('_', ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase())}
                </Button>
              ))}
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowUpDown className="h-4 w-4" />
              Sort
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Players Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPlayers.map((player, index) => (
          <Link href={`/players/${player.id}`} key={player.id}>
            <Card 
              glow 
              className={cn(
                'cursor-pointer hover:shadow-lg transition-all duration-200',
                `stagger-${(index % 5) + 1} animate-slide-up`
              )}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-gradient-to-br from-pitch-400 to-pitch-600 text-white font-semibold">
                        {player.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{player.name}</h3>
                        {player.isCaptain && (
                          <Badge variant="warning" className="text-[10px] px-1.5 py-0">C</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        #{player.jerseyNumber} • {player.battingStyle.replace('_', '-')}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge className={getRoleColor(player.primaryRole)}>
                    {player.primaryRole.replace('_', ' ')}
                  </Badge>
                  <Badge className={getFormColor(player.currentForm)}>
                    {player.currentForm}
                  </Badge>
                  {player.captainChoice === 1 && (
                    <Badge variant="outline" className="gap-1">
                      <Star className="h-3 w-3" /> 1st Choice
                    </Badge>
                  )}
                </div>

                {/* Skills */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span>Batting</span>
                    <span className="font-medium">{player.battingSkill}/10</span>
                  </div>
                  <Progress value={player.battingSkill * 10} className="h-1.5" />
                  
                  <div className="flex items-center justify-between text-xs">
                    <span>Bowling</span>
                    <span className="font-medium">{player.bowlingSkill}/10</span>
                  </div>
                  <Progress 
                    value={player.bowlingSkill * 10} 
                    className="h-1.5" 
                    indicatorClassName="bg-leather-500"
                  />
                </div>

                {/* Season Stats */}
                <div className="grid grid-cols-3 gap-2 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-lg font-bold">{player.runsScored}</p>
                    <p className="text-xs text-muted-foreground">Runs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold">{player.wicketsTaken}</p>
                    <p className="text-xs text-muted-foreground">Wickets</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold">{player.matchesPlayed}/{player.matchesAvailable}</p>
                    <p className="text-xs text-muted-foreground">Played</p>
                  </div>
                </div>

                {/* Opportunity Indicator */}
                {player.matchesPlayed / player.matchesAvailable < 0.5 && (
                  <div className="mt-4 p-2 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
                    <p className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1">
                      ⚠️ Only played {Math.round(player.matchesPlayed / player.matchesAvailable * 100)}% of available matches
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

