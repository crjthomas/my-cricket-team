'use client'

import { useState, useEffect } from 'react'
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
  Users,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { cn, getRoleColor, getFormColor } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'

interface Player {
  id: string
  name: string
  jerseyNumber: number | null
  primaryRole: string
  battingStyle: string
  bowlingStyle: string
  battingPosition: string
  battingSkill: number
  bowlingSkill: number
  fieldingSkill: number
  captainChoice: number
  isCaptain: boolean
  isWicketkeeper?: boolean
  currentSeasonStats?: {
    matchesPlayed: number
    matchesAvailable: number
    runsScored: number
    wicketsTaken: number
    catches: number
    currentForm: string
  } | null
}

const roleFilters = ['ALL', 'BATSMAN', 'BOWLER', 'ALL_ROUNDER', 'WICKETKEEPER']

export default function PlayersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState<'name' | 'runs' | 'wickets' | 'form'>('name')
  const [players, setPlayers] = useState<Player[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { isAdmin } = useAuth()

  useEffect(() => {
    fetchPlayers()
  }, [])

  const fetchPlayers = async () => {
    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query GetPlayers {
              players(activeOnly: true) {
                id
                name
                jerseyNumber
                primaryRole
                battingStyle
                bowlingStyle
                battingPosition
                battingSkill
                bowlingSkill
                fieldingSkill
                captainChoice
                isCaptain
                isWicketkeeper
                currentSeasonStats {
                  matchesPlayed
                  matchesAvailable
                  runsScored
                  wicketsTaken
                  catches
                  currentForm
                }
              }
            }
          `
        }),
      })

      const { data } = await response.json()
      setPlayers(data?.players || [])
    } catch (error) {
      console.error('Failed to fetch players:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStats = (player: Player) => player.currentSeasonStats || {
    matchesPlayed: 0,
    matchesAvailable: 0,
    runsScored: 0,
    wicketsTaken: 0,
    catches: 0,
    currentForm: 'AVERAGE',
  }

  const filteredPlayers = players
    .filter(player => {
      const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesRole = roleFilter === 'ALL' || player.primaryRole === roleFilter
      return matchesSearch && matchesRole
    })
    .sort((a, b) => {
      const statsA = getStats(a)
      const statsB = getStats(b)
      switch (sortBy) {
        case 'runs':
          return statsB.runsScored - statsA.runsScored
        case 'wickets':
          return statsB.wicketsTaken - statsA.wicketsTaken
        case 'form':
          const formOrder = { EXCELLENT: 0, GOOD: 1, AVERAGE: 2, POOR: 3 }
          return formOrder[statsA.currentForm as keyof typeof formOrder] - formOrder[statsB.currentForm as keyof typeof formOrder]
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
        {isAdmin && (
          <Link href="/players/add">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Player
            </Button>
          </Link>
        )}
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
                {players.filter(p => getStats(p).currentForm === 'EXCELLENT').length}
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
                {players.filter(p => {
                  const stats = getStats(p)
                  return stats.matchesAvailable > 0 && stats.matchesPlayed / stats.matchesAvailable < 0.5
                }).length}
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
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : players.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Players Yet</h3>
            <p className="text-muted-foreground mb-4">
              Get started by adding your first player to the team.
            </p>
            {isAdmin && (
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add First Player
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
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

                {(() => {
                  const stats = getStats(player)
                  return (
                    <>
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge className={getRoleColor(player.primaryRole)}>
                          {player.primaryRole.replace('_', ' ')}
                        </Badge>
                        <Badge className={getFormColor(stats.currentForm)}>
                          {stats.currentForm}
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
                          <p className="text-lg font-bold">{stats.runsScored}</p>
                          <p className="text-xs text-muted-foreground">Runs</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold">{stats.wicketsTaken}</p>
                          <p className="text-xs text-muted-foreground">Wickets</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold">{stats.matchesPlayed}/{stats.matchesAvailable}</p>
                          <p className="text-xs text-muted-foreground">Played</p>
                        </div>
                      </div>

                      {/* Opportunity Indicator */}
                      {stats.matchesAvailable > 0 && stats.matchesPlayed / stats.matchesAvailable < 0.5 && (
                        <div className="mt-4 p-2 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
                          <p className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1">
                            ⚠️ Only played {Math.round(stats.matchesPlayed / stats.matchesAvailable * 100)}% of available matches
                          </p>
                        </div>
                      )}
                    </>
                  )
                })()}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      )}
    </div>
  )
}

