'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, MapPin, ExternalLink, Loader2, Edit, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import { VenueForm } from '@/components/forms/venue-form'

interface Venue {
  id: string
  name: string
  address: string | null
  city: string | null
  googleMapsUrl: string | null
  pitchType: string
  boundarySize: string
  outfieldSpeed: string
  typicalConditions: string | null
  averageFirstInningsScore: number | null
}

function getPitchTypeColor(type: string) {
  switch (type) {
    case 'BATTING_FRIENDLY':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case 'BOWLING_FRIENDLY':
      return 'bg-leather-100 text-leather-800 dark:bg-leather-900 dark:text-leather-200'
    case 'SPIN_FRIENDLY':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    case 'PACE_FRIENDLY':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    default:
      return 'bg-pitch-100 text-pitch-800 dark:bg-pitch-900 dark:text-pitch-200'
  }
}

export default function VenuesPage() {
  const { isAdmin } = useAuth()
  const [venues, setVenues] = useState<Venue[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchVenues()
  }, [])

  const fetchVenues = async () => {
    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query GetVenues {
              venues {
                id
                name
                address
                city
                googleMapsUrl
                pitchType
                boundarySize
                outfieldSpeed
                typicalConditions
                averageFirstInningsScore
              }
            }
          `
        }),
      })

      const { data } = await response.json()
      setVenues(data?.venues || [])
    } catch (error) {
      console.error('Failed to fetch venues:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (formData: {
    name: string
    address: string
    city: string
    googleMapsUrl: string
    pitchType: string
    boundarySize: string
    outfieldSpeed: string
    typicalConditions: string
    averageFirstInningsScore: number | null
  }) => {
    setIsSaving(true)
    try {
      const mutation = editingVenue ? `
        mutation UpdateVenue($id: ID!, $input: UpdateVenueInput!) {
          updateVenue(id: $id, input: $input) { id }
        }
      ` : `
        mutation CreateVenue($name: String!, $address: String, $city: String, $pitchType: String, $boundarySize: String, $outfieldSpeed: String, $typicalConditions: String) {
          createVenue(name: $name, address: $address, city: $city, pitchType: $pitchType, boundarySize: $boundarySize, outfieldSpeed: $outfieldSpeed, typicalConditions: $typicalConditions) { id }
        }
      `

      const variables = editingVenue ? {
        id: editingVenue.id,
        input: formData
      } : {
        name: formData.name,
        address: formData.address || null,
        city: formData.city || null,
        pitchType: formData.pitchType,
        boundarySize: formData.boundarySize,
        outfieldSpeed: formData.outfieldSpeed,
        typicalConditions: formData.typicalConditions || null,
      }

      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: mutation, variables }),
      })

      const result = await response.json()
      if (result.errors) throw new Error(result.errors[0].message)

      setShowForm(false)
      setEditingVenue(null)
      fetchVenues()
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (venue: Venue) => {
    if (!confirm(`Are you sure you want to delete ${venue.name}?`)) return

    try {
      await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `mutation DeleteVenue($id: ID!) { deleteVenue(id: $id) }`,
          variables: { id: venue.id }
        }),
      })
      fetchVenues()
    } catch (error) {
      alert('Failed to delete venue')
    }
  }

  if (showForm || editingVenue) {
    return (
      <div className="space-y-6 animate-fade-in max-w-4xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => { setShowForm(false); setEditingVenue(null) }}>
            <X className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {editingVenue ? 'Edit Venue' : 'Add Venue'}
            </h1>
            <p className="text-muted-foreground">
              {editingVenue ? `Update ${editingVenue.name}` : 'Add a new venue'}
            </p>
          </div>
        </div>
        <VenueForm
          venue={editingVenue ? {
            id: editingVenue.id,
            name: editingVenue.name,
            address: editingVenue.address || '',
            city: editingVenue.city || '',
            googleMapsUrl: editingVenue.googleMapsUrl || '',
            pitchType: editingVenue.pitchType,
            boundarySize: editingVenue.boundarySize,
            outfieldSpeed: editingVenue.outfieldSpeed,
            typicalConditions: editingVenue.typicalConditions || '',
            averageFirstInningsScore: editingVenue.averageFirstInningsScore,
          } : undefined}
          onSubmit={handleSubmit}
          onCancel={() => { setShowForm(false); setEditingVenue(null) }}
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
          <h1 className="text-3xl font-bold tracking-tight">Venues</h1>
          <p className="text-muted-foreground mt-1">
            Ground information and pitch conditions
          </p>
        </div>
        {isAdmin && (
          <Button className="gap-2" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4" />
            Add Venue
          </Button>
        )}
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : venues.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Venues Yet</h3>
            <p className="text-muted-foreground mb-4">
              Add venues where your team plays matches.
            </p>
            {isAdmin && (
              <Button className="gap-2" onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4" />
                Add First Venue
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {venues.map((venue, index) => (
            <Card 
              key={venue.id} 
              glow
              className={cn('stagger-' + ((index % 5) + 1), 'animate-slide-up')}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-pitch-100 dark:bg-pitch-900">
                      <MapPin className="h-6 w-6 text-pitch-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{venue.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {venue.address && venue.city ? `${venue.address}, ${venue.city}` : venue.city || venue.address || 'No address'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {venue.googleMapsUrl && (
                      <Button variant="ghost" size="icon" asChild>
                        <a href={venue.googleMapsUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {isAdmin && (
                      <>
                        <Button variant="ghost" size="icon" onClick={() => setEditingVenue(venue)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(venue)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Pitch & Ground Info */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge className={getPitchTypeColor(venue.pitchType)}>
                    {venue.pitchType.replace('_', ' ')}
                  </Badge>
                  <Badge variant="outline">
                    {venue.boundarySize} boundaries
                  </Badge>
                  <Badge variant="outline">
                    {venue.outfieldSpeed} outfield
                  </Badge>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-2xl font-bold">{venue.averageFirstInningsScore || '-'}</p>
                    <p className="text-xs text-muted-foreground">Avg 1st Innings</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <p className="text-2xl font-bold">-</p>
                    <p className="text-xs text-muted-foreground">Matches Played</p>
                  </div>
                </div>

                {/* Conditions */}
                {venue.typicalConditions && (
                  <div className="p-3 rounded-lg bg-muted/30 border text-sm">
                    <p className="font-medium mb-1">Typical Conditions:</p>
                    <p className="text-muted-foreground">{venue.typicalConditions}</p>
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
