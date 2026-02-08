'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, MapPin, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

const venues = [
  {
    id: '1',
    name: 'Riverside Ground',
    address: '123 River Road',
    city: 'Springfield',
    pitchType: 'BALANCED',
    boundarySize: 'MEDIUM',
    outfieldSpeed: 'MEDIUM',
    typicalConditions: 'Usually good for batting in first half, helps spinners later',
    averageFirstInningsScore: 165,
    matchesPlayed: 3,
  },
  {
    id: '2',
    name: 'Central Park Cricket Ground',
    address: '456 Central Ave',
    city: 'Springfield',
    pitchType: 'BATTING_FRIENDLY',
    boundarySize: 'SMALL',
    outfieldSpeed: 'FAST',
    typicalConditions: 'High-scoring venue, small boundaries favor batsmen',
    averageFirstInningsScore: 185,
    matchesPlayed: 2,
  },
  {
    id: '3',
    name: 'Green Valley Oval',
    address: '789 Valley Drive',
    city: 'Greenville',
    pitchType: 'BOWLING_FRIENDLY',
    boundarySize: 'LARGE',
    outfieldSpeed: 'SLOW',
    typicalConditions: 'Green pitch helps seamers, large ground makes scoring difficult',
    averageFirstInningsScore: 145,
    matchesPlayed: 1,
  },
  {
    id: '4',
    name: 'Heritage Cricket Club',
    address: '321 Heritage Lane',
    city: 'Oldtown',
    pitchType: 'SPIN_FRIENDLY',
    boundarySize: 'MEDIUM',
    outfieldSpeed: 'SLOW',
    typicalConditions: 'Dusty pitch, turns significantly from second innings',
    averageFirstInningsScore: 155,
    matchesPlayed: 0,
  },
]

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
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Venue
        </Button>
      </div>

      {/* Venues Grid */}
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
                      {venue.address}, {venue.city}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon">
                  <ExternalLink className="h-4 w-4" />
                </Button>
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
                  <p className="text-2xl font-bold">{venue.averageFirstInningsScore}</p>
                  <p className="text-xs text-muted-foreground">Avg 1st Innings</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold">{venue.matchesPlayed}</p>
                  <p className="text-xs text-muted-foreground">Matches Played</p>
                </div>
              </div>

              {/* Conditions */}
              <div className="p-3 rounded-lg bg-muted/30 border text-sm">
                <p className="font-medium mb-1">Typical Conditions:</p>
                <p className="text-muted-foreground">{venue.typicalConditions}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

