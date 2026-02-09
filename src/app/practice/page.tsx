'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Users, 
  Shuffle, 
  ArrowLeftRight, 
  Check, 
  Loader2,
  Swords,
  Target,
  Zap,
  Shield
} from 'lucide-react'
import { cn, getRoleColor } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'

interface Player {
  id: string
  name: string
  primaryRole: string
  battingSkill: number
  bowlingSkill: number
  fieldingSkill: number
  experienceLevel: number
  isWicketkeeper: boolean
  isCaptain: boolean
  isViceCaptain: boolean
}

interface TeamPlayer extends Player {
  overallRating: number
}

export default function PracticeMatchPage() {
  const router = useRouter()
  const { isAdmin } = useAuth()
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set())
  const [teamA, setTeamA] = useState<TeamPlayer[]>([])
  const [teamB, setTeamB] = useState<TeamPlayer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSplitting, setIsSplitting] = useState(false)
  const [hasSplit, setHasSplit] = useState(false)

  useEffect(() => {
    if (!isAdmin) {
      router.push('/')
      return
    }
    fetchPlayers()
  }, [isAdmin, router])

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
                primaryRole
                battingSkill
                bowlingSkill
                fieldingSkill
                experienceLevel
                isWicketkeeper
                isCaptain
                isViceCaptain
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

  const calculateOverallRating = (player: Player): number => {
    // Weight skills based on role
    let rating = 0
    switch (player.primaryRole) {
      case 'BATSMAN':
        rating = player.battingSkill * 0.5 + player.bowlingSkill * 0.15 + player.fieldingSkill * 0.2 + player.experienceLevel * 0.15
        break
      case 'BOWLER':
        rating = player.battingSkill * 0.15 + player.bowlingSkill * 0.5 + player.fieldingSkill * 0.2 + player.experienceLevel * 0.15
        break
      case 'ALL_ROUNDER':
        rating = player.battingSkill * 0.35 + player.bowlingSkill * 0.35 + player.fieldingSkill * 0.15 + player.experienceLevel * 0.15
        break
      case 'BATTING_ALL_ROUNDER':
        rating = player.battingSkill * 0.45 + player.bowlingSkill * 0.25 + player.fieldingSkill * 0.15 + player.experienceLevel * 0.15
        break
      case 'BOWLING_ALL_ROUNDER':
        rating = player.battingSkill * 0.25 + player.bowlingSkill * 0.45 + player.fieldingSkill * 0.15 + player.experienceLevel * 0.15
        break
      case 'WICKETKEEPER':
        rating = player.battingSkill * 0.4 + player.bowlingSkill * 0.1 + player.fieldingSkill * 0.35 + player.experienceLevel * 0.15
        break
      default:
        rating = (player.battingSkill + player.bowlingSkill + player.fieldingSkill + player.experienceLevel) / 4
    }
    return Math.round(rating * 10) / 10
  }

  const togglePlayer = (playerId: string) => {
    const newSelected = new Set(selectedPlayers)
    if (newSelected.has(playerId)) {
      newSelected.delete(playerId)
    } else {
      newSelected.add(playerId)
    }
    setSelectedPlayers(newSelected)
    setHasSplit(false)
    setTeamA([])
    setTeamB([])
  }

  const selectAll = () => {
    setSelectedPlayers(new Set(players.map(p => p.id)))
    setHasSplit(false)
    setTeamA([])
    setTeamB([])
  }

  const clearAll = () => {
    setSelectedPlayers(new Set())
    setHasSplit(false)
    setTeamA([])
    setTeamB([])
  }

  const splitTeams = () => {
    setIsSplitting(true)
    
    // Get selected players with ratings
    const selectedWithRatings: TeamPlayer[] = players
      .filter(p => selectedPlayers.has(p.id))
      .map(p => ({ ...p, overallRating: calculateOverallRating(p) }))

    // Categorize players by role
    const batsmen = selectedWithRatings.filter(p => p.primaryRole === 'BATSMAN')
    const bowlers = selectedWithRatings.filter(p => p.primaryRole === 'BOWLER')
    const allRounders = selectedWithRatings.filter(p => 
      p.primaryRole === 'ALL_ROUNDER' || 
      p.primaryRole === 'BATTING_ALL_ROUNDER' || 
      p.primaryRole === 'BOWLING_ALL_ROUNDER'
    )
    const wicketkeepers = selectedWithRatings.filter(p => p.primaryRole === 'WICKETKEEPER' || p.isWicketkeeper)
    
    // Remove wicketkeepers from batsmen if they're duplicated
    const pureRolePlayers = {
      batsmen: batsmen.filter(p => !p.isWicketkeeper),
      bowlers: bowlers.sort((a, b) => b.overallRating - a.overallRating),
      allRounders: allRounders.sort((a, b) => b.overallRating - a.overallRating),
      wicketkeepers: wicketkeepers.sort((a, b) => b.overallRating - a.overallRating),
    }
    
    // Sort batsmen by rating
    pureRolePlayers.batsmen.sort((a, b) => b.overallRating - a.overallRating)

    const newTeamA: TeamPlayer[] = []
    const newTeamB: TeamPlayer[] = []
    
    // Helper to add player to team with fewer of that role, or fewer total
    const distributeEvenly = (playerList: TeamPlayer[], countA: () => number, countB: () => number) => {
      playerList.forEach((player, index) => {
        const aCount = countA()
        const bCount = countB()
        
        // Alternate based on current counts for balance
        if (aCount <= bCount) {
          newTeamA.push(player)
        } else {
          newTeamB.push(player)
        }
      })
    }
    
    // 1. Distribute wicketkeepers evenly
    pureRolePlayers.wicketkeepers.forEach((wk, index) => {
      if (index % 2 === 0) newTeamA.push(wk)
      else newTeamB.push(wk)
    })
    
    // 2. Distribute bowlers evenly (snake draft for rating balance)
    pureRolePlayers.bowlers.forEach((player, index) => {
      const round = Math.floor(index / 2)
      if (round % 2 === 0) {
        if (index % 2 === 0) newTeamA.push(player)
        else newTeamB.push(player)
      } else {
        if (index % 2 === 0) newTeamB.push(player)
        else newTeamA.push(player)
      }
    })
    
    // 3. Distribute all-rounders evenly (snake draft)
    pureRolePlayers.allRounders.forEach((player, index) => {
      const round = Math.floor(index / 2)
      if (round % 2 === 0) {
        if (index % 2 === 0) newTeamA.push(player)
        else newTeamB.push(player)
      } else {
        if (index % 2 === 0) newTeamB.push(player)
        else newTeamA.push(player)
      }
    })
    
    // 4. Distribute batsmen evenly (snake draft)
    pureRolePlayers.batsmen.forEach((player, index) => {
      const round = Math.floor(index / 2)
      if (round % 2 === 0) {
        if (index % 2 === 0) newTeamA.push(player)
        else newTeamB.push(player)
      } else {
        if (index % 2 === 0) newTeamB.push(player)
        else newTeamA.push(player)
      }
    })
    
    // 5. Balance team sizes if needed
    while (Math.abs(newTeamA.length - newTeamB.length) > 1) {
      if (newTeamA.length > newTeamB.length) {
        const moved = newTeamA.pop()
        if (moved) newTeamB.push(moved)
      } else {
        const moved = newTeamB.pop()
        if (moved) newTeamA.push(moved)
      }
    }
    
    setTimeout(() => {
      setTeamA(newTeamA)
      setTeamB(newTeamB)
      setHasSplit(true)
      setIsSplitting(false)
    }, 500)
  }

  const swapPlayer = (player: TeamPlayer, fromTeam: 'A' | 'B') => {
    if (fromTeam === 'A') {
      setTeamA(prev => prev.filter(p => p.id !== player.id))
      setTeamB(prev => [...prev, player])
    } else {
      setTeamB(prev => prev.filter(p => p.id !== player.id))
      setTeamA(prev => [...prev, player])
    }
  }

  const getTeamStats = (team: TeamPlayer[]) => {
    if (team.length === 0) return { 
      avg: 0, batting: 0, bowling: 0, fielding: 0,
      batsmen: 0, bowlers: 0, allRounders: 0, wicketkeepers: 0
    }
    const batting = team.reduce((sum, p) => sum + p.battingSkill, 0) / team.length
    const bowling = team.reduce((sum, p) => sum + p.bowlingSkill, 0) / team.length
    const fielding = team.reduce((sum, p) => sum + p.fieldingSkill, 0) / team.length
    const avg = team.reduce((sum, p) => sum + p.overallRating, 0) / team.length
    
    // Count by role
    const batsmen = team.filter(p => p.primaryRole === 'BATSMAN').length
    const bowlers = team.filter(p => p.primaryRole === 'BOWLER').length
    const allRounders = team.filter(p => 
      p.primaryRole === 'ALL_ROUNDER' || 
      p.primaryRole === 'BATTING_ALL_ROUNDER' || 
      p.primaryRole === 'BOWLING_ALL_ROUNDER'
    ).length
    const wicketkeepers = team.filter(p => p.primaryRole === 'WICKETKEEPER' || p.isWicketkeeper).length
    
    return { 
      avg: Math.round(avg * 10) / 10, 
      batting: Math.round(batting * 10) / 10, 
      bowling: Math.round(bowling * 10) / 10, 
      fielding: Math.round(fielding * 10) / 10,
      batsmen, bowlers, allRounders, wicketkeepers
    }
  }

  if (!isAdmin) {
    return null
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const teamAStats = getTeamStats(teamA)
  const teamBStats = getTeamStats(teamB)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Swords className="h-7 w-7 text-pitch-500" />
          Practice Match Splitter
        </h1>
        <p className="text-muted-foreground mt-1">
          Split available players into two balanced squads for practice games
        </p>
      </div>

      {/* Player Selection */}
      {!hasSplit && (
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Select Players ({selectedPlayers.size} selected)
                </CardTitle>
                <CardDescription>Choose players available for the practice match</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={clearAll}>
                  Clear
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {players.map(player => {
                const isSelected = selectedPlayers.has(player.id)
                const rating = calculateOverallRating(player)
                return (
                  <div
                    key={player.id}
                    onClick={() => togglePlayer(player.id)}
                    className={cn(
                      "p-3 rounded-lg border-2 cursor-pointer transition-all",
                      isSelected 
                        ? "border-pitch-500 bg-pitch-50 dark:bg-pitch-900/20" 
                        : "border-transparent bg-muted/50 hover:bg-muted"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className={cn(
                            "text-white text-xs font-semibold",
                            isSelected ? "bg-pitch-500" : "bg-muted-foreground"
                          )}>
                            {player.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        {isSelected && (
                          <div className="absolute -top-1 -right-1 h-5 w-5 bg-pitch-500 rounded-full flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{player.name}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs px-1.5">
                            {player.primaryRole.replace(/_/g, ' ')}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{rating}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {selectedPlayers.size >= 2 && (
              <div className="mt-6 flex justify-center">
                <Button 
                  size="lg" 
                  onClick={splitTeams}
                  disabled={isSplitting}
                  className="gap-2"
                >
                  {isSplitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Shuffle className="h-5 w-5" />
                  )}
                  Split into Two Teams
                </Button>
              </div>
            )}

            {selectedPlayers.size < 2 && (
              <p className="mt-4 text-center text-muted-foreground">
                Select at least 2 players to split into teams
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Team Display */}
      {hasSplit && (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-lg px-3 py-1">
                {teamA.length + teamB.length} players split
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={splitTeams} className="gap-2">
                <Shuffle className="h-4 w-4" />
                Reshuffle
              </Button>
              <Button variant="outline" onClick={() => setHasSplit(false)}>
                Edit Selection
              </Button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Team A */}
            <Card className="border-2 border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-blue-600">
                    <Shield className="h-5 w-5" />
                    Team A ({teamA.length} players)
                  </CardTitle>
                  <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    Avg: {teamAStats.avg}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">
                  <span>Bat: {teamAStats.batting}</span>
                  <span>Bowl: {teamAStats.bowling}</span>
                  <span>Field: {teamAStats.fielding}</span>
                  <span className="text-blue-600 font-medium">
                    {teamAStats.batsmen}B / {teamAStats.bowlers}Bw / {teamAStats.allRounders}AR / {teamAStats.wicketkeepers}WK
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {teamA.map((player, index) => (
                  <div 
                    key={player.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-blue-600 w-6">{index + 1}</span>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-blue-500 text-white text-xs">
                          {player.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{player.name}</p>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs px-1">
                            {player.primaryRole.replace(/_/g, ' ')}
                          </Badge>
                          {player.isWicketkeeper && (
                            <Badge variant="secondary" className="text-xs px-1">WK</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{player.overallRating}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => swapPlayer(player, 'A')}
                      >
                        <ArrowLeftRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Team B */}
            <Card className="border-2 border-green-200 dark:border-green-800">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <Target className="h-5 w-5" />
                    Team B ({teamB.length} players)
                  </CardTitle>
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                    Avg: {teamBStats.avg}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">
                  <span>Bat: {teamBStats.batting}</span>
                  <span>Bowl: {teamBStats.bowling}</span>
                  <span>Field: {teamBStats.fielding}</span>
                  <span className="text-green-600 font-medium">
                    {teamBStats.batsmen}B / {teamBStats.bowlers}Bw / {teamBStats.allRounders}AR / {teamBStats.wicketkeepers}WK
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {teamB.map((player, index) => (
                  <div 
                    key={player.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-green-50 dark:bg-green-900/20"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-green-600 w-6">{index + 1}</span>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-green-500 text-white text-xs">
                          {player.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{player.name}</p>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs px-1">
                            {player.primaryRole.replace(/_/g, ' ')}
                          </Badge>
                          {player.isWicketkeeper && (
                            <Badge variant="secondary" className="text-xs px-1">WK</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{player.overallRating}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => swapPlayer(player, 'B')}
                      >
                        <ArrowLeftRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Balance Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Team Balance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Skill Ratings */}
              <div>
                <h4 className="text-sm font-medium mb-3">Skill Ratings</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Overall</p>
                    <div className="flex justify-center gap-3">
                      <p className="text-lg font-bold text-blue-600">{teamAStats.avg}</p>
                      <p className="text-lg font-bold text-green-600">{teamBStats.avg}</p>
                    </div>
                    <p className="text-xs mt-1 text-muted-foreground">
                      Diff: {Math.abs(teamAStats.avg - teamBStats.avg).toFixed(1)}
                    </p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Batting</p>
                    <div className="flex justify-center gap-3">
                      <p className="text-lg font-bold text-blue-600">{teamAStats.batting}</p>
                      <p className="text-lg font-bold text-green-600">{teamBStats.batting}</p>
                    </div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Bowling</p>
                    <div className="flex justify-center gap-3">
                      <p className="text-lg font-bold text-blue-600">{teamAStats.bowling}</p>
                      <p className="text-lg font-bold text-green-600">{teamBStats.bowling}</p>
                    </div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Fielding</p>
                    <div className="flex justify-center gap-3">
                      <p className="text-lg font-bold text-blue-600">{teamAStats.fielding}</p>
                      <p className="text-lg font-bold text-green-600">{teamBStats.fielding}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Role Distribution */}
              <div>
                <h4 className="text-sm font-medium mb-3">Squad Composition</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Batsmen</p>
                    <div className="flex justify-center gap-3">
                      <p className="text-lg font-bold text-blue-600">{teamAStats.batsmen}</p>
                      <p className="text-lg font-bold text-green-600">{teamBStats.batsmen}</p>
                    </div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Bowlers</p>
                    <div className="flex justify-center gap-3">
                      <p className="text-lg font-bold text-blue-600">{teamAStats.bowlers}</p>
                      <p className="text-lg font-bold text-green-600">{teamBStats.bowlers}</p>
                    </div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">All-Rounders</p>
                    <div className="flex justify-center gap-3">
                      <p className="text-lg font-bold text-blue-600">{teamAStats.allRounders}</p>
                      <p className="text-lg font-bold text-green-600">{teamBStats.allRounders}</p>
                    </div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">Wicketkeepers</p>
                    <div className="flex justify-center gap-3">
                      <p className="text-lg font-bold text-blue-600">{teamAStats.wicketkeepers}</p>
                      <p className="text-lg font-bold text-green-600">{teamBStats.wicketkeepers}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
