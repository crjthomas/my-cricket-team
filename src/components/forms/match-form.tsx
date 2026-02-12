'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Save, X } from 'lucide-react'

interface MatchFormData {
  matchDate: string
  opponentId: string
  venueId: string
  seasonId: string
  importance: string
  format: string
  overs: number | null
  captainNotes: string
}

interface Option {
  id: string
  name: string
}

interface SeasonOption extends Option {
  format: string
  overs: number
}

const formatOptions = [
  { value: '', label: 'Use Season Default', overs: null },
  { value: 'T20', label: 'T20 (20 overs)', overs: 20 },
  { value: 'T30', label: 'T30 (30 overs)', overs: 30 },
  { value: 'T10', label: 'T10 (10 overs)', overs: 10 },
  { value: 'ODI', label: 'ODI (50 overs)', overs: 50 },
  { value: 'OTHER', label: 'Other', overs: 20 },
]

interface MatchFormProps {
  match?: MatchFormData & { id: string }
  onSubmit: (data: MatchFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function MatchForm({ match, onSubmit, onCancel, isLoading }: MatchFormProps) {
  const [formData, setFormData] = useState<MatchFormData>(
    match || {
      matchDate: new Date().toISOString().split('T')[0],
      opponentId: '',
      venueId: '',
      seasonId: '',
      importance: 'REGULAR',
      format: '',
      overs: null,
      captainNotes: '',
    }
  )
  const [opponents, setOpponents] = useState<Option[]>([])
  const [venues, setVenues] = useState<Option[]>([])
  const [seasons, setSeasons] = useState<SeasonOption[]>([])
  const [error, setError] = useState('')
  const [loadingOptions, setLoadingOptions] = useState(true)
  const isEditing = !!match

  // Sync formData when match prop changes
  useEffect(() => {
    if (match) {
      setFormData(match)
    }
  }, [match])

  useEffect(() => {
    fetchOptions()
  }, [])

  const fetchOptions = async () => {
    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query {
              opponents { id name }
              venues { id name }
              seasons { id name isActive format overs }
            }
          `,
        }),
      })
      const { data } = await res.json()
      setOpponents(data?.opponents || [])
      setVenues(data?.venues || [])
      setSeasons(data?.seasons || [])
      
      // Set default seasonId to active season
      if (!match && data?.seasons) {
        const activeSeason = data.seasons.find((s: { isActive: boolean }) => s.isActive)
        if (activeSeason) {
          setFormData(prev => ({ ...prev, seasonId: activeSeason.id }))
        }
      }
    } catch (err) {
      console.error('Failed to fetch options:', err)
    } finally {
      setLoadingOptions(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.matchDate) {
      setError('Match date is required')
      return
    }
    if (!formData.opponentId) {
      setError('Please select an opponent')
      return
    }
    if (!formData.venueId) {
      setError('Please select a venue')
      return
    }
    if (!formData.seasonId) {
      setError('Please select a season')
      return
    }

    try {
      await onSubmit(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save match')
    }
  }

  const updateField = <K extends keyof MatchFormData>(field: K, value: MatchFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (loadingOptions) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">{error}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Match Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Match Date *</label>
              <input
                type="date"
                value={formData.matchDate}
                onChange={(e) => updateField('matchDate', e.target.value)}
                className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Importance</label>
              <select
                value={formData.importance}
                onChange={(e) => updateField('importance', e.target.value)}
                className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="REGULAR">Regular</option>
                <option value="IMPORTANT">Important</option>
                <option value="MUST_WIN">Must Win</option>
                <option value="LOW_STAKES">Low Stakes</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Match Format</label>
              <select
                value={formData.format}
                onChange={(e) => {
                  const selectedFormat = formatOptions.find(f => f.value === e.target.value)
                  updateField('format', e.target.value)
                  if (selectedFormat && selectedFormat.overs) {
                    updateField('overs', selectedFormat.overs)
                  } else {
                    updateField('overs', null)
                  }
                }}
                className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {formatOptions.map(opt => (
                  <option key={opt.value || 'default'} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {formData.format === '' && formData.seasonId && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Will use season format: {seasons.find(s => s.id === formData.seasonId)?.format || 'T20'} ({seasons.find(s => s.id === formData.seasonId)?.overs || 20} overs)
                </p>
              )}
            </div>
            {formData.format && (
              <div>
                <label className="text-sm font-medium">Overs per Innings</label>
                <input
                  type="number"
                  value={formData.overs || ''}
                  onChange={(e) => updateField('overs', parseInt(e.target.value) || null)}
                  className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  min="1"
                  max="50"
                  placeholder="Custom overs"
                />
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Opponent *</label>
            {opponents.length === 0 ? (
              <p className="mt-1 text-sm text-muted-foreground">
                No opponents found. Please add an opponent first.
              </p>
            ) : (
              <select
                value={formData.opponentId}
                onChange={(e) => updateField('opponentId', e.target.value)}
                className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-muted disabled:cursor-not-allowed"
                required
                disabled={isEditing}
              >
                <option value="">Select opponent...</option>
                {opponents.map((opp) => (
                  <option key={opp.id} value={opp.id}>{opp.name}</option>
                ))}
              </select>
            )}
            {isEditing && <p className="text-xs text-muted-foreground mt-1">Cannot change opponent after creation</p>}
          </div>

          <div>
            <label className="text-sm font-medium">Venue *</label>
            {venues.length === 0 ? (
              <p className="mt-1 text-sm text-muted-foreground">
                No venues found. Please add a venue first.
              </p>
            ) : (
              <select
                value={formData.venueId}
                onChange={(e) => updateField('venueId', e.target.value)}
                className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-muted disabled:cursor-not-allowed"
                required
                disabled={isEditing}
              >
                <option value="">Select venue...</option>
                {venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>{venue.name}</option>
                ))}
              </select>
            )}
            {isEditing && <p className="text-xs text-muted-foreground mt-1">Cannot change venue after creation</p>}
          </div>

          <div>
            <label className="text-sm font-medium">Season *</label>
            <select
              value={formData.seasonId}
              onChange={(e) => updateField('seasonId', e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-muted disabled:cursor-not-allowed"
              required
              disabled={isEditing}
            >
              <option value="">Select season...</option>
              {seasons.map((season) => (
                <option key={season.id} value={season.id}>{season.name}</option>
              ))}
            </select>
            {isEditing && <p className="text-xs text-muted-foreground mt-1">Cannot change season after creation</p>}
          </div>

          <div>
            <label className="text-sm font-medium">Captain&apos;s Notes</label>
            <textarea
              value={formData.captainNotes}
              onChange={(e) => updateField('captainNotes', e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Optional notes about strategy, conditions, etc."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || opponents.length === 0 || venues.length === 0}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {match ? 'Update Match' : 'Schedule Match'}
        </Button>
      </div>
    </form>
  )
}
