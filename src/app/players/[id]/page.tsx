'use client'

import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  ArrowLeft,
  Edit,
  Trash2,
  Star,
  TrendingUp,
  Trophy,
  Target,
  Activity,
  Calendar
} from 'lucide-react'
import { cn, getRoleColor, getFormColor } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'

// Mock data - would come from GraphQL in production
const playersData: Record<string, {
  id: string
  name: string
  jerseyNumber: number
  primaryRole: string
  battingStyle: string
  bowlingStyle: string
  battingPosition: string
  battingSkill: number
  bowlingSkill: number
  fieldingSkill: number
  experienceLevel: number
  captainChoice: number
  isCaptain: boolean
  isViceCaptain?: boolean
  isWicketkeeper?: boolean
  currentForm: string
  matchesPlayed: number
  matchesAvailable: number
  runsScored: number
  wicketsTaken: number
  catches: number
  highestScore: number
  bestBowling: string
  average: number
  strikeRate: number
  economy: number
}> = {
  '1': {
    id: '1',
    name: 'Raj Kumar',
    jerseyNumber: 7,
    primaryRole: 'BATSMAN',
    battingStyle: 'RIGHT_HAND',
    bowlingStyle: 'MEDIUM',
    battingPosition: 'TOP_ORDER',
    battingSkill: 9,
    bowlingSkill: 4,
    fieldingSkill: 8,
    experienceLevel: 9,
    captainChoice: 1,
    isCaptain: true,
    currentForm: 'EXCELLENT',
    matchesPlayed: 6,
    matchesAvailable: 6,
    runsScored: 285,
    wicketsTaken: 0,
    catches: 4,
    highestScore: 78,
    bestBowling: '-',
    average: 47.5,
    strikeRate: 135.2,
    economy: 0,
  },
  '2': {
    id: '2',
    name: 'Amit Singh',
    jerseyNumber: 11,
    primaryRole: 'ALL_ROUNDER',
    battingStyle: 'LEFT_HAND',
    bowlingStyle: 'SPIN_OFF',
    battingPosition: 'MIDDLE_ORDER',
    battingSkill: 7,
    bowlingSkill: 8,
    fieldingSkill: 7,
    experienceLevel: 7,
    captainChoice: 1,
    isCaptain: false,
    currentForm: 'GOOD',
    matchesPlayed: 5,
    matchesAvailable: 6,
    runsScored: 145,
    wicketsTaken: 8,
    catches: 3,
    highestScore: 45,
    bestBowling: '3/22',
    average: 29.0,
    strikeRate: 118.5,
    economy: 6.8,
  },
  '3': {
    id: '3',
    name: 'Vikram Patel',
    jerseyNumber: 45,
    primaryRole: 'BOWLER',
    battingStyle: 'RIGHT_HAND',
    bowlingStyle: 'FAST',
    battingPosition: 'LOWER_ORDER',
    battingSkill: 3,
    bowlingSkill: 9,
    fieldingSkill: 6,
    experienceLevel: 8,
    captainChoice: 1,
    isCaptain: false,
    currentForm: 'EXCELLENT',
    matchesPlayed: 6,
    matchesAvailable: 6,
    runsScored: 15,
    wicketsTaken: 12,
    catches: 2,
    highestScore: 8,
    bestBowling: '4/18',
    average: 5.0,
    strikeRate: 75.0,
    economy: 5.2,
  },
  '4': {
    id: '4',
    name: 'Suresh Menon',
    jerseyNumber: 1,
    primaryRole: 'WICKETKEEPER',
    battingStyle: 'RIGHT_HAND',
    bowlingStyle: 'NONE',
    battingPosition: 'MIDDLE_ORDER',
    battingSkill: 7,
    bowlingSkill: 1,
    fieldingSkill: 9,
    experienceLevel: 8,
    captainChoice: 1,
    isCaptain: false,
    isWicketkeeper: true,
    currentForm: 'GOOD',
    matchesPlayed: 6,
    matchesAvailable: 6,
    runsScored: 168,
    wicketsTaken: 0,
    catches: 8,
    highestScore: 52,
    bestBowling: '-',
    average: 33.6,
    strikeRate: 122.3,
    economy: 0,
  },
  '5': {
    id: '5',
    name: 'Karthik Nair',
    jerseyNumber: 23,
    primaryRole: 'BATSMAN',
    battingStyle: 'RIGHT_HAND',
    bowlingStyle: 'MEDIUM',
    battingPosition: 'OPENER',
    battingSkill: 8,
    bowlingSkill: 3,
    fieldingSkill: 7,
    experienceLevel: 6,
    captainChoice: 2,
    isCaptain: false,
    currentForm: 'AVERAGE',
    matchesPlayed: 2,
    matchesAvailable: 6,
    runsScored: 35,
    wicketsTaken: 0,
    catches: 1,
    highestScore: 22,
    bestBowling: '-',
    average: 17.5,
    strikeRate: 95.0,
    economy: 0,
  },
  '6': {
    id: '6',
    name: 'Pradeep Iyer',
    jerseyNumber: 18,
    primaryRole: 'BATSMAN',
    battingStyle: 'LEFT_HAND',
    bowlingStyle: 'SPIN_LEG',
    battingPosition: 'OPENER',
    battingSkill: 8,
    bowlingSkill: 4,
    fieldingSkill: 6,
    experienceLevel: 7,
    captainChoice: 1,
    isCaptain: false,
    currentForm: 'EXCELLENT',
    matchesPlayed: 5,
    matchesAvailable: 6,
    runsScored: 198,
    wicketsTaken: 1,
    catches: 2,
    highestScore: 65,
    bestBowling: '1/12',
    average: 39.6,
    strikeRate: 142.1,
    economy: 8.5,
  },
}

export default function PlayerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { isAdmin } = useAuth()
  const playerId = params.id as string
  
  const player = playersData[playerId]

  if (!player) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <h1 className="text-2xl font-bold">Player Not Found</h1>
        <p className="text-muted-foreground">The player you're looking for doesn't exist.</p>
        <Button onClick={() => router.push('/players')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Players
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/players')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{player.name}</h1>
          <p className="text-muted-foreground">
            #{player.jerseyNumber} • {player.battingStyle.replace('_', '-')} • {player.battingPosition.replace('_', ' ')}
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Edit className="h-4 w-4" />
              Edit
            </Button>
            <Button variant="outline" className="gap-2 text-red-600 hover:text-red-700">
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Profile Card */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarFallback className="bg-gradient-to-br from-pitch-400 to-pitch-600 text-white text-2xl font-semibold">
                  {player.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                <Badge className={getRoleColor(player.primaryRole)}>
                  {player.primaryRole.replace('_', ' ')}
                </Badge>
                <Badge className={getFormColor(player.currentForm)}>
                  {player.currentForm}
                </Badge>
                {player.isCaptain && (
                  <Badge variant="warning">Captain</Badge>
                )}
                {player.isViceCaptain && (
                  <Badge variant="outline">Vice Captain</Badge>
                )}
                {player.isWicketkeeper && (
                  <Badge variant="secondary">Wicketkeeper</Badge>
                )}
                {player.captainChoice === 1 && (
                  <Badge variant="outline" className="gap-1">
                    <Star className="h-3 w-3" /> 1st Choice
                  </Badge>
                )}
              </div>

              <div className="w-full space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Batting</span>
                    <span className="font-medium">{player.battingSkill}/10</span>
                  </div>
                  <Progress value={player.battingSkill * 10} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Bowling</span>
                    <span className="font-medium">{player.bowlingSkill}/10</span>
                  </div>
                  <Progress value={player.bowlingSkill * 10} className="h-2" indicatorClassName="bg-leather-500" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Fielding</span>
                    <span className="font-medium">{player.fieldingSkill}/10</span>
                  </div>
                  <Progress value={player.fieldingSkill * 10} className="h-2" indicatorClassName="bg-stumps-500" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Experience</span>
                    <span className="font-medium">{player.experienceLevel}/10</span>
                  </div>
                  <Progress value={player.experienceLevel * 10} className="h-2" indicatorClassName="bg-blue-500" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Season Stats */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Season Statistics
            </CardTitle>
            <CardDescription>Performance in current season</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-3xl font-bold text-pitch-600">{player.matchesPlayed}</p>
                <p className="text-sm text-muted-foreground">Matches Played</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-3xl font-bold">{player.runsScored}</p>
                <p className="text-sm text-muted-foreground">Runs Scored</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-3xl font-bold">{player.wicketsTaken}</p>
                <p className="text-sm text-muted-foreground">Wickets</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-3xl font-bold">{player.catches}</p>
                <p className="text-sm text-muted-foreground">Catches</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-pitch-100 dark:bg-pitch-900">
                      <Target className="h-4 w-4 text-pitch-600" />
                    </div>
                    <div>
                      <p className="text-xl font-bold">{player.highestScore}</p>
                      <p className="text-xs text-muted-foreground">Highest Score</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-leather-100 dark:bg-leather-900">
                      <Activity className="h-4 w-4 text-leather-600" />
                    </div>
                    <div>
                      <p className="text-xl font-bold">{player.bestBowling}</p>
                      <p className="text-xs text-muted-foreground">Best Bowling</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xl font-bold">{player.average.toFixed(1)}</p>
                      <p className="text-xs text-muted-foreground">Batting Avg</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center p-3 border rounded-lg">
                <p className="text-lg font-semibold">{player.strikeRate.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Strike Rate</p>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <p className="text-lg font-semibold">{player.economy > 0 ? player.economy.toFixed(1) : '-'}</p>
                <p className="text-xs text-muted-foreground">Economy</p>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <p className="text-lg font-semibold">{Math.round(player.matchesPlayed / player.matchesAvailable * 100)}%</p>
                <p className="text-xs text-muted-foreground">Availability</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Performances */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Recent Performances
          </CardTitle>
          <CardDescription>Last 5 match performances</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No match performance data available yet.</p>
            <p className="text-sm mt-1">Performance data will appear here once matches are played.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
