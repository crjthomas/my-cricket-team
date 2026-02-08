'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Plus, ChevronRight, Swords, Trophy, Target } from 'lucide-react'
import { cn } from '@/lib/utils'

const opponents = [
  {
    id: '1',
    name: 'Thunder Hawks',
    shortName: 'THK',
    overallStrength: 8,
    battingStrength: 7,
    bowlingStrength: 9,
    fieldingStrength: 7,
    keyPlayers: ['Marcus Johnson (Fast bowler)', 'David Chen (Batsman)'],
    playingStyle: 'Aggressive, pace-heavy bowling',
    matchesPlayed: 2,
    matchesWon: 1,
    matchesLost: 1,
    notes: 'Strong fast bowling attack, can be vulnerable against spin',
  },
  {
    id: '2',
    name: 'Royal Strikers',
    shortName: 'RST',
    overallStrength: 7,
    battingStrength: 8,
    bowlingStrength: 6,
    fieldingStrength: 7,
    keyPlayers: ['James Wilson (All-rounder)', 'Mike Brown (Batsman)'],
    playingStyle: 'Batting-focused, like to chase',
    matchesPlayed: 1,
    matchesWon: 0,
    matchesLost: 0,
    matchesDrawn: 1,
    notes: 'Strong top order, bowling can be expensive',
  },
  {
    id: '3',
    name: 'City Lions',
    shortName: 'CTL',
    overallStrength: 6,
    battingStrength: 6,
    bowlingStrength: 6,
    fieldingStrength: 6,
    keyPlayers: ['Tom Harris (Captain)'],
    playingStyle: 'Defensive, tight bowling',
    matchesPlayed: 1,
    matchesWon: 1,
    matchesLost: 0,
    notes: 'Well-balanced but lacks match winners',
  },
  {
    id: '4',
    name: 'Storm Riders',
    shortName: 'STR',
    overallStrength: 9,
    battingStrength: 9,
    bowlingStrength: 8,
    fieldingStrength: 9,
    keyPlayers: ['Chris Martin (Star all-rounder)', 'Alex Turner (WK-Batsman)', 'Sam Clarke (Spinner)'],
    playingStyle: 'Complete team, adaptable',
    matchesPlayed: 1,
    matchesWon: 0,
    matchesLost: 1,
    notes: 'League leaders, excellent in all departments',
  },
]

export default function OpponentsPage() {
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
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Opponent
        </Button>
      </div>

      {/* Overall Record */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-muted">
              <Swords className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">4</p>
              <p className="text-sm text-muted-foreground">Teams Faced</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-2 rounded-lg bg-pitch-100 dark:bg-pitch-900">
              <Trophy className="h-5 w-5 text-pitch-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">2</p>
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
              <Swords className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">1</p>
              <p className="text-sm text-muted-foreground">Draws</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Opponents Grid */}
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
                    {opponent.shortName}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{opponent.name}</h3>
                    <p className="text-sm text-muted-foreground">{opponent.playingStyle}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon">
                  <ChevronRight className="h-4 w-4" />
                </Button>
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
    </div>
  )
}

