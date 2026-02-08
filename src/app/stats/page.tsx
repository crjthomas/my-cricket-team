'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Trophy,
  Target,
  TrendingUp,
  Users,
  Award
} from 'lucide-react'
import { cn, getFormColor } from '@/lib/utils'

// Mock data
const battingLeaders = [
  { name: 'Raj Kumar', runs: 285, innings: 6, average: 47.5, strikeRate: 135.7, form: 'EXCELLENT' },
  { name: 'Pradeep Iyer', runs: 198, innings: 5, average: 49.5, strikeRate: 120.0, form: 'EXCELLENT' },
  { name: 'Suresh Menon', runs: 168, innings: 5, average: 42.0, strikeRate: 129.2, form: 'GOOD' },
  { name: 'Amit Shah', runs: 165, innings: 4, average: 55.0, strikeRate: 113.8, form: 'GOOD' },
  { name: 'Amit Singh', runs: 145, innings: 4, average: 36.3, strikeRate: 148.0, form: 'GOOD' },
]

const bowlingLeaders = [
  { name: 'Vikram Patel', wickets: 12, overs: 28, economy: 6.0, average: 14.0, form: 'EXCELLENT' },
  { name: 'Amit Singh', wickets: 8, overs: 24, economy: 6.5, average: 19.5, form: 'GOOD' },
  { name: 'Arjun Das', wickets: 8, overs: 18, economy: 6.0, average: 13.5, form: 'EXCELLENT' },
  { name: 'Sanjay Rao', wickets: 7, overs: 22, economy: 6.6, average: 20.7, form: 'GOOD' },
  { name: 'Rahul Menon', wickets: 6, overs: 20, economy: 6.3, average: 20.8, form: 'GOOD' },
]

const fieldingLeaders = [
  { name: 'Suresh Menon', catches: 8, stumpings: 3, runOuts: 1, total: 12 },
  { name: 'Raj Kumar', catches: 4, stumpings: 0, runOuts: 2, total: 6 },
  { name: 'Ravi Sharma', catches: 4, stumpings: 0, runOuts: 1, total: 5 },
  { name: 'Amit Singh', catches: 3, stumpings: 0, runOuts: 1, total: 4 },
  { name: 'Rahul Menon', catches: 3, stumpings: 0, runOuts: 0, total: 3 },
]

const teamStats = {
  matchesPlayed: 6,
  wins: 4,
  losses: 1,
  draws: 1,
  totalRuns: 952,
  totalWickets: 48,
  avgFirstInnings: 165,
  highestScore: '198/4',
  lowestScore: '145/8',
}

export default function StatsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Statistics</h1>
        <p className="text-muted-foreground mt-1">
          Season performance and player statistics
        </p>
      </div>

      {/* Team Overview */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-pitch-600">{teamStats.wins}</p>
            <p className="text-sm text-muted-foreground">Wins</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-leather-600">{teamStats.losses}</p>
            <p className="text-sm text-muted-foreground">Losses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-amber-600">{teamStats.draws}</p>
            <p className="text-sm text-muted-foreground">Draws</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{teamStats.totalRuns}</p>
            <p className="text-sm text-muted-foreground">Total Runs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{teamStats.totalWickets}</p>
            <p className="text-sm text-muted-foreground">Wickets Taken</p>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboards */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Batting */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-stumps-500" />
              Batting Leaders
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {battingLeaders.map((player, index) => (
              <div key={player.name} className="flex items-center gap-3">
                <div className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm',
                  index === 0 ? 'bg-stumps-500 text-white' : 'bg-muted text-muted-foreground'
                )}>
                  {index + 1}
                </div>
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white text-sm">
                    {player.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{player.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Avg: {player.average} • SR: {player.strikeRate}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{player.runs}</p>
                  <Badge className={cn('text-[10px]', getFormColor(player.form))}>
                    {player.form}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Bowling */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-leather-500" />
              Bowling Leaders
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {bowlingLeaders.map((player, index) => (
              <div key={player.name} className="flex items-center gap-3">
                <div className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm',
                  index === 0 ? 'bg-leather-500 text-white' : 'bg-muted text-muted-foreground'
                )}>
                  {index + 1}
                </div>
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gradient-to-br from-red-400 to-red-600 text-white text-sm">
                    {player.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{player.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Eco: {player.economy} • Avg: {player.average}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{player.wickets}</p>
                  <Badge className={cn('text-[10px]', getFormColor(player.form))}>
                    {player.form}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Fielding */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5 text-pitch-500" />
              Fielding Leaders
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {fieldingLeaders.map((player, index) => (
              <div key={player.name} className="flex items-center gap-3">
                <div className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm',
                  index === 0 ? 'bg-pitch-500 text-white' : 'bg-muted text-muted-foreground'
                )}>
                  {index + 1}
                </div>
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-gradient-to-br from-green-400 to-green-600 text-white text-sm">
                    {player.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{player.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Ct: {player.catches} • St: {player.stumpings} • RO: {player.runOuts}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{player.total}</p>
                  <p className="text-xs text-muted-foreground">dismissals</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Opportunity Tracker */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            Playing Opportunity Tracker
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Track fair distribution of playing time across the squad
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: 'Raj Kumar', played: 6, available: 6 },
              { name: 'Vikram Patel', played: 6, available: 6 },
              { name: 'Suresh Menon', played: 6, available: 6 },
              { name: 'Pradeep Iyer', played: 5, available: 6 },
              { name: 'Amit Singh', played: 5, available: 6 },
              { name: 'Sanjay Rao', played: 5, available: 6 },
              { name: 'Ravi Sharma', played: 5, available: 6 },
              { name: 'Amit Shah', played: 4, available: 6 },
              { name: 'Dinesh Kumar', played: 4, available: 5 },
              { name: 'Arjun Das', played: 4, available: 4 },
              { name: 'Rahul Menon', played: 4, available: 6 },
              { name: 'Anand Pillai', played: 3, available: 5 },
              { name: 'Mohit Verma', played: 3, available: 6 },
              { name: 'Karthik Nair', played: 2, available: 6 },
            ].map((player) => {
              const ratio = player.played / player.available
              const status = ratio >= 0.8 ? 'good' : ratio >= 0.6 ? 'ok' : 'needs-games'
              
              return (
                <div key={player.name} className="flex items-center gap-4">
                  <div className="w-32 truncate">
                    <p className="font-medium text-sm">{player.name}</p>
                  </div>
                  <div className="flex-1">
                    <Progress 
                      value={ratio * 100} 
                      className="h-2"
                      indicatorClassName={cn(
                        status === 'good' ? 'bg-pitch-500' :
                        status === 'ok' ? 'bg-amber-500' : 'bg-leather-500'
                      )}
                    />
                  </div>
                  <div className="w-16 text-right">
                    <p className="text-sm font-medium">{player.played}/{player.available}</p>
                  </div>
                  <div className="w-16 text-right">
                    <p className={cn(
                      'text-sm font-medium',
                      status === 'good' ? 'text-pitch-600' :
                      status === 'ok' ? 'text-amber-600' : 'text-leather-600'
                    )}>
                      {Math.round(ratio * 100)}%
                    </p>
                  </div>
                  <Badge 
                    variant={status === 'good' ? 'success' : status === 'ok' ? 'warning' : 'error'}
                    className="w-24 justify-center"
                  >
                    {status === 'good' ? 'On Track' : status === 'ok' ? 'Below Target' : 'Needs Games'}
                  </Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

