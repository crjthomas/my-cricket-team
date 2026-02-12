'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { SeasonForm } from '@/components/forms/season-form'
import { useAuth } from '@/lib/auth-context'
import { 
  Trophy, 
  Calendar,
  Target,
  TrendingUp,
  Medal,
  Users,
  Plus,
  Edit,
  Trash2,
  Loader2,
  ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Season {
  id: string
  name: string
  startDate: string
  endDate?: string
  isActive: boolean
  description?: string
  format: string
  overs: number
  totalMatches: number
  matchesPlayed: number
  wins: number
  losses: number
  draws: number
  noResults: number
  currentPosition?: number
  totalTeams?: number
}

interface Match {
  id: string
  matchDate: string
  matchNumber: number
  status: string
  importance: string
  opponent: { name: string; shortName?: string }
  venue: { name: string }
}

export default function SeasonPage() {
  const { isAdmin } = useAuth()
  const [seasons, setSeasons] = useState<Season[]>([])
  const [activeSeason, setActiveSeason] = useState<Season | null>(null)
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSeason, setEditingSeason] = useState<Season | null>(null)
  const [saving, setSaving] = useState(false)
  const [showSeasonDropdown, setShowSeasonDropdown] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch seasons
      const seasonsRes = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query {
              seasons {
                id name startDate endDate isActive description format overs
                totalMatches matchesPlayed wins losses draws noResults
                currentPosition totalTeams
              }
              activeSeason {
                id name startDate endDate isActive description format overs
                totalMatches matchesPlayed wins losses draws noResults
                currentPosition totalTeams
              }
              upcomingMatches(limit: 6) {
                id matchDate matchNumber status importance
                opponent { name shortName }
                venue { name }
              }
            }
          `,
        }),
      })
      const { data } = await seasonsRes.json()
      setSeasons(data?.seasons || [])
      setActiveSeason(data?.activeSeason || null)
      setUpcomingMatches(data?.upcomingMatches || [])
    } catch (error) {
      console.error('Failed to fetch season data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (formData: {
    name: string
    startDate: string
    endDate: string
    description: string
    format: string
    overs: number
    totalMatches: number
    totalTeams: number
    isActive: boolean
  }) => {
    setSaving(true)
    try {
      const mutation = editingSeason ? 'updateSeason' : 'createSeason'
      const variables = editingSeason ? { id: editingSeason.id, ...formData } : formData

      await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation ${mutation}(
              ${editingSeason ? '$id: ID!' : ''}
              $name: String!
              $startDate: DateTime!
              $endDate: DateTime
              $description: String
              $format: MatchFormat
              $overs: Int
              $totalMatches: Int
              $totalTeams: Int
              $isActive: Boolean
            ) {
              ${mutation}(
                ${editingSeason ? 'id: $id' : ''}
                name: $name
                startDate: $startDate
                endDate: $endDate
                description: $description
                format: $format
                overs: $overs
                totalMatches: $totalMatches
                totalTeams: $totalTeams
                isActive: $isActive
              ) {
                id name
              }
            }
          `,
          variables: {
            ...variables,
            startDate: new Date(formData.startDate).toISOString(),
            endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
          },
        }),
      })
      setShowForm(false)
      setEditingSeason(null)
      fetchData()
    } catch (error) {
      console.error('Failed to save season:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this season? This will also delete all associated matches and stats.')) {
      return
    }

    try {
      await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `mutation DeleteSeason($id: ID!) { deleteSeason(id: $id) }`,
          variables: { id },
        }),
      })
      fetchData()
    } catch (error) {
      console.error('Failed to delete season:', error)
    }
  }

  const handleSetActive = async (id: string) => {
    try {
      await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `mutation SetActiveSeason($id: ID!) { updateSeason(id: $id, isActive: true) { id } }`,
          variables: { id },
        }),
      })
      fetchData()
    } catch (error) {
      console.error('Failed to set active season:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (showForm) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {editingSeason ? 'Edit Season' : 'Create New Season'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {editingSeason ? 'Update season details' : 'Set up a new cricket season'}
          </p>
        </div>
        <SeasonForm
          season={editingSeason ? {
            id: editingSeason.id,
            name: editingSeason.name,
            startDate: editingSeason.startDate.split('T')[0],
            endDate: editingSeason.endDate?.split('T')[0] || '',
            description: editingSeason.description || '',
            format: editingSeason.format || 'T20',
            overs: editingSeason.overs || 20,
            totalMatches: editingSeason.totalMatches,
            totalTeams: editingSeason.totalTeams || 8,
            isActive: editingSeason.isActive,
          } : undefined}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false)
            setEditingSeason(null)
          }}
          isLoading={saving}
        />
      </div>
    )
  }

  if (!activeSeason && seasons.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Trophy className="h-8 w-8 text-stumps-500" />
            Season
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your cricket seasons
          </p>
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Trophy className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Seasons Yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first season to start tracking matches and stats
            </p>
            {isAdmin && (
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Season
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  const displaySeason = activeSeason || seasons[0]
  const winRate = displaySeason?.matchesPlayed > 0 
    ? (displaySeason.wins / displaySeason.matchesPlayed * 100).toFixed(0) 
    : '0'
  const progressPercentage = displaySeason?.totalMatches > 0 
    ? (displaySeason.matchesPlayed / displaySeason.totalMatches * 100) 
    : 0

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Trophy className="h-8 w-8 text-stumps-500" />
          <div className="relative">
            <button
              onClick={() => setShowSeasonDropdown(!showSeasonDropdown)}
              className="flex items-center gap-2 text-3xl font-bold tracking-tight hover:text-primary transition-colors"
            >
              {displaySeason?.name}
              {displaySeason?.format && (
                <Badge variant="outline" className="text-sm font-normal ml-2">
                  {displaySeason.format} ({displaySeason.overs} overs)
                </Badge>
              )}
              {seasons.length > 1 && <ChevronDown className="h-5 w-5" />}
            </button>
            {showSeasonDropdown && seasons.length > 1 && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowSeasonDropdown(false)} />
                <div className="absolute left-0 mt-2 w-64 bg-background border rounded-lg shadow-lg z-50 py-1">
                  {seasons.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        if (!s.isActive) handleSetActive(s.id)
                        setShowSeasonDropdown(false)
                      }}
                      className={cn(
                        'w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors flex items-center justify-between',
                        s.isActive && 'bg-muted'
                      )}
                    >
                      <span>{s.name}</span>
                      {s.isActive && <Badge variant="success" className="text-xs">Active</Badge>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingSeason(displaySeason)
                setShowForm(true)
              }}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Season
            </Button>
          </div>
        )}
      </div>

      {/* Season Progress */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Season Progress</h3>
              <p className="text-sm text-muted-foreground">
                {displaySeason?.matchesPlayed} of {displaySeason?.totalMatches} matches completed
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{progressPercentage.toFixed(0)}%</p>
              <p className="text-sm text-muted-foreground">Complete</p>
            </div>
          </div>
          <Progress value={progressPercentage} className="h-3" />
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-pitch-200 dark:border-pitch-800 bg-gradient-to-br from-pitch-50 to-transparent dark:from-pitch-950/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Wins</p>
                <p className="text-4xl font-bold text-pitch-600">{displaySeason?.wins || 0}</p>
              </div>
              <Trophy className="h-10 w-10 text-pitch-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-leather-200 dark:border-leather-800 bg-gradient-to-br from-leather-50 to-transparent dark:from-leather-950/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Losses</p>
                <p className="text-4xl font-bold text-leather-600">{displaySeason?.losses || 0}</p>
              </div>
              <Target className="h-10 w-10 text-leather-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Win Rate</p>
                <p className="text-4xl font-bold">{winRate}%</p>
              </div>
              <TrendingUp className="h-10 w-10 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-stumps-200 dark:border-stumps-800 bg-gradient-to-br from-stumps-50 to-transparent dark:from-stumps-950/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Position</p>
                <p className="text-4xl font-bold text-stumps-600">
                  {displaySeason?.currentPosition || '-'}
                  {displaySeason?.totalTeams && (
                    <span className="text-lg text-muted-foreground">/{displaySeason.totalTeams}</span>
                  )}
                </p>
              </div>
              <Medal className="h-10 w-10 text-stumps-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Fixtures */}
      {upcomingMatches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Fixtures ({upcomingMatches.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {upcomingMatches.map((match) => (
                <div 
                  key={match.id}
                  className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold">vs {match.opponent.name}</p>
                    <Badge 
                      variant={
                        match.importance === 'MUST_WIN' ? 'error' : 
                        match.importance === 'IMPORTANT' ? 'warning' : 'secondary'
                      }
                      className="text-[10px]"
                    >
                      {match.importance.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(match.matchDate).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                    <p className="flex items-center gap-1">
                      <Target className="h-3 w-3" /> {match.venue.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Seasons List */}
      {seasons.length > 1 && isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              All Seasons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {seasons.map((s) => (
                <div 
                  key={s.id}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-lg border',
                    s.isActive && 'bg-pitch-50 dark:bg-pitch-950/30 border-pitch-200 dark:border-pitch-800'
                  )}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{s.name}</p>
                      {s.isActive && <Badge variant="success">Active</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {s.matchesPlayed}/{s.totalMatches} matches • {s.wins}W-{s.losses}L-{s.draws}D
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!s.isActive && (
                      <Button variant="outline" size="sm" onClick={() => handleSetActive(s.id)}>
                        Set Active
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingSeason(s)
                        setShowForm(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(s.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
