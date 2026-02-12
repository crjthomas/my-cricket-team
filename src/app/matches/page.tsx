'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MatchForm } from '@/components/forms/match-form'
import { useAuth } from '@/lib/auth-context'
import { 
  Calendar,
  Plus,
  MapPin,
  ChevronRight,
  Trophy,
  Target,
  Users,
  Loader2,
  Edit,
  Trash2
} from 'lucide-react'
import Link from 'next/link'
import { cn, formatDate, getImportanceColor, getMatchResultColor } from '@/lib/utils'

interface Match {
  id: string
  matchNumber: number
  matchDate: string
  status: string
  importance: string
  format?: string
  overs?: number
  result?: string
  ourScore?: string
  opponentScore?: string
  marginOfVictory?: string
  manOfMatch?: string
  captainNotes?: string
  opponent: {
    id: string
    name: string
    shortName?: string
    overallStrength: number
  }
  venue: {
    id: string
    name: string
    city?: string
  }
  season: {
    id: string
    name: string
    format?: string
    overs?: number
  }
}

interface SeasonStats {
  wins: number
  losses: number
  draws: number
  remaining: number
}

type TabType = 'upcoming' | 'completed'

export default function MatchesPage() {
  const { isAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('upcoming')
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingMatch, setEditingMatch] = useState<Match | null>(null)
  const [saving, setSaving] = useState(false)
  const [stats, setStats] = useState<SeasonStats>({ wins: 0, losses: 0, draws: 0, remaining: 0 })

  useEffect(() => {
    fetchMatches()
  }, [])

  const fetchMatches = async () => {
    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query {
              matches {
                id matchNumber matchDate status importance format overs
                result ourScore opponentScore marginOfVictory manOfMatch captainNotes
                opponent { id name shortName overallStrength }
                venue { id name city }
                season { id name format overs }
              }
              activeSeason {
                wins losses draws totalMatches matchesPlayed
              }
            }
          `,
        }),
      })
      const { data } = await res.json()
      setMatches(data?.matches || [])
      if (data?.activeSeason) {
        setStats({
          wins: data.activeSeason.wins,
          losses: data.activeSeason.losses,
          draws: data.activeSeason.draws,
          remaining: data.activeSeason.totalMatches - data.activeSeason.matchesPlayed,
        })
      }
    } catch (error) {
      console.error('Failed to fetch matches:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (formData: {
    matchDate: string
    opponentId: string
    venueId: string
    seasonId: string
    importance: string
    format: string
    overs: number | null
    captainNotes: string
  }) => {
    setSaving(true)
    try {
      if (editingMatch) {
        // Update existing match
        await fetch('/api/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `
              mutation UpdateMatch(
                $id: ID!
                $matchDate: DateTime
                $importance: MatchImportance
                $format: MatchFormat
                $overs: Int
                $captainNotes: String
              ) {
                updateMatch(
                  id: $id
                  matchDate: $matchDate
                  importance: $importance
                  format: $format
                  overs: $overs
                  captainNotes: $captainNotes
                ) {
                  id
                }
              }
            `,
            variables: {
              id: editingMatch.id,
              matchDate: new Date(formData.matchDate).toISOString(),
              importance: formData.importance,
              format: formData.format || null,
              overs: formData.overs,
              captainNotes: formData.captainNotes || null,
            },
          }),
        })
      } else {
        // Create new match
        await fetch('/api/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `
              mutation CreateMatch(
                $matchDate: DateTime!
                $opponentId: String!
                $venueId: String!
                $seasonId: String!
                $importance: MatchImportance
                $format: MatchFormat
                $overs: Int
                $captainNotes: String
              ) {
                createMatch(
                  matchDate: $matchDate
                  opponentId: $opponentId
                  venueId: $venueId
                  seasonId: $seasonId
                  importance: $importance
                  format: $format
                  overs: $overs
                  captainNotes: $captainNotes
                ) {
                  id
                }
              }
            `,
            variables: {
              matchDate: new Date(formData.matchDate).toISOString(),
              opponentId: formData.opponentId,
              venueId: formData.venueId,
              seasonId: formData.seasonId,
              importance: formData.importance,
              format: formData.format || null,
              overs: formData.overs,
              captainNotes: formData.captainNotes || null,
            },
          }),
        })
      }
      setShowForm(false)
      setEditingMatch(null)
      fetchMatches()
    } catch (error) {
      console.error('Failed to save match:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this match?')) return

    try {
      await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `mutation DeleteMatch($id: ID!) { deleteMatch(id: $id) }`,
          variables: { id },
        }),
      })
      fetchMatches()
    } catch (error) {
      console.error('Failed to delete match:', error)
    }
  }

  const upcomingMatches = matches.filter(m => m.status === 'UPCOMING' || m.status === 'IN_PROGRESS')
  const completedMatches = matches.filter(m => m.status === 'COMPLETED')

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (showForm || editingMatch) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {editingMatch ? 'Edit Match' : 'Schedule Match'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {editingMatch ? `Update match vs ${editingMatch.opponent.name}` : 'Add a new match to the calendar'}
          </p>
        </div>
        <MatchForm
          match={editingMatch ? {
            id: editingMatch.id,
            matchDate: editingMatch.matchDate.split('T')[0],
            opponentId: editingMatch.opponent.id,
            venueId: editingMatch.venue.id,
            seasonId: editingMatch.season.id,
            importance: editingMatch.importance,
            format: editingMatch.format || '',
            overs: editingMatch.overs || null,
            captainNotes: editingMatch.captainNotes || '',
          } : undefined}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditingMatch(null) }}
          isLoading={saving}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Matches</h1>
          <p className="text-muted-foreground mt-1">
            Schedule and manage your team&apos;s fixtures
          </p>
        </div>
        {isAdmin && (
          <Button className="gap-2" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            Add Match
          </Button>
        )}
      </div>

      {/* Season Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-pitch-100 dark:bg-pitch-900">
              <Trophy className="h-5 w-5 text-pitch-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.wins}</p>
              <p className="text-sm text-muted-foreground">Wins</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-leather-100 dark:bg-leather-900">
              <Target className="h-5 w-5 text-leather-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.losses}</p>
              <p className="text-sm text-muted-foreground">Losses</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900">
              <Users className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.draws}</p>
              <p className="text-sm text-muted-foreground">Draws</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.remaining}</p>
              <p className="text-sm text-muted-foreground">Remaining</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'upcoming'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Upcoming ({upcomingMatches.length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'completed'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Completed ({completedMatches.length})
        </button>
      </div>

      {/* Match List */}
      <div className="space-y-4">
        {activeTab === 'upcoming' && upcomingMatches.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Upcoming Matches</h3>
              <p className="text-muted-foreground text-center mb-4">
                Schedule matches to see them here
              </p>
              {isAdmin && (
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Match
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === 'upcoming' && upcomingMatches.map((match, index) => (
          <Card 
            key={match.id} 
            glow 
            className={cn('stagger-' + ((index % 5) + 1), 'animate-slide-up')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  {/* Match Number */}
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Match</p>
                    <p className="text-2xl font-bold">#{match.matchNumber}</p>
                  </div>
                  
                  {/* Opponent */}
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-midnight-700 to-midnight-900 text-white font-bold text-lg">
                      {match.opponent.shortName || match.opponent.name.slice(0, 3).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-lg">vs {match.opponent.name}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(match.matchDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {match.venue.name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {match.format || match.season.format || 'T20'} ({match.overs || match.season.overs || 20} ov)
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Match Details */}
                  <div className="flex gap-4">
                    <Badge className={getImportanceColor(match.importance)}>
                      {match.importance.replace('_', ' ')}
                    </Badge>
                  </div>

                  {/* Opponent Strength */}
                  <div className="text-center">
                    <p className="text-2xl font-bold">{match.opponent.overallStrength}/10</p>
                    <p className="text-xs text-muted-foreground">Strength</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link href={`/squad`}>
                      <Button variant="outline" size="sm">
                        Select Squad
                      </Button>
                    </Link>
                    {isAdmin && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingMatch(match)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(match.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {match.captainNotes && (
                <div className="mt-4 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                  <span className="font-medium">Captain&apos;s Note:</span> {match.captainNotes}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {activeTab === 'completed' && completedMatches.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Trophy className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Completed Matches</h3>
              <p className="text-muted-foreground text-center">
                Match results will appear here once games are played
              </p>
            </CardContent>
          </Card>
        )}

        {activeTab === 'completed' && completedMatches.map((match, index) => (
          <Card 
            key={match.id}
            className={cn('stagger-' + ((index % 5) + 1), 'animate-slide-up')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  {/* Match Number & Result */}
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Match</p>
                    <p className="text-2xl font-bold">#{match.matchNumber}</p>
                    {match.result && (
                      <Badge className={cn('mt-1', getMatchResultColor(match.result))}>
                        {match.result}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Opponent & Scores */}
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-midnight-700 to-midnight-900 text-white font-bold text-lg">
                      {match.opponent.shortName || match.opponent.name.slice(0, 3).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-lg">vs {match.opponent.name}</p>
                      {match.ourScore && (
                        <div className="flex items-center gap-3 text-sm">
                          <span className="font-medium">{match.ourScore}</span>
                          <span className="text-muted-foreground">vs</span>
                          <span className="text-muted-foreground">{match.opponentScore}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(match.matchDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {match.venue.name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {match.format || match.season.format || 'T20'} ({match.overs || match.season.overs || 20} ov)
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Margin */}
                  {match.marginOfVictory && (
                    <div className="text-center">
                      <p className="font-semibold">
                        {match.result === 'WON' ? 'Won by' : 'Lost by'}
                      </p>
                      <p className="text-sm text-muted-foreground">{match.marginOfVictory}</p>
                    </div>
                  )}

                  {/* Man of Match */}
                  {match.manOfMatch && (
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Man of Match</p>
                      <p className="font-medium">{match.manOfMatch}</p>
                    </div>
                  )}

                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingMatch(match)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(match.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
