'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Save, X, Plus, Trash2 } from 'lucide-react'

interface OpponentFormData {
  name: string
  shortName: string
  overallStrength: number
  battingStrength: number
  bowlingStrength: number
  fieldingStrength: number
  keyPlayers: string[]
  playingStyle: string
  notes: string
}

interface OpponentFormProps {
  opponent?: OpponentFormData & { id: string }
  onSubmit: (data: OpponentFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

const defaultFormData: OpponentFormData = {
  name: '',
  shortName: '',
  overallStrength: 5,
  battingStrength: 5,
  bowlingStrength: 5,
  fieldingStrength: 5,
  keyPlayers: [],
  playingStyle: '',
  notes: '',
}

export function OpponentForm({ opponent, onSubmit, onCancel, isLoading }: OpponentFormProps) {
  const [formData, setFormData] = useState<OpponentFormData>(
    opponent ? { ...opponent } : defaultFormData
  )
  const [newKeyPlayer, setNewKeyPlayer] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.name.trim()) {
      setError('Opponent name is required')
      return
    }

    try {
      await onSubmit(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save opponent')
    }
  }

  const updateField = <K extends keyof OpponentFormData>(field: K, value: OpponentFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addKeyPlayer = () => {
    if (newKeyPlayer.trim()) {
      updateField('keyPlayers', [...formData.keyPlayers, newKeyPlayer.trim()])
      setNewKeyPlayer('')
    }
  }

  const removeKeyPlayer = (index: number) => {
    updateField('keyPlayers', formData.keyPlayers.filter((_, i) => i !== index))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">{error}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Team Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="e.g., Thunder Hawks"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Short Name</label>
              <input
                type="text"
                value={formData.shortName}
                onChange={(e) => updateField('shortName', e.target.value.toUpperCase().slice(0, 3))}
                className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="e.g., THK"
                maxLength={3}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Playing Style</label>
            <input
              type="text"
              value={formData.playingStyle}
              onChange={(e) => updateField('playingStyle', e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="e.g., Aggressive, pace-heavy bowling"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Any additional notes about the opponent..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Strength Ratings (1-10)</CardTitle>
          <CardDescription>Rate the opponent's abilities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium flex justify-between">
                <span>Overall</span>
                <Badge variant="outline">{formData.overallStrength}</Badge>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.overallStrength}
                onChange={(e) => updateField('overallStrength', parseInt(e.target.value))}
                className="mt-2 w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium flex justify-between">
                <span>Batting</span>
                <Badge variant="outline">{formData.battingStrength}</Badge>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.battingStrength}
                onChange={(e) => updateField('battingStrength', parseInt(e.target.value))}
                className="mt-2 w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium flex justify-between">
                <span>Bowling</span>
                <Badge variant="outline">{formData.bowlingStrength}</Badge>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.bowlingStrength}
                onChange={(e) => updateField('bowlingStrength', parseInt(e.target.value))}
                className="mt-2 w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium flex justify-between">
                <span>Fielding</span>
                <Badge variant="outline">{formData.fieldingStrength}</Badge>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.fieldingStrength}
                onChange={(e) => updateField('fieldingStrength', parseInt(e.target.value))}
                className="mt-2 w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Key Players</CardTitle>
          <CardDescription>Notable players to watch out for</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newKeyPlayer}
              onChange={(e) => setNewKeyPlayer(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="e.g., John Smith (Fast bowler)"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyPlayer())}
            />
            <Button type="button" onClick={addKeyPlayer} variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {formData.keyPlayers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.keyPlayers.map((player, index) => (
                <Badge key={index} variant="secondary" className="gap-1 pr-1">
                  {player}
                  <button
                    type="button"
                    onClick={() => removeKeyPlayer(index)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {opponent ? 'Update Opponent' : 'Add Opponent'}
        </Button>
      </div>
    </form>
  )
}
