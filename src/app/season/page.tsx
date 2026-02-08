'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Trophy, 
  Calendar,
  Target,
  TrendingUp,
  Medal,
  Users
} from 'lucide-react'
import { cn } from '@/lib/utils'

const seasonData = {
  name: 'Winter League 2026',
  startDate: '2026-01-15',
  endDate: '2026-04-30',
  totalMatches: 12,
  matchesPlayed: 6,
  wins: 4,
  losses: 1,
  draws: 1,
  noResults: 0,
  currentPosition: 3,
  totalTeams: 8,
  points: 10,
}

const pointsTable = [
  { position: 1, team: 'Storm Riders', played: 6, won: 5, lost: 0, drawn: 1, nrr: '+1.25', points: 12 },
  { position: 2, team: 'Thunder Hawks', played: 6, won: 4, lost: 1, drawn: 1, nrr: '+0.85', points: 10 },
  { position: 3, team: 'Our Team', played: 6, won: 4, lost: 1, drawn: 1, nrr: '+0.72', points: 10, isUs: true },
  { position: 4, team: 'Royal Strikers', played: 6, won: 3, lost: 2, drawn: 1, nrr: '+0.45', points: 8 },
  { position: 5, team: 'City Lions', played: 6, won: 3, lost: 3, drawn: 0, nrr: '+0.12', points: 6 },
  { position: 6, team: 'Valley Knights', played: 6, won: 2, lost: 3, drawn: 1, nrr: '-0.35', points: 6 },
  { position: 7, team: 'Metro Mavericks', played: 6, won: 1, lost: 4, drawn: 1, nrr: '-0.88', points: 4 },
  { position: 8, team: 'Coastal Chargers', played: 6, won: 0, lost: 5, drawn: 1, nrr: '-1.45', points: 2 },
]

const milestones = [
  { player: 'Raj Kumar', milestone: '250 runs', date: '2026-01-25', icon: '🏏' },
  { player: 'Vikram Patel', milestone: '10 wickets', date: '2026-01-25', icon: '🎯' },
  { player: 'Team', milestone: '4th consecutive win', date: '2026-01-25', icon: '🏆' },
  { player: 'Suresh Menon', milestone: '10 dismissals', date: '2026-01-18', icon: '🧤' },
]

export default function SeasonPage() {
  const winRate = (seasonData.wins / seasonData.matchesPlayed * 100).toFixed(0)
  const progressPercentage = (seasonData.matchesPlayed / seasonData.totalMatches * 100)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Trophy className="h-8 w-8 text-stumps-500" />
          {seasonData.name}
        </h1>
        <p className="text-muted-foreground mt-1">
          Season overview, standings, and milestones
        </p>
      </div>

      {/* Season Progress */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold">Season Progress</h3>
              <p className="text-sm text-muted-foreground">
                {seasonData.matchesPlayed} of {seasonData.totalMatches} matches completed
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{progressPercentage.toFixed(0)}%</p>
              <p className="text-sm text-muted-foreground">Complete</p>
            </div>
          </div>
          <Progress value={progressPercentage} className="h-3" />
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-pitch-200 dark:border-pitch-800 bg-gradient-to-br from-pitch-50 to-transparent dark:from-pitch-950/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Wins</p>
                <p className="text-4xl font-bold text-pitch-600">{seasonData.wins}</p>
              </div>
              <Trophy className="h-10 w-10 text-pitch-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-leather-200 dark:border-leather-800 bg-gradient-to-br from-leather-50 to-transparent dark:from-leather-950/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Losses</p>
                <p className="text-4xl font-bold text-leather-600">{seasonData.losses}</p>
              </div>
              <Target className="h-10 w-10 text-leather-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Win Rate</p>
                <p className="text-4xl font-bold">{winRate}%</p>
              </div>
              <TrendingUp className="h-10 w-10 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-stumps-200 dark:border-stumps-800 bg-gradient-to-br from-stumps-50 to-transparent dark:from-stumps-950/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Position</p>
                <p className="text-4xl font-bold text-stumps-600">
                  {seasonData.currentPosition}
                  <span className="text-lg text-muted-foreground">/{seasonData.totalTeams}</span>
                </p>
              </div>
              <Medal className="h-10 w-10 text-stumps-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Points Table */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              League Standings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-sm text-muted-foreground">
                    <th className="text-left py-3 px-2">#</th>
                    <th className="text-left py-3 px-2">Team</th>
                    <th className="text-center py-3 px-2">P</th>
                    <th className="text-center py-3 px-2">W</th>
                    <th className="text-center py-3 px-2">L</th>
                    <th className="text-center py-3 px-2">D</th>
                    <th className="text-center py-3 px-2">NRR</th>
                    <th className="text-center py-3 px-2">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {pointsTable.map((team) => (
                    <tr 
                      key={team.team} 
                      className={cn(
                        'border-b transition-colors hover:bg-muted/50',
                        team.isUs && 'bg-pitch-50 dark:bg-pitch-950/30 font-medium'
                      )}
                    >
                      <td className="py-3 px-2">
                        <span className={cn(
                          'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                          team.position <= 4 
                            ? 'bg-pitch-100 text-pitch-700 dark:bg-pitch-900 dark:text-pitch-300' 
                            : 'bg-muted text-muted-foreground'
                        )}>
                          {team.position}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        {team.team}
                        {team.isUs && (
                          <Badge className="ml-2 text-[10px]" variant="success">You</Badge>
                        )}
                      </td>
                      <td className="text-center py-3 px-2">{team.played}</td>
                      <td className="text-center py-3 px-2 text-pitch-600 font-medium">{team.won}</td>
                      <td className="text-center py-3 px-2 text-leather-600">{team.lost}</td>
                      <td className="text-center py-3 px-2">{team.drawn}</td>
                      <td className={cn(
                        'text-center py-3 px-2 font-mono text-sm',
                        parseFloat(team.nrr) > 0 ? 'text-pitch-600' : 'text-leather-600'
                      )}>
                        {team.nrr}
                      </td>
                      <td className="text-center py-3 px-2 font-bold">{team.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
              <span className="font-medium">Qualification:</span> Top 4 teams qualify for knockouts
            </div>
          </CardContent>
        </Card>

        {/* Milestones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Medal className="h-5 w-5 text-stumps-500" />
              Season Milestones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {milestones.map((milestone, index) => (
              <div 
                key={index} 
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="text-2xl">{milestone.icon}</div>
                <div className="flex-1">
                  <p className="font-medium">{milestone.milestone}</p>
                  <p className="text-sm text-muted-foreground">{milestone.player}</p>
                </div>
                <div className="text-xs text-muted-foreground">
                  {milestone.date}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Remaining Fixtures */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Remaining Fixtures ({seasonData.totalMatches - seasonData.matchesPlayed})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { opponent: 'Thunder Hawks', date: 'Feb 8', venue: 'Riverside Ground', importance: 'MUST_WIN' },
              { opponent: 'Royal Strikers', date: 'Feb 15', venue: 'Central Park', importance: 'IMPORTANT' },
              { opponent: 'City Lions', date: 'Feb 22', venue: 'Heritage CC', importance: 'REGULAR' },
              { opponent: 'Storm Riders', date: 'Mar 1', venue: 'Green Valley', importance: 'MUST_WIN' },
              { opponent: 'Valley Knights', date: 'Mar 8', venue: 'Riverside Ground', importance: 'REGULAR' },
              { opponent: 'Metro Mavericks', date: 'Mar 15', venue: 'Metro Ground', importance: 'REGULAR' },
            ].map((fixture, index) => (
              <div 
                key={index}
                className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold">vs {fixture.opponent}</p>
                  <Badge 
                    variant={
                      fixture.importance === 'MUST_WIN' ? 'error' : 
                      fixture.importance === 'IMPORTANT' ? 'warning' : 'secondary'
                    }
                    className="text-[10px]"
                  >
                    {fixture.importance.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {fixture.date}
                  </p>
                  <p className="flex items-center gap-1">
                    <Target className="h-3 w-3" /> {fixture.venue}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

