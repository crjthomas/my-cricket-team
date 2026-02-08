'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Calendar,
  Plus,
  MapPin,
  Clock,
  ChevronRight,
  Trophy,
  Target,
  Users
} from 'lucide-react'
import Link from 'next/link'
import { cn, formatDate, getImportanceColor, getMatchResultColor } from '@/lib/utils'

const upcomingMatches = [
  {
    id: '1',
    matchNumber: 7,
    matchDate: '2026-02-08',
    opponent: { name: 'Thunder Hawks', shortName: 'THK', strength: 8 },
    venue: { name: 'Riverside Ground', city: 'Springfield' },
    importance: 'MUST_WIN',
    status: 'UPCOMING',
    weather: 'OVERCAST',
    availableCount: 14,
    leaguePosition: 3,
    matchesRemaining: 5,
    captainNotes: 'Must win to stay in top 4 contention.',
  },
  {
    id: '2',
    matchNumber: 8,
    matchDate: '2026-02-15',
    opponent: { name: 'Royal Strikers', shortName: 'RST', strength: 7 },
    venue: { name: 'Central Park Cricket Ground', city: 'Springfield' },
    importance: 'IMPORTANT',
    status: 'UPCOMING',
    weather: null,
    availableCount: null,
    leaguePosition: null,
    matchesRemaining: 4,
    captainNotes: null,
  },
  {
    id: '3',
    matchNumber: 9,
    matchDate: '2026-02-22',
    opponent: { name: 'City Lions', shortName: 'CTL', strength: 6 },
    venue: { name: 'Heritage Cricket Club', city: 'Oldtown' },
    importance: 'REGULAR',
    status: 'UPCOMING',
    weather: null,
    availableCount: null,
    leaguePosition: null,
    matchesRemaining: 3,
    captainNotes: null,
  },
]

const pastMatches = [
  {
    id: '4',
    matchNumber: 6,
    matchDate: '2026-01-25',
    opponent: { name: 'City Lions', shortName: 'CTL', strength: 6 },
    venue: { name: 'Riverside Ground', city: 'Springfield' },
    importance: 'REGULAR',
    status: 'COMPLETED',
    result: 'WON',
    ourScore: '185/6 (20)',
    opponentScore: '160/9 (20)',
    marginOfVictory: '25 runs',
    manOfMatch: 'Vikram Patel',
  },
  {
    id: '5',
    matchNumber: 5,
    matchDate: '2026-01-18',
    opponent: { name: 'Storm Riders', shortName: 'STR', strength: 9 },
    venue: { name: 'Green Valley Oval', city: 'Greenville' },
    importance: 'IMPORTANT',
    status: 'COMPLETED',
    result: 'LOST',
    ourScore: '145/8 (20)',
    opponentScore: '148/4 (18.2)',
    marginOfVictory: '6 wickets',
    manOfMatch: null,
  },
  {
    id: '6',
    matchNumber: 4,
    matchDate: '2026-01-11',
    opponent: { name: 'Thunder Hawks', shortName: 'THK', strength: 8 },
    venue: { name: 'Central Park Cricket Ground', city: 'Springfield' },
    importance: 'REGULAR',
    status: 'COMPLETED',
    result: 'WON',
    ourScore: '172/5 (20)',
    opponentScore: '165/7 (20)',
    marginOfVictory: '7 runs',
    manOfMatch: 'Raj Kumar',
  },
  {
    id: '7',
    matchNumber: 3,
    matchDate: '2026-01-04',
    opponent: { name: 'Royal Strikers', shortName: 'RST', strength: 7 },
    venue: { name: 'Riverside Ground', city: 'Springfield' },
    importance: 'REGULAR',
    status: 'COMPLETED',
    result: 'DRAW',
    ourScore: '155/6 (20)',
    opponentScore: '155/8 (20)',
    marginOfVictory: null,
    manOfMatch: null,
  },
]

type TabType = 'upcoming' | 'completed'

export default function MatchesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('upcoming')

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Matches</h1>
          <p className="text-muted-foreground mt-1">
            Schedule and manage your team&apos;s fixtures
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Match
        </Button>
      </div>

      {/* Season Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-pitch-100 dark:bg-pitch-900">
              <Trophy className="h-5 w-5 text-pitch-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">4</p>
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
              <p className="text-2xl font-bold">1</p>
              <p className="text-sm text-muted-foreground">Losses</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900">
              <Users className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">1</p>
              <p className="text-sm text-muted-foreground">Draws</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">6</p>
              <p className="text-sm text-muted-foreground">Remaining</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'upcoming'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Upcoming ({upcomingMatches.length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'completed'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Completed ({pastMatches.length})
        </button>
      </div>

      {/* Match List */}
      <div className="space-y-4">
        {activeTab === 'upcoming' ? (
          upcomingMatches.map((match, index) => (
            <Card 
              key={match.id} 
              glow 
              className={cn('stagger-' + ((index % 5) + 1), 'animate-slide-up')}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    {/* Match Number */}
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Match</p>
                      <p className="text-2xl font-bold">#{match.matchNumber}</p>
                    </div>
                    
                    {/* Opponent */}
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-midnight-700 to-midnight-900 text-white font-bold text-lg">
                        {match.opponent.shortName}
                      </div>
                      <div>
                        <p className="font-semibold text-lg">vs {match.opponent.name}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(match.matchDate)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {match.venue.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Match Details */}
                    <div className="flex gap-4">
                      <Badge className={getImportanceColor(match.importance)}>
                        {match.importance.replace('_', ' ')}
                      </Badge>
                      {match.weather && (
                        <Badge variant="outline">{match.weather.replace('_', ' ')}</Badge>
                      )}
                    </div>

                    {/* Availability */}
                    {match.availableCount !== null ? (
                      <div className="text-center">
                        <p className="text-2xl font-bold text-pitch-600">{match.availableCount}</p>
                        <p className="text-xs text-muted-foreground">Available</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Pending</p>
                        <p className="text-xs text-muted-foreground">Availability</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link href={`/squad`}>
                        <Button variant="outline" size="sm">
                          Select Squad
                        </Button>
                      </Link>
                      <Link href={`/matches/${match.id}`}>
                        <Button variant="ghost" size="icon">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>

                {match.captainNotes && (
                  <div className="mt-4 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                    <span className="font-medium">Captain&apos;s Note:</span> {match.captainNotes}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          pastMatches.map((match, index) => (
            <Card 
              key={match.id}
              className={cn('stagger-' + ((index % 5) + 1), 'animate-slide-up')}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    {/* Match Number & Result */}
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Match</p>
                      <p className="text-2xl font-bold">#{match.matchNumber}</p>
                      <Badge className={cn('mt-1', getMatchResultColor(match.result))}>
                        {match.result}
                      </Badge>
                    </div>
                    
                    {/* Opponent & Scores */}
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-midnight-700 to-midnight-900 text-white font-bold text-lg">
                        {match.opponent.shortName}
                      </div>
                      <div>
                        <p className="font-semibold text-lg">vs {match.opponent.name}</p>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="font-medium">{match.ourScore}</span>
                          <span className="text-muted-foreground">vs</span>
                          <span className="text-muted-foreground">{match.opponentScore}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(match.matchDate)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {match.venue.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* Margin */}
                    {match.marginOfVictory && (
                      <div className="text-center">
                        <p className="font-semibold">
                          {match.result === 'WON' ? 'Won by' : 'Lost by'}
                        </p>
                        <p className="text-sm text-muted-foreground">{match.marginOfVictory}</p>
                      </div>
                    )}

                    {/* Man of Match */}
                    {match.manOfMatch && (
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">Man of Match</p>
                        <p className="font-medium">{match.manOfMatch}</p>
                      </div>
                    )}

                    {/* View Details */}
                    <Link href={`/matches/${match.id}`}>
                      <Button variant="ghost" size="icon">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

