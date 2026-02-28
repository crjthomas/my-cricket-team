'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { usePermissions } from '@/lib/auth-context'
import { 
  Trophy,
  Target,
  Users,
  Award,
  BarChart3,
  Loader2,
  Download,
  FileSpreadsheet
} from 'lucide-react'
import { cn, getFormColor } from '@/lib/utils'

interface PlayerStats {
  id: string
  name: string
  jerseyNumber: number | null
  // Batting
  runsScored: number
  innings: number
  battingAverage: number
  strikeRate: number
  // Bowling
  wicketsTaken: number
  oversBowled: number
  economy: number
  bowlingAverage: number
  // Fielding
  catches: number
  stumpings: number
  runOuts: number
  // Form
  currentForm: string
  // Opportunity
  matchesPlayed: number
  matchesAvailable: number
}

interface TeamStats {
  matchesPlayed: number
  wins: number
  losses: number
  draws: number
  totalRuns: number
  totalWickets: number
}

export default function StatsPage() {
  const { canManageStats } = usePermissions()
  const [loading, setLoading] = useState(true)
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([])
  const [teamStats, setTeamStats] = useState<TeamStats>({
    matchesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    totalRuns: 0,
    totalWickets: 0
  })

  useEffect(() => {
    fetchStats()
  }, [])

  const downloadCSV = (type: 'batting' | 'bowling' | 'fielding' | 'all') => {
    let csvContent = ''
    let filename = ''

    if (type === 'batting' || type === 'all') {
      const battingData = playerStats
        .filter(p => p.runsScored > 0 || p.innings > 0)
        .sort((a, b) => b.runsScored - a.runsScored)
      
      if (type === 'all') {
        csvContent += 'BATTING STATISTICS\n'
      }
      csvContent += 'Player,Jersey,Innings,Runs,Average,Strike Rate,Form\n'
      battingData.forEach(p => {
        csvContent += `"${p.name}",${p.jerseyNumber || ''},${p.innings},${p.runsScored},${p.battingAverage.toFixed(2)},${p.strikeRate.toFixed(2)},${p.currentForm}\n`
      })
      if (type === 'batting') filename = 'batting_stats.csv'
    }

    if (type === 'bowling' || type === 'all') {
      const bowlingData = playerStats
        .filter(p => p.wicketsTaken > 0 || p.oversBowled > 0)
        .sort((a, b) => b.wicketsTaken - a.wicketsTaken)
      
      if (type === 'all') {
        csvContent += '\nBOWLING STATISTICS\n'
      }
      csvContent += 'Player,Jersey,Overs,Wickets,Economy,Average,Form\n'
      bowlingData.forEach(p => {
        csvContent += `"${p.name}",${p.jerseyNumber || ''},${p.oversBowled},${p.wicketsTaken},${p.economy.toFixed(2)},${p.bowlingAverage.toFixed(2)},${p.currentForm}\n`
      })
      if (type === 'bowling') filename = 'bowling_stats.csv'
    }

    if (type === 'fielding' || type === 'all') {
      const fieldingData = playerStats
        .filter(p => p.catches > 0 || p.stumpings > 0 || p.runOuts > 0)
        .sort((a, b) => (b.catches + b.stumpings + b.runOuts) - (a.catches + a.stumpings + a.runOuts))
      
      if (type === 'all') {
        csvContent += '\nFIELDING STATISTICS\n'
      }
      csvContent += 'Player,Jersey,Catches,Stumpings,Run Outs,Total Dismissals\n'
      fieldingData.forEach(p => {
        csvContent += `"${p.name}",${p.jerseyNumber || ''},${p.catches},${p.stumpings},${p.runOuts},${p.catches + p.stumpings + p.runOuts}\n`
      })
      if (type === 'fielding') filename = 'fielding_stats.csv'
    }

    if (type === 'all') {
      csvContent += '\nTEAM OVERVIEW\n'
      csvContent += 'Stat,Value\n'
      csvContent += `Matches Played,${teamStats.matchesPlayed}\n`
      csvContent += `Wins,${teamStats.wins}\n`
      csvContent += `Losses,${teamStats.losses}\n`
      csvContent += `Draws,${teamStats.draws}\n`
      csvContent += `Win Rate,${teamStats.matchesPlayed > 0 ? ((teamStats.wins / teamStats.matchesPlayed) * 100).toFixed(1) : 0}%\n`
      csvContent += `Total Runs,${teamStats.totalRuns}\n`
      csvContent += `Total Wickets,${teamStats.totalWickets}\n`
      filename = 'team_statistics.csv'
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
    URL.revokeObjectURL(link.href)
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query GetStats {
              players(activeOnly: true) {
                id
                name
                jerseyNumber
                currentSeasonStats {
                  matchesPlayed
                  matchesAvailable
                  currentForm
                  runsScored
                  ballsFaced
                  wicketsTaken
                  oversBowled
                  runsConceded
                  catches
                  stumpings
                  runOuts
                }
              }
              matches(status: COMPLETED) {
                id
                result
                ourScore
                opponentScore
              }
            }
          `
        })
      })

      const { data } = await response.json()
      
      if (data) {
        // Process player stats
        const stats: PlayerStats[] = (data.players || [])
          .map((player: { 
            id: string
            name: string
            jerseyNumber: number | null
            currentSeasonStats?: {
              matchesPlayed?: number
              matchesAvailable?: number
              currentForm?: string
              runsScored?: number
              ballsFaced?: number
              wicketsTaken?: number
              oversBowled?: number
              runsConceded?: number
              catches?: number
              stumpings?: number
              runOuts?: number
            }
          }) => {
            const s = player.currentSeasonStats || {}
            const innings = s.matchesPlayed || 0
            const runs = s.runsScored || 0
            const balls = s.ballsFaced || 0
            const wickets = s.wicketsTaken || 0
            const overs = s.oversBowled || 0
            const runsConceded = s.runsConceded || 0

            return {
              id: player.id,
              name: player.name,
              jerseyNumber: player.jerseyNumber,
              runsScored: runs,
              innings: innings,
              battingAverage: innings > 0 ? runs / innings : 0,
              strikeRate: balls > 0 ? (runs / balls) * 100 : 0,
              wicketsTaken: wickets,
              oversBowled: overs,
              economy: overs > 0 ? runsConceded / overs : 0,
              bowlingAverage: wickets > 0 ? runsConceded / wickets : 0,
              catches: s.catches || 0,
              stumpings: s.stumpings || 0,
              runOuts: s.runOuts || 0,
              currentForm: s.currentForm || 'UNKNOWN',
              matchesPlayed: s.matchesPlayed || 0,
              matchesAvailable: s.matchesAvailable || 0
            }
          })
          .filter((p: PlayerStats) => p.matchesPlayed > 0 || p.matchesAvailable > 0)

        setPlayerStats(stats)

        // Process team stats from completed matches
        const matches = data.matches || []
        let wins = 0, losses = 0, draws = 0, totalRuns = 0, totalWickets = 0

        matches.forEach((match: { result?: string; ourScore?: string }) => {
          if (match.result === 'WON') wins++
          else if (match.result === 'LOST') losses++
          else if (match.result === 'DRAW' || match.result === 'TIE') draws++

          // Parse scores like "165/4" to extract runs
          if (match.ourScore) {
            const [runs] = match.ourScore.split('/')
            totalRuns += parseInt(runs) || 0
          }
        })

        setTeamStats({
          matchesPlayed: matches.length,
          wins,
          losses,
          draws,
          totalRuns,
          totalWickets
        })
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get top performers
  const battingLeaders = [...playerStats]
    .filter(p => p.runsScored > 0)
    .sort((a, b) => b.runsScored - a.runsScored)
    .slice(0, 5)

  const bowlingLeaders = [...playerStats]
    .filter(p => p.wicketsTaken > 0)
    .sort((a, b) => b.wicketsTaken - a.wicketsTaken)
    .slice(0, 5)

  const fieldingLeaders = [...playerStats]
    .filter(p => (p.catches + p.stumpings + p.runOuts) > 0)
    .sort((a, b) => (b.catches + b.stumpings + b.runOuts) - (a.catches + a.stumpings + a.runOuts))
    .slice(0, 5)

  const opportunityTracker = [...playerStats]
    .filter(p => p.matchesAvailable > 0)
    .sort((a, b) => {
      const ratioA = a.matchesPlayed / a.matchesAvailable
      const ratioB = b.matchesPlayed / b.matchesAvailable
      return ratioA - ratioB // Show players needing games first
    })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const hasStats = teamStats.matchesPlayed > 0 || playerStats.length > 0

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Statistics</h1>
          <p className="text-muted-foreground mt-1">
            Season performance and player statistics
          </p>
        </div>
        
        {canManageStats && hasStats && (
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => downloadCSV('batting')}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Batting
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => downloadCSV('bowling')}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Bowling
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => downloadCSV('fielding')}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Fielding
            </Button>
            <Button 
              size="sm" 
              onClick={() => downloadCSV('all')}
              className="gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Export All
            </Button>
          </div>
        )}
      </div>

      {!hasStats ? (
        // Empty State
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BarChart3 className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Statistics Available Yet</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Statistics will appear here once matches are played and performance data is recorded.
              Start by scheduling matches and recording results.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Team Overview */}
          <div className="grid gap-4 md:grid-cols-5">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-pitch-600">{teamStats.wins}</p>
                <p className="text-sm text-muted-foreground">Wins</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-leather-600">{teamStats.losses}</p>
                <p className="text-sm text-muted-foreground">Losses</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-amber-600">{teamStats.draws}</p>
                <p className="text-sm text-muted-foreground">Draws</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold">{teamStats.totalRuns}</p>
                <p className="text-sm text-muted-foreground">Total Runs</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold">{teamStats.matchesPlayed}</p>
                <p className="text-sm text-muted-foreground">Matches</p>
              </CardContent>
            </Card>
          </div>

          {/* Leaderboards */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Batting */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-stumps-500" />
                  Batting Leaders
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {battingLeaders.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No batting data yet
                  </p>
                ) : (
                  battingLeaders.map((player, index) => (
                    <div key={player.id} className="flex items-center gap-3">
                      <div className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm',
                        index === 0 ? 'bg-stumps-500 text-white' : 'bg-muted text-muted-foreground'
                      )}>
                        {index + 1}
                      </div>
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gradient-to-br from-orange-400 to-red-500 text-white text-sm">
                          {player.jerseyNumber || player.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{player.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Avg: {player.battingAverage.toFixed(1)} • SR: {player.strikeRate.toFixed(1)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{player.runsScored}</p>
                        {player.currentForm !== 'UNKNOWN' && (
                          <Badge className={cn('text-[10px]', getFormColor(player.currentForm))}>
                            {player.currentForm}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Bowling */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-leather-500" />
                  Bowling Leaders
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {bowlingLeaders.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No bowling data yet
                  </p>
                ) : (
                  bowlingLeaders.map((player, index) => (
                    <div key={player.id} className="flex items-center gap-3">
                      <div className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm',
                        index === 0 ? 'bg-leather-500 text-white' : 'bg-muted text-muted-foreground'
                      )}>
                        {index + 1}
                      </div>
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gradient-to-br from-red-400 to-red-600 text-white text-sm">
                          {player.jerseyNumber || player.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{player.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Eco: {player.economy.toFixed(1)} • Avg: {player.bowlingAverage.toFixed(1)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{player.wicketsTaken}</p>
                        {player.currentForm !== 'UNKNOWN' && (
                          <Badge className={cn('text-[10px]', getFormColor(player.currentForm))}>
                            {player.currentForm}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Fielding */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="h-5 w-5 text-pitch-500" />
                  Fielding Leaders
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {fieldingLeaders.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No fielding data yet
                  </p>
                ) : (
                  fieldingLeaders.map((player, index) => (
                    <div key={player.id} className="flex items-center gap-3">
                      <div className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm',
                        index === 0 ? 'bg-pitch-500 text-white' : 'bg-muted text-muted-foreground'
                      )}>
                        {index + 1}
                      </div>
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gradient-to-br from-green-400 to-green-600 text-white text-sm">
                          {player.jerseyNumber || player.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{player.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Ct: {player.catches} • St: {player.stumpings} • RO: {player.runOuts}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{player.catches + player.stumpings + player.runOuts}</p>
                        <p className="text-xs text-muted-foreground">dismissals</p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Opportunity Tracker */}
          {opportunityTracker.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  Playing Opportunity Tracker
                </CardTitle>
                <CardDescription>
                  Track fair distribution of playing time across the squad
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {opportunityTracker.map((player) => {
                    const ratio = player.matchesAvailable > 0 
                      ? player.matchesPlayed / player.matchesAvailable 
                      : 0
                    const status = ratio >= 0.8 ? 'good' : ratio >= 0.6 ? 'ok' : 'needs-games'
                    
                    return (
                      <div key={player.id} className="flex items-center gap-4">
                        <div className="w-32 truncate">
                          <p className="font-medium text-sm">{player.name}</p>
                        </div>
                        <div className="flex-1">
                          <Progress 
                            value={ratio * 100} 
                            className="h-2"
                          />
                        </div>
                        <div className="w-16 text-right">
                          <p className="text-sm font-medium">{player.matchesPlayed}/{player.matchesAvailable}</p>
                        </div>
                        <div className="w-16 text-right">
                          <p className={cn(
                            'text-sm font-medium',
                            status === 'good' ? 'text-pitch-600' :
                            status === 'ok' ? 'text-amber-600' : 'text-leather-600'
                          )}>
                            {Math.round(ratio * 100)}%
                          </p>
                        </div>
                        <Badge 
                          variant="outline"
                          className={cn(
                            'w-24 justify-center',
                            status === 'good' ? 'border-pitch-500 text-pitch-600' :
                            status === 'ok' ? 'border-amber-500 text-amber-600' : 'border-leather-500 text-leather-600'
                          )}
                        >
                          {status === 'good' ? 'On Track' : status === 'ok' ? 'Below Target' : 'Needs Games'}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
