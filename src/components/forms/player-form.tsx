'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Save, X, Plus, Trash2 } from 'lucide-react'

interface PlayerFormData {
  name: string
  jerseyNumber: number | null
  primaryRole: string
  battingStyle: string
  bowlingStyle: string
  battingPosition: string
  // Core Skills
  battingSkill: number
  bowlingSkill: number
  fieldingSkill: number
  experienceLevel: number
  // Extended Skills
  powerHitting: number
  runningBetweenWickets: number
  pressureHandling: number
  // Physical & Fitness
  fitnessLevel: number
  currentInjuryStatus: string
  // Detailed Skills
  preferredFieldingPositions: string[]
  bowlingVariations: string[]
  // Availability & Commitment
  reliabilityScore: number
  trainingAttendance: number | null
  // Career History
  previousTeams: string[]
  injuryHistory: string[]
  // Experience Background
  isRookie: boolean
  tennisBallBackground: boolean
  yearsPlaying: number | null
  // League Format Availability
  availableForT20: boolean
  availableForT30: boolean
  leaguePreferenceNotes: string
  // Team Status
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
  powerHitting: 5,
  runningBetweenWickets: 5,
  pressureHandling: 5,
  fitnessLevel: 5,
  currentInjuryStatus: 'FIT',
  preferredFieldingPositions: [],
  bowlingVariations: [],
  reliabilityScore: 5,
  trainingAttendance: null,
  previousTeams: [],
  injuryHistory: [],
  isRookie: false,
  tennisBallBackground: false,
  yearsPlaying: null,
  availableForT20: true,
  availableForT30: true,
  leaguePreferenceNotes: '',
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

const injuryStatuses = [
  { value: 'FIT', label: 'Fit' },
  { value: 'MINOR_NIGGLE', label: 'Minor Niggle' },
  { value: 'RECOVERING', label: 'Recovering' },
  { value: 'INJURED', label: 'Injured' },
]

const fieldingPositionOptions = [
  // Close catching positions
  'Wicketkeeper',
  'First Slip',
  'Second Slip',
  'Third Slip',
  'Fourth Slip',
  'Leg Slip',
  'Gully',
  'Silly Point',
  'Silly Mid-off',
  'Silly Mid-on',
  'Short Leg',
  'Leg Gully',
  'Bat Pad',
  // Inner ring - off side
  'Point',
  'Cover Point',
  'Cover',
  'Extra Cover',
  'Mid-off',
  // Inner ring - leg side
  'Mid-on',
  'Mid-wicket',
  'Square Leg',
  'Backward Square Leg',
  'Fine Leg',
  // Outer ring - off side
  'Third Man',
  'Deep Point',
  'Deep Cover',
  'Deep Extra Cover',
  'Long-off',
  // Outer ring - leg side
  'Long-on',
  'Deep Mid-wicket',
  'Deep Square Leg',
  'Deep Fine Leg',
  'Long Leg',
  // Sweeper positions
  'Sweeper Cover',
  'Sweeper Square Leg',
  // Other
  'Cow Corner',
  'Fly Slip',
  'Short Third Man',
  'Short Fine Leg',
  'Backward Point',
]

const bowlingVariationOptions = [
  // Pace variations
  'Yorker',
  'Bouncer',
  'Slower Ball',
  'Knuckle Ball',
  'Reverse Swing',
  'Leg Cutter',
  'Off Cutter',
  'In-swinger',
  'Out-swinger',
  'Cross Seam',
  'Back of Hand Slower',
  'Wide Yorker',
  'Toe Crusher',
  // Spin variations - Leg Spin
  'Googly',
  'Flipper',
  'Top Spinner',
  'Slider',
  'Wrong\'un',
  // Spin variations - Off Spin
  'Doosra',
  'Carrom Ball',
  'Arm Ball',
  'Teesra',
  'Undercutter',
  // Left-arm spin
  'Chinaman',
  // General
  'Drifter',
  'Floater',
  'Quicker Ball',
]

export function PlayerForm({ player, onSubmit, onCancel, isLoading }: PlayerFormProps) {
  const [formData, setFormData] = useState<PlayerFormData>(
    player ? { ...defaultFormData, ...player } : defaultFormData
  )
  const [error, setError] = useState('')
  const [newPreviousTeam, setNewPreviousTeam] = useState('')
  const [newInjury, setNewInjury] = useState('')

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

  const toggleArrayItem = (field: 'preferredFieldingPositions' | 'bowlingVariations', item: string) => {
    const current = formData[field]
    if (current.includes(item)) {
      updateField(field, current.filter(i => i !== item))
    } else {
      updateField(field, [...current, item])
    }
  }

  const addToArray = (field: 'previousTeams' | 'injuryHistory', value: string, setValue: (v: string) => void) => {
    if (value.trim()) {
      updateField(field, [...formData[field], value.trim()])
      setValue('')
    }
  }

  const removeFromArray = (field: 'previousTeams' | 'injuryHistory', index: number) => {
    updateField(field, formData[field].filter((_, i) => i !== index))
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
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
                className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="e.g., 7"
                min="0"
                max="99"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Primary Role *</label>
              <select
                value={formData.primaryRole}
                onChange={(e) => updateField('primaryRole', e.target.value)}
                className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
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
                className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
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
                className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-400"
              />
              <span className="text-sm">Captain</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isViceCaptain}
                onChange={(e) => updateField('isViceCaptain', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-400"
              />
              <span className="text-sm">Vice Captain</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isWicketkeeper}
                onChange={(e) => updateField('isWicketkeeper', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-400"
              />
              <span className="text-sm">Wicketkeeper</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => updateField('isActive', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-400"
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Batting Style</label>
              <select
                value={formData.battingStyle}
                onChange={(e) => updateField('battingStyle', e.target.value)}
                className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
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
                className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
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
                className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                {battingPositions.map(pos => (
                  <option key={pos.value} value={pos.value}>{pos.label}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Core Skills */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Core Skills (1-10)</CardTitle>
          <CardDescription>Rate the player&apos;s fundamental abilities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Extended Skills */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Extended Skills (1-10)</CardTitle>
          <CardDescription>Additional performance attributes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium flex justify-between">
                <span>Power Hitting</span>
                <Badge variant="outline">{formData.powerHitting}</Badge>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.powerHitting}
                onChange={(e) => updateField('powerHitting', parseInt(e.target.value))}
                className="mt-2 w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium flex justify-between">
                <span>Running B/W Wickets</span>
                <Badge variant="outline">{formData.runningBetweenWickets}</Badge>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.runningBetweenWickets}
                onChange={(e) => updateField('runningBetweenWickets', parseInt(e.target.value))}
                className="mt-2 w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium flex justify-between">
                <span>Pressure Handling</span>
                <Badge variant="outline">{formData.pressureHandling}</Badge>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.pressureHandling}
                onChange={(e) => updateField('pressureHandling', parseInt(e.target.value))}
                className="mt-2 w-full"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Physical & Fitness */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Physical & Fitness</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium flex justify-between">
                <span>Fitness Level</span>
                <Badge variant="outline">{formData.fitnessLevel}</Badge>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.fitnessLevel}
                onChange={(e) => updateField('fitnessLevel', parseInt(e.target.value))}
                className="mt-2 w-full"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Injury Status</label>
              <select
                value={formData.currentInjuryStatus}
                onChange={(e) => updateField('currentInjuryStatus', e.target.value)}
                className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                {injuryStatuses.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commitment & Reliability */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Commitment & Reliability</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium flex justify-between">
                <span>Reliability Score</span>
                <Badge variant="outline">{formData.reliabilityScore}</Badge>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.reliabilityScore}
                onChange={(e) => updateField('reliabilityScore', parseInt(e.target.value))}
                className="mt-2 w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">Shows up when selected</p>
            </div>
            <div>
              <label className="text-sm font-medium">Training Attendance (%)</label>
              <input
                type="number"
                value={formData.trainingAttendance || ''}
                onChange={(e) => updateField('trainingAttendance', e.target.value ? parseInt(e.target.value) : null)}
                className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="e.g., 85"
                min="0"
                max="100"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferred Fielding Positions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Preferred Fielding Positions</CardTitle>
          <CardDescription>Select all positions where the player excels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {fieldingPositionOptions.map(position => (
              <Badge
                key={position}
                variant={formData.preferredFieldingPositions.includes(position) ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-orange-100"
                onClick={() => toggleArrayItem('preferredFieldingPositions', position)}
              >
                {position}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bowling Variations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bowling Variations</CardTitle>
          <CardDescription>Select all variations the bowler can deliver</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {bowlingVariationOptions.map(variation => (
              <Badge
                key={variation}
                variant={formData.bowlingVariations.includes(variation) ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-orange-100"
                onClick={() => toggleArrayItem('bowlingVariations', variation)}
              >
                {variation}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Experience Background */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Experience Background</CardTitle>
          <CardDescription>Player&apos;s cricket background and experience level</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Years Playing Cricket</label>
              <input
                type="number"
                value={formData.yearsPlaying || ''}
                onChange={(e) => updateField('yearsPlaying', e.target.value ? parseInt(e.target.value) : null)}
                className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
                placeholder="e.g., 5"
                min="0"
                max="50"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isRookie}
                onChange={(e) => updateField('isRookie', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-400"
              />
              <div>
                <span className="text-sm font-medium">Rookie</span>
                <p className="text-xs text-muted-foreground">New to leather ball cricket</p>
              </div>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.tennisBallBackground}
                onChange={(e) => updateField('tennisBallBackground', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-400"
              />
              <div>
                <span className="text-sm font-medium">Tennis Ball Background</span>
                <p className="text-xs text-muted-foreground">Previously played only tennis ball cricket</p>
              </div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* League Format Availability */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">League Format Availability</CardTitle>
          <CardDescription>Which league formats this player is available for</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.availableForT20}
                onChange={(e) => updateField('availableForT20', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-400"
              />
              <div>
                <span className="text-sm font-medium">T20 League</span>
                <p className="text-xs text-muted-foreground">Available for T20 format matches</p>
              </div>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.availableForT30}
                onChange={(e) => updateField('availableForT30', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-400"
              />
              <div>
                <span className="text-sm font-medium">T30 League</span>
                <p className="text-xs text-muted-foreground">Available for T30 format matches</p>
              </div>
            </label>
          </div>
          
          <div>
            <label className="text-sm font-medium">League Preference Notes</label>
            <textarea
              value={formData.leaguePreferenceNotes}
              onChange={(e) => updateField('leaguePreferenceNotes', e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="e.g., Prefers T30 due to work schedule, Only available for T30 on weekends..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Previous Teams */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Previous Teams</CardTitle>
          <CardDescription>Clubs or teams the player has previously played for</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newPreviousTeam}
              onChange={(e) => setNewPreviousTeam(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="e.g., Melbourne Stars CC"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('previousTeams', newPreviousTeam, setNewPreviousTeam))}
            />
            <Button 
              type="button" 
              variant="outline"
              onClick={() => addToArray('previousTeams', newPreviousTeam, setNewPreviousTeam)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {formData.previousTeams.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.previousTeams.map((team, index) => (
                <Badge key={index} variant="secondary" className="gap-1 pr-1">
                  {team}
                  <button
                    type="button"
                    onClick={() => removeFromArray('previousTeams', index)}
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

      {/* Injury History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Injury History</CardTitle>
          <CardDescription>Past injuries for workload management</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newInjury}
              onChange={(e) => setNewInjury(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
              placeholder="e.g., Hamstring strain - Jan 2025"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addToArray('injuryHistory', newInjury, setNewInjury))}
            />
            <Button 
              type="button" 
              variant="outline"
              onClick={() => addToArray('injuryHistory', newInjury, setNewInjury)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {formData.injuryHistory.length > 0 && (
            <div className="space-y-2">
              {formData.injuryHistory.map((injury, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded-md">
                  <span className="text-sm">{injury}</span>
                  <button
                    type="button"
                    onClick={() => removeFromArray('injuryHistory', index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
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
