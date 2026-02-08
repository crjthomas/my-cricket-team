'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Save, X } from 'lucide-react'

interface PlayerFormData {
  name: string
  jerseyNumber: number | null
  primaryRole: string
  battingStyle: string
  bowlingStyle: string
  battingPosition: string
  battingSkill: number
  bowlingSkill: number
  fieldingSkill: number
  experienceLevel: number
  captainChoice: number
  isWicketkeeper: boolean
  isCaptain: boolean
  isViceCaptain: boolean
  isActive: boolean
}

interface PlayerFormProps {
  player?: PlayerFormData & { id: string }
  onSubmit: (data: PlayerFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

const defaultFormData: PlayerFormData = {
  name: '',
  jerseyNumber: null,
  primaryRole: 'BATSMAN',
  battingStyle: 'RIGHT_HAND',
  bowlingStyle: 'NONE',
  battingPosition: 'MIDDLE_ORDER',
  battingSkill: 5,
  bowlingSkill: 5,
  fieldingSkill: 5,
  experienceLevel: 5,
  captainChoice: 2,
  isWicketkeeper: false,
  isCaptain: false,
  isViceCaptain: false,
  isActive: true,
}

const roles = [
  { value: 'BATSMAN', label: 'Batsman' },
  { value: 'BOWLER', label: 'Bowler' },
  { value: 'ALL_ROUNDER', label: 'All Rounder' },
  { value: 'WICKETKEEPER', label: 'Wicketkeeper' },
]

const battingStyles = [
  { value: 'RIGHT_HAND', label: 'Right Hand' },
  { value: 'LEFT_HAND', label: 'Left Hand' },
]

const bowlingStyles = [
  { value: 'NONE', label: 'None' },
  { value: 'FAST', label: 'Fast' },
  { value: 'MEDIUM_FAST', label: 'Medium Fast' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'SPIN_OFF', label: 'Off Spin' },
  { value: 'SPIN_LEG', label: 'Leg Spin' },
  { value: 'SPIN_LEFT_ARM', label: 'Left Arm Spin' },
]

const battingPositions = [
  { value: 'OPENER', label: 'Opener' },
  { value: 'TOP_ORDER', label: 'Top Order' },
  { value: 'MIDDLE_ORDER', label: 'Middle Order' },
  { value: 'LOWER_ORDER', label: 'Lower Order' },
  { value: 'FINISHER', label: 'Finisher' },
]

const captainChoices = [
  { value: 1, label: '1st Choice' },
  { value: 2, label: '2nd Choice' },
  { value: 3, label: '3rd Choice' },
]

export function PlayerForm({ player, onSubmit, onCancel, isLoading }: PlayerFormProps) {
  const [formData, setFormData] = useState<PlayerFormData>(
    player ? {
      name: player.name,
      jerseyNumber: player.jerseyNumber,
      primaryRole: player.primaryRole,
      battingStyle: player.battingStyle,
      bowlingStyle: player.bowlingStyle,
      battingPosition: player.battingPosition,
      battingSkill: player.battingSkill,
      bowlingSkill: player.bowlingSkill,
      fieldingSkill: player.fieldingSkill,
      experienceLevel: player.experienceLevel,
      captainChoice: player.captainChoice,
      isWicketkeeper: player.isWicketkeeper,
      isCaptain: player.isCaptain,
      isViceCaptain: player.isViceCaptain,
      isActive: player.isActive,
    } : defaultFormData
  )
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.name.trim()) {
      setError('Player name is required')
      return
    }

    try {
      await onSubmit(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save player')
    }
  }

  const updateField = <K extends keyof PlayerFormData>(field: K, value: PlayerFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">{error}</div>
      )}

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 md:col-span-1">
              <label className="text-sm font-medium">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Enter player name"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Jersey Number</label>
              <input
                type="number"
                value={formData.jerseyNumber || ''}
                onChange={(e) => updateField('jerseyNumber', e.target.value ? parseInt(e.target.value) : null)}
                className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g., 7"
                min="0"
                max="99"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Primary Role *</label>
              <select
                value={formData.primaryRole}
                onChange={(e) => updateField('primaryRole', e.target.value)}
                className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {roles.map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Captain Choice</label>
              <select
                value={formData.captainChoice}
                onChange={(e) => updateField('captainChoice', parseInt(e.target.value))}
                className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {captainChoices.map(choice => (
                  <option key={choice.value} value={choice.value}>{choice.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isCaptain}
                onChange={(e) => updateField('isCaptain', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm">Captain</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isViceCaptain}
                onChange={(e) => updateField('isViceCaptain', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm">Vice Captain</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isWicketkeeper}
                onChange={(e) => updateField('isWicketkeeper', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm">Wicketkeeper</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => updateField('isActive', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm">Active</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Playing Style */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Playing Style</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Batting Style</label>
              <select
                value={formData.battingStyle}
                onChange={(e) => updateField('battingStyle', e.target.value)}
                className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {battingStyles.map(style => (
                  <option key={style.value} value={style.value}>{style.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Bowling Style</label>
              <select
                value={formData.bowlingStyle}
                onChange={(e) => updateField('bowlingStyle', e.target.value)}
                className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {bowlingStyles.map(style => (
                  <option key={style.value} value={style.value}>{style.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Batting Position</label>
              <select
                value={formData.battingPosition}
                onChange={(e) => updateField('battingPosition', e.target.value)}
                className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {battingPositions.map(pos => (
                  <option key={pos.value} value={pos.value}>{pos.label}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Skills (1-10)</CardTitle>
          <CardDescription>Rate the player's skills</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium flex justify-between">
                <span>Batting</span>
                <Badge variant="outline">{formData.battingSkill}</Badge>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.battingSkill}
                onChange={(e) => updateField('battingSkill', parseInt(e.target.value))}
                className="mt-2 w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium flex justify-between">
                <span>Bowling</span>
                <Badge variant="outline">{formData.bowlingSkill}</Badge>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.bowlingSkill}
                onChange={(e) => updateField('bowlingSkill', parseInt(e.target.value))}
                className="mt-2 w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium flex justify-between">
                <span>Fielding</span>
                <Badge variant="outline">{formData.fieldingSkill}</Badge>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.fieldingSkill}
                onChange={(e) => updateField('fieldingSkill', parseInt(e.target.value))}
                className="mt-2 w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium flex justify-between">
                <span>Experience</span>
                <Badge variant="outline">{formData.experienceLevel}</Badge>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.experienceLevel}
                onChange={(e) => updateField('experienceLevel', parseInt(e.target.value))}
                className="mt-2 w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
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
          {player ? 'Update Player' : 'Add Player'}
        </Button>
      </div>
    </form>
  )
}
