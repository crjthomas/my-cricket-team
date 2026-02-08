'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Plus, ChevronRight, Swords, Trophy, Target, Loader2, Edit, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import { OpponentForm } from '@/components/forms/opponent-form'
import Link from 'next/link'

interface Opponent {
  id: string
  name: string
  shortName: string | null
  overallStrength: number
  battingStrength: number
  bowlingStrength: number
  fieldingStrength: number
  keyPlayers: string[]
  playingStyle: string | null
  matchesPlayed: number
  matchesWon: number
  matchesLost: number
  matchesDrawn: number
  notes: string | null
}

export default function OpponentsPage() {
  const { isAdmin } = useAuth()
  const [opponents, setOpponents] = useState<Opponent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingOpponent, setEditingOpponent] = useState<Opponent | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchOpponents()
  }, [])

  const fetchOpponents = async () => {
    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query GetOpponents {
              opponents {
                id
                name
                shortName
                overallStrength
                battingStrength
                bowlingStrength
                fieldingStrength
                keyPlayers
                playingStyle
                matchesPlayed
                matchesWon
                matchesLost
                matchesDrawn
                notes
              }
            }
          `
        }),
      })

      const { data } = await response.json()
      setOpponents(data?.opponents || [])
    } catch (error) {
      console.error('Failed to fetch opponents:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (formData: {
    name: string
    shortName: string
    overallStrength: number
    battingStrength: number
    bowlingStrength: number
    fieldingStrength: number
    keyPlayers: string[]
    playingStyle: string
    notes: string
  }) => {
    setIsSaving(true)
    try {
      const mutation = editingOpponent ? `
        mutation UpdateOpponent($id: ID!, $input: UpdateOpponentInput!) {
          updateOpponent(id: $id, input: $input) { id }
        }
      ` : `
        mutation CreateOpponent($name: String!, $shortName: String, $overallStrength: Int, $battingStrength: Int, $bowlingStrength: Int, $keyPlayers: [String!], $notes: String) {
          createOpponent(name: $name, shortName: $shortName, overallStrength: $overallStrength, battingStrength: $battingStrength, bowlingStrength: $bowlingStrength, keyPlayers: $keyPlayers, notes: $notes) { id }
        }
      `

      const variables = editingOpponent ? {
        id: editingOpponent.id,
        input: formData
      } : {
        name: formData.name,
        shortName: formData.shortName || null,
        overallStrength: formData.overallStrength,
        battingStrength: formData.battingStrength,
        bowlingStrength: formData.bowlingStrength,
        keyPlayers: formData.keyPlayers,
        notes: formData.notes || null,
      }

      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: mutation, variables }),
      })

      const result = await response.json()
      if (result.errors) throw new Error(result.errors[0].message)

      setShowForm(false)
      setEditingOpponent(null)
      fetchOpponents()
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (opponent: Opponent) => {
    if (!confirm(`Are you sure you want to delete ${opponent.name}?`)) return

    try {
      await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `mutation DeleteOpponent($id: ID!) { deleteOpponent(id: $id) }`,
          variables: { id: opponent.id }
        }),
      })
      fetchOpponents()
    } catch (error) {
      alert('Failed to delete opponent')
    }
  }

  const totalWins = opponents.reduce((sum, o) => sum + o.matchesWon, 0)
  const totalLosses = opponents.reduce((sum, o) => sum + o.matchesLost, 0)
  const totalDraws = opponents.reduce((sum, o) => sum + o.matchesDrawn, 0)

  if (showForm || editingOpponent) {
    return (
      <div className="space-y-6 animate-fade-in max-w-4xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => { setShowForm(false); setEditingOpponent(null) }}>
            <X className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {editingOpponent ? 'Edit Opponent' : 'Add Opponent'}
            </h1>
            <p className="text-muted-foreground">
              {editingOpponent ? `Update ${editingOpponent.name}` : 'Add a new opponent team'}
            </p>
          </div>
        </div>
        <OpponentForm
          opponent={editingOpponent ? {
            id: editingOpponent.id,
            name: editingOpponent.name,
            shortName: editingOpponent.shortName || '',
            overallStrength: editingOpponent.overallStrength,
            battingStrength: editingOpponent.battingStrength,
            bowlingStrength: editingOpponent.bowlingStrength,
            fieldingStrength: editingOpponent.fieldingStrength,
            keyPlayers: editingOpponent.keyPlayers,
            playingStyle: editingOpponent.playingStyle || '',
            notes: editingOpponent.notes || '',
          } : undefined}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditingOpponent(null) }}
          isLoading={isSaving}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Opponents</h1>
          <p className="text-muted-foreground mt-1">
            Know your competition - opponent analysis and history
          </p>
        </div>
        {isAdmin && (
          <Button className="gap-2" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            Add Opponent
          </Button>
        )}
      </div>

      {/* Overall Record */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-muted">
              <Swords className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{opponents.length}</p>
              <p className="text-sm text-muted-foreground">Teams</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-pitch-100 dark:bg-pitch-900">
              <Trophy className="h-5 w-5 text-pitch-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalWins}</p>
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
              <p className="text-2xl font-bold">{totalLosses}</p>
              <p className="text-sm text-muted-foreground">Losses</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900">
              <Swords className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalDraws}</p>
              <p className="text-sm text-muted-foreground">Draws</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : opponents.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Swords className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Opponents Yet</h3>
            <p className="text-muted-foreground mb-4">
              Add opponent teams to track your performance against them.
            </p>
            {isAdmin && (
              <Button className="gap-2" onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4" />
                Add First Opponent
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {opponents.map((opponent, index) => (
            <Card 
              key={opponent.id} 
              glow
              className={cn('stagger-' + ((index % 5) + 1), 'animate-slide-up')}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-midnight-700 to-midnight-900 text-white font-bold text-lg">
                      {opponent.shortName || opponent.name.slice(0, 3).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{opponent.name}</h3>
                      <p className="text-sm text-muted-foreground">{opponent.playingStyle || 'No playing style defined'}</p>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setEditingOpponent(opponent)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(opponent)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Strength Ratings */}
                <div className="space-y-3 mb-4">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Overall Strength</span>
                      <span className="font-medium">{opponent.overallStrength}/10</span>
                    </div>
                    <Progress 
                      value={opponent.overallStrength * 10} 
                      className="h-2"
                      indicatorClassName={cn(
                        opponent.overallStrength >= 8 ? 'bg-leather-500' :
                        opponent.overallStrength >= 6 ? 'bg-amber-500' : 'bg-pitch-500'
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-lg font-bold">{opponent.battingStrength}</p>
                      <p className="text-xs text-muted-foreground">Batting</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-lg font-bold">{opponent.bowlingStrength}</p>
                      <p className="text-xs text-muted-foreground">Bowling</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-lg font-bold">{opponent.fieldingStrength}</p>
                      <p className="text-xs text-muted-foreground">Fielding</p>
                    </div>
                  </div>
                </div>

                {/* Key Players */}
                {opponent.keyPlayers.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">Key Players:</p>
                    <div className="flex flex-wrap gap-1">
                      {opponent.keyPlayers.map((player) => (
                        <Badge key={player} variant="outline" className="text-xs">
                          {player}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Our Record */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-lg font-bold text-pitch-600">{opponent.matchesWon}</p>
                      <p className="text-xs text-muted-foreground">Wins</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-leather-600">{opponent.matchesLost}</p>
                      <p className="text-xs text-muted-foreground">Losses</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold">{opponent.matchesPlayed}</p>
                      <p className="text-xs text-muted-foreground">Played</p>
                    </div>
                  </div>
                  <Badge 
                    variant={
                      opponent.matchesWon > opponent.matchesLost ? 'success' :
                      opponent.matchesLost > opponent.matchesWon ? 'error' : 'secondary'
                    }
                  >
                    {opponent.matchesWon > opponent.matchesLost ? 'Winning Record' :
                     opponent.matchesLost > opponent.matchesWon ? 'Losing Record' : 'Even Record'}
                  </Badge>
                </div>

                {/* Notes */}
                {opponent.notes && (
                  <div className="mt-4 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                    💡 {opponent.notes}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
