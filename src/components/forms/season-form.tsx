'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Save, X } from 'lucide-react'

interface SeasonFormData {
  name: string
  startDate: string
  endDate: string
  description: string
  totalMatches: number
  totalTeams: number
  isActive: boolean
}

interface SeasonFormProps {
  season?: SeasonFormData & { id: string }
  onSubmit: (data: SeasonFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

const defaultFormData: SeasonFormData = {
  name: '',
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
  description: '',
  totalMatches: 12,
  totalTeams: 8,
  isActive: true,
}

export function SeasonForm({ season, onSubmit, onCancel, isLoading }: SeasonFormProps) {
  const [formData, setFormData] = useState<SeasonFormData>(
    season ? { ...season } : defaultFormData
  )
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.name.trim()) {
      setError('Season name is required')
      return
    }
    if (!formData.startDate) {
      setError('Start date is required')
      return
    }

    try {
      await onSubmit(formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save season')
    }
  }

  const updateField = <K extends keyof SeasonFormData>(field: K, value: SeasonFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">{error}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Season Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Season Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="e.g., Winter League 2026"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Start Date *</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => updateField('startDate', e.target.value)}
                className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => updateField('endDate', e.target.value)}
                className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Total Matches</label>
              <input
                type="number"
                value={formData.totalMatches}
                onChange={(e) => updateField('totalMatches', parseInt(e.target.value) || 0)}
                className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                min="1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Total Teams</label>
              <input
                type="number"
                value={formData.totalTeams}
                onChange={(e) => updateField('totalTeams', parseInt(e.target.value) || 0)}
                className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                min="2"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              className="mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Optional description..."
              rows={3}
            />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => updateField('isActive', e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <span className="text-sm">Active Season (current season being played)</span>
            </label>
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
          {season ? 'Update Season' : 'Create Season'}
        </Button>
      </div>
    </form>
  )
}
