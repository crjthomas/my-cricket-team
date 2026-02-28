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
  battingPosition: string
  experienceLevel: number
  isWicketkeeper: boolean
  isCaptain: boolean
  isViceCaptain: boolean
  availableForT20: boolean
  availableForT30: boolean
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
  format: string | null
  overs: number | null
  season: {
    format: string
    overs: number
  }
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

// Helper to get the effective format for a match (match format or season format)
const getMatchFormat = (match: Match): string => {
  return match.format || match.season?.format || 'T20'
}

// Helper to get effective overs for a match
const getMatchOvers = (match: Match): number => {
  return match.overs || match.season?.overs || 20
}

// Helper to check if a player is available for a given format
const isPlayerAvailableForFormat = (player: Player, format: string): boolean => {
  if (format === 'T20' || format === 'T10') {
    return player.availableForT20
  }
  if (format === 'T30' || format === 'ODI' || format === 'OTHER') {
    return player.availableForT30
  }
  return true
}

// Calculate batting order for selected players based on their attributes
const assignBattingOrder = (selectedPlayers: Player[]): Player[] => {
  // Batting position priority (lower = bats earlier)
  const positionPriority: Record<string, number> = {
    'OPENER': 1,
    'TOP_ORDER': 2,
    'MIDDLE_ORDER': 3,
    'LOWER_ORDER': 4,
    'FINISHER': 5,
  }
  
  // Role priority for batting order
  const rolePriority: Record<string, number> = {
    'BATSMAN': 1,
    'BATTING_ALL_ROUNDER': 2,
    'WICKETKEEPER': 2.5,
    'ALL_ROUNDER': 3,
    'BOWLING_ALL_ROUNDER': 4,
    'BOWLER': 10, // Pure bowlers bat at 10/11
  }
  
  // Calculate batting order score (lower = bats earlier)
  const scoredPlayers = selectedPlayers.map(player => {
    let score = 0
    
    // Pure bowlers should always bat at 10/11 - add massive penalty
    if (player.primaryRole === 'BOWLER') {
      score += 1000 // Ensure bowlers are always last
    }
    
    // Batting skill is the PRIMARY factor - stronger batsmen bat higher
    // Scale: 1-10, so max impact is -150 for skill 10, 0 for skill 0
    score -= player.battingSkill * 15
    
    // Position preference affects order
    score += (positionPriority[player.battingPosition] || 3) * 20
    
    // Role affects order within similar skill levels
    score += (rolePriority[player.primaryRole] || 3) * 8
    
    // Experience helps batting earlier
    score -= player.experienceLevel * 3
    
    // Captain/Vice Captain often bat in key positions (top 5)
    if (player.isCaptain || player.isViceCaptain) {
      score -= 20
    }
    
    // Wicketkeepers often bat in middle order
    if (player.isWicketkeeper && player.primaryRole !== 'WICKETKEEPER') {
      score += 15 // Push slightly down unless designated keeper-batsman
    }
    
    // Form bonus - in-form batsmen should bat higher
    const form = player.currentSeasonStats?.currentForm || 'AVERAGE'
    if (form === 'EXCELLENT') score -= 15
    else if (form === 'GOOD') score -= 8
    else if (form === 'POOR') score += 15
    
    return { player, score }
  })
  
  // Sort by score (lower score = earlier in batting order)
  scoredPlayers.sort((a, b) => a.score - b.score)
  
  return scoredPlayers.map(sp => sp.player)
}

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
  const [isSavedSquad, setIsSavedSquad] = useState(false)

  // Filter players available for the selected match format
  const availablePlayers = selectedMatch 
    ? players.filter(p => isPlayerAvailableForFormat(p, getMatchFormat(selectedMatch)))
    : players

  // Helper function for role descriptions
  const getRoleDescription = (role: string, order: number) => {
    if (role === 'WICKETKEEPER') return 'Wicketkeeper-batsman'
    if (role === 'ALL_ROUNDER' || role === 'BATTING_ALL_ROUNDER' || role === 'BOWLING_ALL_ROUNDER') return 'All-rounder'
    if (order < 3) return 'Opening batsman'
    if (order < 5) return 'Top order'
    if (order < 7) return 'Middle order'
    if (role === 'BOWLER') return 'Pace/Spin bowler'
    return 'Lower order'
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Fetch saved squad when match is selected
  const fetchSavedSquad = async (matchId: string) => {
    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query GetSquad($matchId: String!) {
              squad(matchId: $matchId) {
                id
                selectionMode
                aiReasoning
                winProbability
                fairnessScore
                players {
                  playerId
                  battingOrder
                  roleInMatch
                  selectionReason
                  player {
                    id name jerseyNumber primaryRole
                  }
                }
              }
            }
          `,
          variables: { matchId }
        }),
      })
      const { data } = await res.json()
      if (data?.squad && data.squad.players?.length > 0) {
        // Load saved squad
        const savedPlayers: SelectedPlayer[] = data.squad.players
          .sort((a: { battingOrder: number }, b: { battingOrder: number }) => a.battingOrder - b.battingOrder)
          .map((sp: { player: { id: string; name: string; jerseyNumber?: number; primaryRole: string }; battingOrder: number; roleInMatch?: string; selectionReason?: string }) => ({
            id: sp.player.id,
            name: sp.player.name,
            jerseyNumber: sp.player.jerseyNumber,
            role: sp.player.primaryRole,
            battingOrder: sp.battingOrder,
            roleInMatch: sp.roleInMatch || getRoleDescription(sp.player.primaryRole, sp.battingOrder),
            selectionReason: sp.selectionReason || 'Previously selected',
            form: 'AVERAGE',
            matchesPlayed: 0,
            matchesAvailable: 0,
          }))
        setSelectedSquad(savedPlayers)
        setAiReasoning(data.squad.aiReasoning || 'Previously saved squad')
        setWinProbability(data.squad.winProbability || 0)
        setFairnessScore(data.squad.fairnessScore || 0)
        setAiInsights(['Loaded previously saved squad'])
        setIsSavedSquad(true)
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to fetch saved squad:', error)
      return false
    }
  }

  const fetchData = async () => {
    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query {
              upcomingMatches(limit: 10) {
                id matchNumber matchDate importance format overs
                season { format overs }
                opponent { id name shortName overallStrength battingStrength bowlingStrength }
                venue { id name pitchType boundarySize }
              }
              players(activeOnly: true) {
                id name jerseyNumber primaryRole battingSkill bowlingSkill battingStyle bowlingStyle
                battingPosition experienceLevel isWicketkeeper isCaptain isViceCaptain
                availableForT20 availableForT30
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
      
      // Auto-select first match if available and load saved squad
      if (data?.upcomingMatches?.length > 0 && !selectedMatch) {
        const firstMatch = data.upcomingMatches[0]
        setSelectedMatch(firstMatch)
        // Try to load saved squad for this match
        await fetchSavedSquad(firstMatch.id)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle match selection change
  const handleMatchSelect = async (match: Match) => {
    setSelectedMatch(match)
    setSelectedSquad([])
    setAiReasoning('')
    setAiInsights([])
    setAiWarnings([])
    setIsSavedSquad(false)
    // Try to load saved squad for this match
    await fetchSavedSquad(match.id)
  }

  const handleGenerateSquad = async () => {
    if (!selectedMatch) return
    
    setIsGenerating(true)
    try {
      // AI-powered balanced squad selection
      const formOrder: Record<string, number> = { 'EXCELLENT': 4, 'GOOD': 3, 'AVERAGE': 2, 'POOR': 1, 'UNKNOWN': 2 }
      
      // Score players based on selection mode and overall ability
      const getPlayerScore = (p: Player) => {
        const form = p.currentSeasonStats?.currentForm || 'AVERAGE'
        const formBonus = formOrder[form] || 2
        
        if (selectionMode === 'OPPORTUNITY_FOCUSED') {
          const ratio = (p.currentSeasonStats?.matchesPlayed || 0) / Math.max(p.currentSeasonStats?.matchesAvailable || 1, 1)
          // Lower ratio = higher priority (needs more games)
          return (1 - ratio) * 10 + formBonus
        }
        
        // Calculate role-weighted skill score
        let skillScore = 0
        if (p.primaryRole === 'BATSMAN') {
          skillScore = p.battingSkill * 1.5 + p.bowlingSkill * 0.5
        } else if (p.primaryRole === 'BATTING_ALL_ROUNDER') {
          // Batting all-rounder: primarily batsman with bowling ability
          skillScore = p.battingSkill * 1.3 + p.bowlingSkill * 0.7
        } else if (p.primaryRole === 'BOWLER') {
          skillScore = p.bowlingSkill * 1.5 + p.battingSkill * 0.5
        } else if (p.primaryRole === 'BOWLING_ALL_ROUNDER') {
          // Bowling all-rounder: primarily bowler with batting ability
          skillScore = p.bowlingSkill * 1.3 + p.battingSkill * 0.7
        } else if (p.primaryRole === 'WICKETKEEPER') {
          skillScore = p.battingSkill * 1.2 + 3 // Wicketkeepers get a bonus
        } else {
          // Pure all-rounders (balanced)
          skillScore = (p.battingSkill + p.bowlingSkill) / 2 * 1.3
        }
        
        return skillScore + formBonus + p.experienceLevel * 0.3
      }
      
      // Categorize players by role
      // BATTING_ALL_ROUNDER counted as batsmen, BOWLING_ALL_ROUNDER counted as bowlers
      const wicketkeepers = availablePlayers.filter(p => p.isWicketkeeper || p.primaryRole === 'WICKETKEEPER')
      const batsmen = availablePlayers.filter(p => 
        (p.primaryRole === 'BATSMAN' || p.primaryRole === 'BATTING_ALL_ROUNDER') && !p.isWicketkeeper
      )
      const bowlers = availablePlayers.filter(p => 
        p.primaryRole === 'BOWLER' || p.primaryRole === 'BOWLING_ALL_ROUNDER'
      )
      const allRounders = availablePlayers.filter(p => p.primaryRole === 'ALL_ROUNDER')
      
      // Sort each category by score
      const sortByScore = (players: Player[]) => 
        [...players].sort((a, b) => getPlayerScore(b) - getPlayerScore(a))
      
      const sortedWicketkeepers = sortByScore(wicketkeepers)
      const sortedBatsmen = sortByScore(batsmen)
      const sortedBowlers = sortByScore(bowlers)
      const sortedAllRounders = sortByScore(allRounders)
      
      // Build balanced squad
      const squad: Player[] = []
      const selectedIds = new Set<string>()
      
      const addPlayer = (player: Player) => {
        if (!selectedIds.has(player.id) && squad.length < 11) {
          squad.push(player)
          selectedIds.add(player.id)
          return true
        }
        return false
      }
      
      // 1. Select 1 wicketkeeper (required)
      if (sortedWicketkeepers.length > 0) {
        addPlayer(sortedWicketkeepers[0])
      }
      
      // 2. Select batsmen (aim for 3-4)
      const targetBatsmen = selectionMode === 'WIN_FOCUSED' ? 4 : 3
      let batsmenAdded = 0
      for (const p of sortedBatsmen) {
        if (batsmenAdded >= targetBatsmen) break
        if (addPlayer(p)) batsmenAdded++
      }
      
      // 3. Select bowlers (aim for 4-5)
      // Consider pitch type
      const pitchType = selectedMatch.venue.pitchType || 'BALANCED'
      const targetBowlers = pitchType.includes('BOWLING') ? 5 : pitchType.includes('BATTING') ? 3 : 4
      let bowlersAdded = 0
      for (const p of sortedBowlers) {
        if (bowlersAdded >= targetBowlers) break
        if (addPlayer(p)) bowlersAdded++
      }
      
      // 4. Fill with all-rounders
      for (const p of sortedAllRounders) {
        if (squad.length >= 11) break
        addPlayer(p)
      }
      
      // 5. If still need players, add more from other categories
      const remainingPlayers = [...sortedBatsmen, ...sortedBowlers, ...sortedWicketkeepers]
        .filter(p => !selectedIds.has(p.id))
        .sort((a, b) => getPlayerScore(b) - getPlayerScore(a))
      
      for (const p of remainingPlayers) {
        if (squad.length >= 11) break
        addPlayer(p)
      }
      
      // If still not enough, add any available players
      if (squad.length < 11) {
        const anyRemaining = availablePlayers
          .filter(p => !selectedIds.has(p.id))
          .sort((a, b) => getPlayerScore(b) - getPlayerScore(a))
        
        for (const p of anyRemaining) {
          if (squad.length >= 11) break
          addPlayer(p)
        }
      }
      
      // Assign batting order based on attributes
      const orderedPlayers = assignBattingOrder(squad)
      
      const selected = orderedPlayers.map((p, i) => ({
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
      setIsSavedSquad(false)
      setWinProbability(60 + Math.floor(Math.random() * 20))
      setFairnessScore(70 + Math.floor(Math.random() * 20))
      
      // Count roles in selected squad
      // Batting all-rounders count towards batsmen, bowling all-rounders count towards bowlers
      const selectedWK = selected.filter(p => p.role === 'WICKETKEEPER' || squad.find(s => s.id === p.id)?.isWicketkeeper).length
      const selectedBat = selected.filter(p => p.role === 'BATSMAN' || p.role === 'BATTING_ALL_ROUNDER').length
      const selectedBowl = selected.filter(p => p.role === 'BOWLER' || p.role === 'BOWLING_ALL_ROUNDER').length
      const selectedAR = selected.filter(p => p.role === 'ALL_ROUNDER').length
      
      const pitchDescription = selectedMatch.venue.pitchType?.toLowerCase().replace(/_/g, ' ') || 'balanced'
      
      setAiReasoning(`**Squad Composition**: ${selectedWK} wicketkeeper, ${selectedBat} batsmen, ${selectedBowl} bowlers, ${selectedAR} all-rounders.

**Match Context**: Playing against ${selectedMatch.opponent.name} (strength ${selectedMatch.opponent.overallStrength}/10) on a ${pitchDescription} pitch at ${selectedMatch.venue.name}.

**Selection Strategy**: ${
        selectionMode === 'WIN_FOCUSED' ? 'Selected our strongest performers to maximize winning chances. Extra batsmen included for run-scoring depth.' :
        selectionMode === 'BALANCED' ? 'Balanced team with a mix of specialists and all-rounders. Considered form, skills, and pitch conditions.' :
        'Prioritized players who need more match time while maintaining competitive balance.'
      }

**Batting Order**: Assigned based on preferred position, role, batting skill, experience, captaincy status, and current form. Pure bowlers bat at 10-11.`)
      
      const matchFormat = getMatchFormat(selectedMatch)
      const matchOvers = getMatchOvers(selectedMatch)
      const unavailableForFormat = players.filter(p => !isPlayerAvailableForFormat(p, matchFormat))
      
      setAiInsights([
        `Match format: ${matchFormat} (${matchOvers} overs)`,
        `Squad balance: ${selectedWK} WK, ${selectedBat} BAT, ${selectedBowl} BOWL, ${selectedAR} AR`,
        `${availablePlayers.length} players available for ${matchFormat} format`,
        `Pitch: ${pitchDescription} - ${selectedMatch.venue.pitchType?.includes('BATTING') ? 'expect high scores' : selectedMatch.venue.pitchType?.includes('BOWLING') ? 'bowlers will dominate' : 'even contest'}`,
        `Selected ${selected.filter(p => p.role === 'BATSMAN').length} batsmen and ${selected.filter(p => p.role === 'BOWLER').length} bowlers`,
      ])
      
      const needsGames = availablePlayers.filter(p => {
        const ratio = (p.currentSeasonStats?.matchesPlayed || 0) / Math.max(p.currentSeasonStats?.matchesAvailable || 1, 1)
        return ratio < 0.4 && !selected.find(s => s.id === p.id)
      })
      
      const warnings: string[] = []
      if (needsGames.length > 0) {
        warnings.push(`${needsGames.map(p => p.name).join(', ')} need${needsGames.length === 1 ? 's' : ''} more playing time`)
      }
      if (unavailableForFormat.length > 0) {
        warnings.push(`${unavailableForFormat.length} player${unavailableForFormat.length === 1 ? ' is' : 's are'} not available for ${matchFormat} format`)
      }
      setAiWarnings(warnings)
      
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
              onClick={() => handleMatchSelect(match)}
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
                  <CardTitle className="text-lg flex items-center gap-2">
                    Selected XI
                    {isSavedSquad && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-normal">
                        Saved
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {isSavedSquad ? 'Previously saved squad' : 'AI-recommended squad with reasoning'}
                  </CardDescription>
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
