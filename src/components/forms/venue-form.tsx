'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Save, X } from 'lucide-react'

interface VenueFormData {
  name: string
  address: string
  city: string
  googleMapsUrl: string
  pitchType: string
  boundarySize: string
  outfieldSpeed: string
  typicalConditions: string
  averageFirstInningsScore: number | null
}

interface VenueFormProps {
  venue?: VenueFormData & { id: string }
  onSubmit: (data: VenueFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

const defaultFormData: VenueFormData = {
  name: '',
  address: '',
  city: '',
  googleMapsUrl: '',
  pitchType: 'BALANCED',
  boundarySize: 'MEDIUM',
  outfieldSpeed: 'MEDIUM',
  typicalConditions: '',
  averageFirstInningsScore: null,
}

const pitchTypes = [
  { value: 'BATTING_FRIENDLY', label: 'Batting Friendly' },
  { value: 'BOWLING_FRIENDLY', label: 'Bowling Friendly' },
  { value: 'BALANCED', label: 'Balanced' },
  { value: 'SPIN_FRIENDLY', label: 'Spin Friendly' },
  { value: 'PACE_FRIENDLY', label: 'Pace Friendly' },
]

const boundarySizes = [
  { value: 'SMALL', label: 'Small' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LARGE', label: 'Large' },
]

const outfieldSpeeds = [
  { value: 'FAST', label: 'Fast' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'SLOW', label: 'Slow' },
]

export function VenueForm({ venue, onSubmit, onCancel, isLoading }: VenueFormProps) {
  const [formData, setFormData] = useState<VenueFormData>(
    venue ? { ...venue } : defaultFormData
  )
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.name.trim()) {
      setError('Venue name is required')
      return
    }

    try {
      await onSubmit(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save venue')
    }
  }

  const updateField = <K extends keyof VenueFormData>(field: K, value: VenueFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">{error}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Location Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 md:col-span-1">
              <label className="text-sm font-medium">Venue Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="e.g., Riverside Cricket Ground"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => updateField('city', e.target.value)}
                className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="e.g., Portland"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => updateField('address', e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Full address"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Google Maps URL</label>
            <input
              type="url"
              value={formData.googleMapsUrl}
              onChange={(e) => updateField('googleMapsUrl', e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="https://maps.google.com/..."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ground Characteristics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Pitch Type</label>
              <select
                value={formData.pitchType}
                onChange={(e) => updateField('pitchType', e.target.value)}
                className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {pitchTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Boundary Size</label>
              <select
                value={formData.boundarySize}
                onChange={(e) => updateField('boundarySize', e.target.value)}
                className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {boundarySizes.map(size => (
                  <option key={size.value} value={size.value}>{size.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Outfield Speed</label>
              <select
                value={formData.outfieldSpeed}
                onChange={(e) => updateField('outfieldSpeed', e.target.value)}
                className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {outfieldSpeeds.map(speed => (
                  <option key={speed.value} value={speed.value}>{speed.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Typical Conditions</label>
              <input
                type="text"
                value={formData.typicalConditions}
                onChange={(e) => updateField('typicalConditions', e.target.value)}
                className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="e.g., Usually dry, favors spinners"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Avg First Innings Score</label>
              <input
                type="number"
                value={formData.averageFirstInningsScore || ''}
                onChange={(e) => updateField('averageFirstInningsScore', e.target.value ? parseInt(e.target.value) : null)}
                className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="e.g., 160"
              />
            </div>
          </div>
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
          {venue ? 'Update Venue' : 'Add Venue'}
        </Button>
      </div>
    </form>
  )
}
