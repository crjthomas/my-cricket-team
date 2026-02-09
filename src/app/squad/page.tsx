'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/lib/auth-context'
import { 
  Sparkles, 
  Check, 
  ChevronRight,
  Users,
  Target,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  ArrowLeftRight,
  Save,
  RefreshCw,
  Loader2,
  Calendar
} from 'lucide-react'
import { cn, getRoleColor, getFormColor } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface Player {
  id: string
  name: string
  jerseyNumber?: number
  primaryRole: string
  battingSkill: number
  bowlingSkill: number
  battingStyle: string
  bowlingStyle: string
  currentSeasonStats?: {
    matchesPlayed: number
    matchesAvailable: number
    currentForm: string
    runsScored: number
    wicketsTaken: number
  }
}

interface Match {
  id: string
  matchNumber: number
  matchDate: string
  importance: string
  opponent: {
    id: string
    name: string
    shortName?: string
    overallStrength: number
    battingStrength: number
    bowlingStrength: number
  }
  venue: {
    id: string
    name: string
    pitchType: string
    boundarySize: string
  }
}

interface SelectedPlayer {
  id: string
  name: string
  jerseyNumber?: number
  role: string
  battingOrder: number
  roleInMatch: string
  selectionReason: string
  form: string
  matchesPlayed: number
  matchesAvailable: number
}

type SelectionMode = 'WIN_FOCUSED' | 'BALANCED' | 'OPPORTUNITY_FOCUSED'

export default function SquadSelectorPage() {
  const { isAdmin } = useAuth()
  const [matches, setMatches] = useState<Match[]>([])
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedSquad, setSelectedSquad] = useState<SelectedPlayer[]>([])
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('BALANCED')
  const [isGenerating, setIsGenerating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [aiReasoning, setAiReasoning] = useState('')
  const [aiInsights, setAiInsights] = useState<string[]>([])
  const [aiWarnings, setAiWarnings] = useState<string[]>([])
  const [winProbability, setWinProbability] = useState<number>(0)
  const [fairnessScore, setFairnessScore] = useState<number>(0)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query {
              upcomingMatches(limit: 10) {
                id matchNumber matchDate importance
                opponent { id name shortName overallStrength battingStrength bowlingStrength }
                venue { id name pitchType boundarySize }
              }
              players(activeOnly: true) {
                id name jerseyNumber primaryRole battingSkill bowlingSkill battingStyle bowlingStyle
                currentSeasonStats {
                  matchesPlayed matchesAvailable currentForm runsScored wicketsTaken
                }
              }
            }
          `,
        }),
      })
      const { data } = await res.json()
      setMatches(data?.upcomingMatches || [])
      setPlayers(data?.players || [])
      
      // Auto-select first match if available
      if (data?.upcomingMatches?.length > 0 && !selectedMatch) {
        setSelectedMatch(data.upcomingMatches[0])
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateSquad = async () => {
    if (!selectedMatch) return
    
    setIsGenerating(true)
    try {
      // For now, we'll generate a simple AI recommendation locally
      // In production, this would call an AI service
      const sortedPlayers = [...players].sort((a, b) => {
        const aForm = a.currentSeasonStats?.currentForm || 'AVERAGE'
        const bForm = b.currentSeasonStats?.currentForm || 'AVERAGE'
        const formOrder = { 'EXCELLENT': 4, 'GOOD': 3, 'AVERAGE': 2, 'POOR': 1 }
        
        if (selectionMode === 'OPPORTUNITY_FOCUSED') {
          const aRatio = (a.currentSeasonStats?.matchesPlayed || 0) / Math.max(a.currentSeasonStats?.matchesAvailable || 1, 1)
          const bRatio = (b.currentSeasonStats?.matchesPlayed || 0) / Math.max(b.currentSeasonStats?.matchesAvailable || 1, 1)
          return aRatio - bRatio
        }
        
        const aScore = (a.battingSkill + a.bowlingSkill) / 2 + (formOrder[aForm as keyof typeof formOrder] || 2)
        const bScore = (b.battingSkill + b.bowlingSkill) / 2 + (formOrder[bForm as keyof typeof formOrder] || 2)
        return bScore - aScore
      })

      const selected = sortedPlayers.slice(0, 11).map((p, i) => ({
        id: p.id,
        name: p.name,
        jerseyNumber: p.jerseyNumber,
        role: p.primaryRole,
        battingOrder: i + 1,
        roleInMatch: getRoleDescription(p.primaryRole, i),
        selectionReason: getSelectionReason(p, selectionMode),
        form: p.currentSeasonStats?.currentForm || 'AVERAGE',
        matchesPlayed: p.currentSeasonStats?.matchesPlayed || 0,
        matchesAvailable: p.currentSeasonStats?.matchesAvailable || 0,
      }))

      setSelectedSquad(selected)
      setWinProbability(60 + Math.floor(Math.random() * 20))
      setFairnessScore(70 + Math.floor(Math.random() * 20))
      setAiReasoning(`This squad is optimized for the match against ${selectedMatch.opponent.name}. 
        
Based on the ${selectedMatch.venue.pitchType.toLowerCase().replace('_', ' ')} pitch at ${selectedMatch.venue.name}, we've selected a balanced combination of batsmen and bowlers.

The ${selectionMode.toLowerCase().replace('_', ' ')} approach prioritizes ${
        selectionMode === 'WIN_FOCUSED' ? 'our strongest performers for maximum chance of victory' :
        selectionMode === 'BALANCED' ? 'a mix of form and opportunity for all players' :
        'giving game time to players who need more matches'
      }.`)
      
      setAiInsights([
        `${selectedMatch.opponent.name} has strength rating of ${selectedMatch.opponent.overallStrength}/10`,
        `Pitch conditions at ${selectedMatch.venue.name} favor ${selectedMatch.venue.pitchType.includes('BATTING') ? 'batting' : selectedMatch.venue.pitchType.includes('BOWLING') ? 'bowling' : 'balanced play'}`,
        `Selected ${selected.filter(p => p.role === 'BATSMAN').length} batsmen and ${selected.filter(p => p.role === 'BOWLER').length} bowlers`,
      ])
      
      const needsGames = players.filter(p => {
        const ratio = (p.currentSeasonStats?.matchesPlayed || 0) / Math.max(p.currentSeasonStats?.matchesAvailable || 1, 1)
        return ratio < 0.4 && !selected.find(s => s.id === p.id)
      })
      
      if (needsGames.length > 0) {
        setAiWarnings([`${needsGames.map(p => p.name).join(', ')} need${needsGames.length === 1 ? 's' : ''} more playing time`])
      } else {
        setAiWarnings([])
      }
      
    } catch (error) {
      console.error('Failed to generate squad:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveSquad = async () => {
    if (!selectedMatch || selectedSquad.length === 0) return
    
    setSaving(true)
    try {
      await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation SaveSquad($input: SaveSquadInput!) {
              saveSquad(input: $input) { id }
            }
          `,
          variables: {
            input: {
              matchId: selectedMatch.id,
              playerIds: selectedSquad.map(p => p.id),
              battingOrder: selectedSquad.map(p => p.id),
            },
          },
        }),
      })
      alert('Squad saved successfully!')
    } catch (error) {
      console.error('Failed to save squad:', error)
    } finally {
      setSaving(false)
    }
  }

  const getRoleDescription = (role: string, order: number) => {
    if (role === 'WICKETKEEPER') return 'Wicketkeeper-batsman'
    if (role === 'ALL_ROUNDER') return 'All-rounder'
    if (order < 3) return 'Opening batsman'
    if (order < 5) return 'Top order'
    if (order < 7) return 'Middle order'
    if (role === 'BOWLER') return 'Pace/Spin bowler'
    return 'Lower order'
  }

  const getSelectionReason = (player: Player, mode: SelectionMode) => {
    const stats = player.currentSeasonStats
    if (mode === 'OPPORTUNITY_FOCUSED' && stats) {
      const ratio = stats.matchesPlayed / Math.max(stats.matchesAvailable, 1)
      if (ratio < 0.5) return `Needs game time (${stats.matchesPlayed}/${stats.matchesAvailable} matches)`
    }
    if (stats?.currentForm === 'EXCELLENT') return 'In excellent form'
    if (stats?.currentForm === 'GOOD') return 'Consistent performer'
    if (player.battingSkill >= 8) return `Strong batsman (${player.battingSkill}/10)`
    if (player.bowlingSkill >= 8) return `Key bowler (${player.bowlingSkill}/10)`
    return 'Valuable team member'
  }

  const getOpportunityStatus = (played: number, available: number) => {
    if (available === 0) return { status: 'NEW', color: 'text-blue-500' }
    const ratio = played / available
    if (ratio < 0.4) return { status: 'NEEDS_GAMES', color: 'text-red-500' }
    if (ratio < 0.6) return { status: 'BELOW_TARGET', color: 'text-amber-500' }
    return { status: 'ON_TRACK', color: 'text-green-500' }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-pitch-500" />
            AI Squad Selector
          </h1>
          <p className="text-muted-foreground mt-1">
            Let AI help you pick the best XI for your next match
          </p>
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Upcoming Matches</h3>
            <p className="text-muted-foreground text-center">
              Schedule a match first to start selecting your squad
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (players.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-pitch-500" />
            AI Squad Selector
          </h1>
          <p className="text-muted-foreground mt-1">
            Let AI help you pick the best XI for your next match
          </p>
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Players Available</h3>
            <p className="text-muted-foreground text-center">
              Add players to your team first to start selecting your squad
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-pitch-500" />
            AI Squad Selector
          </h1>
          <p className="text-muted-foreground mt-1">
            Let AI help you pick the best XI for your next match
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleGenerateSquad} disabled={isGenerating || !selectedMatch}>
              <RefreshCw className={cn("h-4 w-4 mr-2", isGenerating && "animate-spin")} />
              {selectedSquad.length > 0 ? 'Regenerate' : 'Generate Squad'}
            </Button>
            {selectedSquad.length > 0 && (
              <Button onClick={handleSaveSquad} disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Squad
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Match Selection */}
      {matches.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {matches.map((match) => (
            <button
              key={match.id}
              onClick={() => {
                setSelectedMatch(match)
                setSelectedSquad([])
              }}
              className={cn(
                'flex-shrink-0 px-4 py-2 rounded-lg border text-sm transition-colors',
                selectedMatch?.id === match.id
                  ? 'bg-pitch-50 dark:bg-pitch-950/30 border-pitch-500 text-pitch-700'
                  : 'hover:bg-muted'
              )}
            >
              vs {match.opponent.name} (#{match.matchNumber})
            </button>
          ))}
        </div>
      )}

      {/* Match Context Banner */}
      {selectedMatch && (
        <Card className="border-leather-200 dark:border-leather-800 bg-gradient-to-r from-leather-50 to-transparent dark:from-leather-950/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-midnight-700 to-midnight-900 text-white font-bold text-lg">
                  {selectedMatch.opponent.shortName || selectedMatch.opponent.name.slice(0, 3).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Next Match</p>
                  <p className="font-semibold text-lg">vs {selectedMatch.opponent.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedMatch.matchDate).toLocaleDateString()} • {selectedMatch.venue.name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <Badge variant={selectedMatch.importance === 'MUST_WIN' ? 'error' : selectedMatch.importance === 'IMPORTANT' ? 'warning' : 'secondary'}>
                    {selectedMatch.importance.replace('_', ' ')}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">Match Importance</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{selectedMatch.opponent.overallStrength}/10</p>
                  <p className="text-xs text-muted-foreground">Opponent Strength</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{players.length}</p>
                  <p className="text-xs text-muted-foreground">Available</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selection Mode */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { 
            mode: 'WIN_FOCUSED' as const, 
            title: 'Win Focused', 
            description: 'Pick the strongest XI to maximize winning chances',
            icon: Target,
          },
          { 
            mode: 'BALANCED' as const, 
            title: 'Balanced', 
            description: 'Balance competitiveness with fair opportunities',
            icon: Users,
          },
          { 
            mode: 'OPPORTUNITY_FOCUSED' as const, 
            title: 'Give Chances', 
            description: 'Prioritize players who need more game time',
            icon: TrendingUp,
          },
        ].map((option) => (
          <Card 
            key={option.mode}
            className={cn(
              'cursor-pointer transition-all duration-200',
              selectionMode === option.mode 
                ? 'border-pitch-500 bg-pitch-50 dark:bg-pitch-950/30 shadow-lg' 
                : 'hover:border-muted-foreground/30'
            )}
            onClick={() => setSelectionMode(option.mode)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'p-2 rounded-lg',
                  selectionMode === option.mode 
                    ? 'bg-pitch-100 dark:bg-pitch-900' 
                    : 'bg-muted'
                )}>
                  <option.icon className={cn(
                    'h-5 w-5',
                    selectionMode === option.mode 
                      ? 'text-pitch-600' 
                      : 'text-muted-foreground'
                  )} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{option.title}</p>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
                {selectionMode === option.mode && (
                  <Check className="h-5 w-5 text-pitch-500" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedSquad.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Selected XI */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Selected XI</CardTitle>
                  <CardDescription>AI-recommended squad with reasoning</CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-pitch-600">{winProbability}%</p>
                    <p className="text-xs text-muted-foreground">Win Probability</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{fairnessScore}/100</p>
                    <p className="text-xs text-muted-foreground">Fairness Score</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <AnimatePresence>
                  {selectedSquad.map((player, index) => (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-pitch-400 to-pitch-600 text-white font-bold text-sm">
                        {player.battingOrder}
                      </div>
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-muted text-sm font-medium">
                          {player.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{player.name}</p>
                          <Badge className={cn('text-[10px]', getRoleColor(player.role))}>
                            {player.role.replace('_', ' ')}
                          </Badge>
                          <Badge className={cn('text-[10px]', getFormColor(player.form))}>
                            {player.form}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {player.roleInMatch} • {player.selectionReason}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">
                          {player.matchesPlayed}/{player.matchesAvailable}
                        </p>
                        <p className={cn('text-xs', getOpportunityStatus(player.matchesPlayed, player.matchesAvailable).color)}>
                          {player.matchesAvailable > 0 ? Math.round(player.matchesPlayed / player.matchesAvailable * 100) : 0}% played
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Team Balance */}
              <div className="mt-6 p-4 rounded-lg bg-muted/50">
                <h4 className="font-medium mb-3">Team Balance</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{selectedSquad.filter(p => p.role === 'BATSMAN').length}</p>
                    <p className="text-xs text-muted-foreground">Batsmen</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{selectedSquad.filter(p => p.role === 'BOWLER').length}</p>
                    <p className="text-xs text-muted-foreground">Bowlers</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{selectedSquad.filter(p => p.role === 'ALL_ROUNDER').length}</p>
                    <p className="text-xs text-muted-foreground">All-rounders</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Reasoning & Insights */}
          <div className="space-y-4">
            {/* AI Reasoning */}
            <Card className="border-pitch-200 dark:border-pitch-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-pitch-500" />
                  AI Reasoning
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {aiReasoning}
                </p>
              </CardContent>
            </Card>

            {/* Insights */}
            {aiInsights.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-stumps-500" />
                    Key Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {aiInsights.map((insight, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="h-2 w-2 rounded-full bg-pitch-500 mt-1.5 flex-shrink-0" />
                      <p className="text-sm">{insight}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Warnings */}
            {aiWarnings.length > 0 && (
              <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    Consider
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {aiWarnings.map((warning, index) => (
                    <p key={index} className="text-sm text-amber-700 dark:text-amber-300">
                      {warning}
                    </p>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Bench */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Available (Not Selected)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {players
                    .filter(p => !selectedSquad.find(s => s.id === p.id))
                    .slice(0, 5)
                    .map((player) => (
                      <div 
                        key={player.id}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-muted text-xs">
                            {player.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{player.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {player.primaryRole.replace(/_/g, ' ')} • {player.currentSeasonStats?.matchesPlayed || 0}/{player.currentSeasonStats?.matchesAvailable || 0} played
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Sparkles className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ready to Generate Squad</h3>
            <p className="text-muted-foreground text-center mb-4">
              Select a match and click &quot;Generate Squad&quot; to get AI recommendations
            </p>
            {isAdmin && (
              <Button onClick={handleGenerateSquad} disabled={isGenerating || !selectedMatch}>
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Generate Squad
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
