'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
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
  TrendingDown,
  Trophy,
  Target,
  Activity,
  Calendar,
  Loader2,
  Heart,
  Zap,
  Users,
  AlertCircle,
  CheckCircle,
  Calculator,
  ShieldOff,
  Shield,
  Minus,
  Check
} from 'lucide-react'
import { getRoleColor, getFormColor, cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import { Switch } from '@/components/ui/switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const formOptions = [
  { value: 'UNKNOWN', label: 'Not Set', color: 'text-gray-500' },
  { value: 'EXCELLENT', label: 'Excellent', color: 'text-green-600' },
  { value: 'GOOD', label: 'Good', color: 'text-blue-600' },
  { value: 'AVERAGE', label: 'Average', color: 'text-amber-600' },
  { value: 'POOR', label: 'Poor', color: 'text-red-600' },
]

interface RatingHistoryItem {
  id: string
  skillType: string
  previousRating: number
  newRating: number
  changeAmount: number
  performanceScore: number | null
  reason: string | null
  createdAt: string
}

interface PlayerData {
  id: string
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
  // Commitment
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
  leaguePreferenceNotes: string | null
  // Team Status
  captainChoice: number
  isCaptain: boolean
  isViceCaptain: boolean
  isWicketkeeper: boolean
  isActive: boolean
  // AI Rating Management
  excludeFromAutoRating: boolean
  ratingExclusionReason: string | null
  lastRatingUpdate: string | null
  ratingHistory: RatingHistoryItem[]
  currentSeasonStats?: {
    matchesPlayed: number
    matchesAvailable: number
    runsScored: number
    wicketsTaken: number
    catches: number
    highestScore: number
    bestBowling: string | null
    currentForm: string
    battingAverage: number | null
    strikeRate: number | null
    economyRate: number | null
  } | null
}

export default function PlayerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { isAdmin } = useAuth()
  const playerId = params.id as string
  
  const [player, setPlayer] = useState<PlayerData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchPlayer()
  }, [playerId])

  const fetchPlayer = async () => {
    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query GetPlayer($id: ID!) {
              player(id: $id) {
                id
                name
                jerseyNumber
                primaryRole
                battingStyle
                bowlingStyle
                battingPosition
                battingSkill
                bowlingSkill
                fieldingSkill
                experienceLevel
                powerHitting
                runningBetweenWickets
                pressureHandling
                fitnessLevel
                currentInjuryStatus
                preferredFieldingPositions
                bowlingVariations
                reliabilityScore
                trainingAttendance
                previousTeams
                injuryHistory
                isRookie
                tennisBallBackground
                yearsPlaying
                availableForT20
                availableForT30
                leaguePreferenceNotes
                captainChoice
                isCaptain
                isViceCaptain
                isWicketkeeper
                isActive
                excludeFromAutoRating
                ratingExclusionReason
                lastRatingUpdate
                ratingHistory {
                  id
                  skillType
                  previousRating
                  newRating
                  changeAmount
                  performanceScore
                  reason
                  createdAt
                }
                currentSeasonStats {
                  matchesPlayed
                  matchesAvailable
                  runsScored
                  wicketsTaken
                  catches
                  highestScore
                  bestBowling
                  currentForm
                  battingAverage
                  strikeRate
                  economyRate
                }
              }
            }
          `,
          variables: { id: playerId }
        }),
      })

      const { data } = await response.json()
      setPlayer(data?.player || null)
    } catch (error) {
      console.error('Failed to fetch player:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

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

  const stats = player.currentSeasonStats || {
    matchesPlayed: 0,
    matchesAvailable: 0,
    runsScored: 0,
    wicketsTaken: 0,
    catches: 0,
    highestScore: 0,
    bestBowling: null,
    currentForm: 'AVERAGE',
    battingAverage: null,
    strikeRate: null,
    economyRate: null,
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
            <Button variant="outline" className="gap-2" onClick={() => router.push(`/players/${playerId}/edit`)}>
              <Edit className="h-4 w-4" />
              Edit
            </Button>
            <Button 
              variant="outline" 
              className="gap-2 text-red-600 hover:text-red-700"
              onClick={async () => {
                if (confirm(`Are you sure you want to delete ${player.name}?`)) {
                  try {
                    const response = await fetch('/api/graphql', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        query: `
                          mutation DeletePlayer($id: ID!) {
                            deletePlayer(id: $id)
                          }
                        `,
                        variables: { id: playerId }
                      }),
                    })
                    const result = await response.json()
                    if (result.errors) {
                      alert(result.errors[0].message)
                    } else {
                      router.push('/players')
                    }
                  } catch (error) {
                    alert('Failed to delete player')
                  }
                }
              }}
            >
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
                  {player.primaryRole.replace(/_/g, ' ')}
                </Badge>
                {isAdmin ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Badge 
                        className={cn(
                          getFormColor(stats.currentForm),
                          'cursor-pointer hover:opacity-80',
                          stats.currentForm === 'UNKNOWN' && 'bg-gray-100 text-gray-500 border border-dashed border-gray-300'
                        )}
                      >
                        {stats.currentForm === 'UNKNOWN' ? 'Set Form' : stats.currentForm}
                      </Badge>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center">
                      {formOptions.map((option) => (
                        <DropdownMenuItem
                          key={option.value}
                          className={cn('cursor-pointer', option.color)}
                          onClick={async () => {
                            try {
                              await fetch('/api/graphql', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  query: `
                                    mutation SetPlayerForm($playerId: String!, $form: PlayerForm!) {
                                      setPlayerForm(playerId: $playerId, form: $form) {
                                        currentForm
                                      }
                                    }
                                  `,
                                  variables: { playerId: player.id, form: option.value }
                                }),
                              })
                              fetchPlayer()
                            } catch (error) {
                              console.error('Failed to set form:', error)
                            }
                          }}
                        >
                          {option.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  stats.currentForm !== 'UNKNOWN' && (
                    <Badge className={getFormColor(stats.currentForm)}>
                      {stats.currentForm}
                    </Badge>
                  )
                )}
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
                {player.isRookie && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Rookie
                  </Badge>
                )}
                {player.tennisBallBackground && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    Tennis Ball Background
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

              {/* Extended Skills */}
              <div className="w-full pt-4 border-t space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground">Extended Skills</h4>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Power Hitting</span>
                    <span className="font-medium">{player.powerHitting}/10</span>
                  </div>
                  <Progress value={player.powerHitting * 10} className="h-2" indicatorClassName="bg-red-500" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Running B/W Wickets</span>
                    <span className="font-medium">{player.runningBetweenWickets}/10</span>
                  </div>
                  <Progress value={player.runningBetweenWickets * 10} className="h-2" indicatorClassName="bg-amber-500" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Pressure Handling</span>
                    <span className="font-medium">{player.pressureHandling}/10</span>
                  </div>
                  <Progress value={player.pressureHandling * 10} className="h-2" indicatorClassName="bg-purple-500" />
                </div>
              </div>

              {/* Physical & Commitment */}
              <div className="w-full pt-4 border-t space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground">Physical & Commitment</h4>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Fitness Level</span>
                    <span className="font-medium">{player.fitnessLevel}/10</span>
                  </div>
                  <Progress value={player.fitnessLevel * 10} className="h-2" indicatorClassName="bg-green-500" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Reliability</span>
                    <span className="font-medium">{player.reliabilityScore}/10</span>
                  </div>
                  <Progress value={player.reliabilityScore * 10} className="h-2" indicatorClassName="bg-teal-500" />
                </div>
                {player.trainingAttendance !== null && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Training Attendance</span>
                      <span className="font-medium">{player.trainingAttendance}%</span>
                    </div>
                    <Progress value={player.trainingAttendance} className="h-2" indicatorClassName="bg-indigo-500" />
                  </div>
                )}
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
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-3xl font-bold text-pitch-600">{stats.matchesPlayed}</p>
                <p className="text-sm text-muted-foreground">Matches Played</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-3xl font-bold">{stats.runsScored}</p>
                <p className="text-sm text-muted-foreground">Runs Scored</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-3xl font-bold">{stats.wicketsTaken}</p>
                <p className="text-sm text-muted-foreground">Wickets</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-3xl font-bold">{stats.catches}</p>
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
                      <p className="text-xl font-bold">{stats.highestScore}</p>
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
                      <p className="text-xl font-bold">{stats.bestBowling || '-'}</p>
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
                      <p className="text-xl font-bold">{stats.battingAverage?.toFixed(1) || '-'}</p>
                      <p className="text-xs text-muted-foreground">Batting Avg</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center p-3 border rounded-lg">
                <p className="text-lg font-semibold">{stats.strikeRate?.toFixed(1) || '-'}</p>
                <p className="text-xs text-muted-foreground">Strike Rate</p>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <p className="text-lg font-semibold">{stats.economyRate && stats.economyRate > 0 ? stats.economyRate.toFixed(1) : '-'}</p>
                <p className="text-xs text-muted-foreground">Economy</p>
              </div>
              <div className="text-center p-3 border rounded-lg">
                <p className="text-lg font-semibold">{stats.matchesAvailable > 0 ? Math.round(stats.matchesPlayed / stats.matchesAvailable * 100) : 0}%</p>
                <p className="text-xs text-muted-foreground">Availability</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Injury Status & Detailed Skills */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Injury Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Health & Fitness
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              {player.currentInjuryStatus === 'FIT' ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : player.currentInjuryStatus === 'INJURED' ? (
                <AlertCircle className="h-6 w-6 text-red-500" />
              ) : (
                <AlertCircle className="h-6 w-6 text-amber-500" />
              )}
              <div>
                <p className="font-medium">
                  {player.currentInjuryStatus === 'FIT' ? 'Fully Fit' :
                   player.currentInjuryStatus === 'MINOR_NIGGLE' ? 'Minor Niggle' :
                   player.currentInjuryStatus === 'RECOVERING' ? 'Recovering' : 'Injured'}
                </p>
                <p className="text-sm text-muted-foreground">Current Status</p>
              </div>
            </div>

            {player.injuryHistory.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Injury History</h4>
                <div className="space-y-2">
                  {player.injuryHistory.map((injury, index) => (
                    <div key={index} className="text-sm p-2 bg-red-50 dark:bg-red-900/20 rounded-md">
                      {injury}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Previous Teams */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Career History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {player.yearsPlaying !== null && (
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <span className="text-2xl font-bold text-pitch-600">{player.yearsPlaying}</span>
                <span className="text-sm text-muted-foreground">years playing cricket</span>
              </div>
            )}
            
            <div className="flex flex-wrap gap-2">
              {player.isRookie && (
                <Badge className="bg-blue-100 text-blue-700">New to Leather Ball</Badge>
              )}
              {player.tennisBallBackground && (
                <Badge className="bg-amber-100 text-amber-700">Tennis Ball Experience</Badge>
              )}
            </div>

            {player.previousTeams.length > 0 ? (
              <div>
                <h4 className="text-sm font-medium mb-2">Previous Teams</h4>
                <div className="flex flex-wrap gap-2">
                  {player.previousTeams.map((team, index) => (
                    <Badge key={index} variant="secondary">
                      {team}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No previous teams listed</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* League Format Availability */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            League Format Availability
          </CardTitle>
          <CardDescription>Which league formats this player is available for this season</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className={`flex items-center gap-3 px-5 py-3 rounded-lg border-2 ${player.availableForT20 ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200 opacity-60'}`}>
              <div className={`w-4 h-4 rounded-full ${player.availableForT20 ? 'bg-green-500' : 'bg-gray-400'}`} />
              <div>
                <span className={`font-semibold text-lg ${player.availableForT20 ? 'text-green-700' : 'text-gray-500'}`}>T20 League</span>
                <p className={`text-sm ${player.availableForT20 ? 'text-green-600' : 'text-gray-400'}`}>
                  {player.availableForT20 ? 'Available' : 'Not Available'}
                </p>
              </div>
              {player.availableForT20 && <Check className="h-5 w-5 text-green-600 ml-2" />}
            </div>
            <div className={`flex items-center gap-3 px-5 py-3 rounded-lg border-2 ${player.availableForT30 ? 'bg-purple-50 border-purple-300' : 'bg-gray-50 border-gray-200 opacity-60'}`}>
              <div className={`w-4 h-4 rounded-full ${player.availableForT30 ? 'bg-purple-500' : 'bg-gray-400'}`} />
              <div>
                <span className={`font-semibold text-lg ${player.availableForT30 ? 'text-purple-700' : 'text-gray-500'}`}>T30 League</span>
                <p className={`text-sm ${player.availableForT30 ? 'text-purple-600' : 'text-gray-400'}`}>
                  {player.availableForT30 ? 'Available' : 'Not Available'}
                </p>
              </div>
              {player.availableForT30 && <Check className="h-5 w-5 text-purple-600 ml-2" />}
            </div>
          </div>
          {player.leaguePreferenceNotes && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium text-muted-foreground mb-1">Notes</p>
              <p className="text-sm">{player.leaguePreferenceNotes}</p>
            </div>
          )}
          {!player.availableForT20 && !player.availableForT30 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-medium">This player is not available for any league format this season.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fielding Positions & Bowling Variations */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Preferred Fielding Positions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Preferred Fielding Positions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {player.preferredFieldingPositions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {player.preferredFieldingPositions.map((position, index) => (
                  <Badge key={index} variant="outline" className="bg-pitch-50 dark:bg-pitch-900/30">
                    {position}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No preferred positions set</p>
            )}
          </CardContent>
        </Card>

        {/* Bowling Variations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Bowling Variations
            </CardTitle>
          </CardHeader>
          <CardContent>
            {player.bowlingVariations.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {player.bowlingVariations.map((variation, index) => (
                  <Badge key={index} variant="outline" className="bg-leather-50 dark:bg-leather-900/30">
                    {variation}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No bowling variations listed</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Rating History */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                AI Rating History
              </CardTitle>
              <CardDescription>
                Skill ratings updated based on match performances
                {player.lastRatingUpdate && (
                  <span className="block sm:inline sm:ml-2">
                    • Last updated: {new Date(player.lastRatingUpdate).toLocaleDateString()}
                  </span>
                )}
              </CardDescription>
            </div>
            
            {isAdmin && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="flex-1">
                  <p className="text-sm font-medium flex items-center gap-2">
                    {player.excludeFromAutoRating ? (
                      <><ShieldOff className="h-4 w-4 text-amber-500" /> Excluded from AI Updates</>
                    ) : (
                      <><Shield className="h-4 w-4 text-green-500" /> AI Updates Enabled</>
                    )}
                  </p>
                  {player.ratingExclusionReason && (
                    <p className="text-xs text-muted-foreground">{player.ratingExclusionReason}</p>
                  )}
                </div>
                <Switch
                  checked={!player.excludeFromAutoRating}
                  onCheckedChange={async (checked) => {
                    try {
                      await fetch('/api/graphql', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          query: `
                            mutation UpdateExclusion($playerId: String!, $exclude: Boolean!) {
                              updatePlayerRatingExclusion(playerId: $playerId, exclude: $exclude) {
                                id
                                excludeFromAutoRating
                              }
                            }
                          `,
                          variables: { playerId: player.id, exclude: !checked }
                        }),
                      })
                      // Refresh player data
                      fetchPlayer()
                    } catch (error) {
                      console.error('Failed to update exclusion:', error)
                    }
                  }}
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {player.ratingHistory && player.ratingHistory.length > 0 ? (
            <div className="space-y-3">
              {player.ratingHistory.slice(0, 10).map((item) => {
                const isPositive = item.changeAmount > 0
                const isNegative = item.changeAmount < 0
                
                return (
                  <div 
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className={cn(
                      "p-2 rounded-full",
                      isPositive ? "bg-green-100 dark:bg-green-900/30" :
                      isNegative ? "bg-red-100 dark:bg-red-900/30" :
                      "bg-gray-100 dark:bg-gray-800"
                    )}>
                      {isPositive ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : isNegative ? (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      ) : (
                        <Minus className="h-4 w-4 text-gray-500" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {item.skillType.replace(/_/g, ' ')}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {item.previousRating} → {item.newRating}
                        </span>
                        <span className={cn(
                          "text-xs font-semibold",
                          isPositive ? "text-green-600" :
                          isNegative ? "text-red-600" :
                          "text-muted-foreground"
                        )}>
                          ({isPositive ? '+' : ''}{item.changeAmount})
                        </span>
                      </div>
                      {item.reason && (
                        <p className="text-xs text-muted-foreground truncate">{item.reason}</p>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                      {item.performanceScore !== null && (
                        <p className="text-xs text-muted-foreground">
                          Score: {item.performanceScore.toFixed(1)}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calculator className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No rating updates yet.</p>
              <p className="text-sm mt-1">Ratings will be updated based on match performances.</p>
            </div>
          )}
        </CardContent>
      </Card>

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
