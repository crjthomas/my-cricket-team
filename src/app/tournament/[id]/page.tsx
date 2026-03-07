'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { usePermissions } from '@/lib/auth-context'
import { 
  ArrowLeft,
  CalendarClock, 
  Users, 
  MapPin, 
  Trophy,
  Loader2,
  Calendar,
  Sparkles,
  Plus,
  Settings,
  BarChart3,
  Play,
  CheckCircle2,
  Clock,
  AlertCircle,
  Edit,
  Trash2,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TournamentTeam {
  id: string
  teamName: string
  shortName: string | null
  points: number
  buchholzScore: number
  wins: number
  losses: number
  draws: number
  isConfirmed: boolean
  isWithdrawn: boolean
  seedRank: number | null
  groupName: string | null
}

interface TournamentFixture {
  id: string
  fixtureNumber: number | null
  scheduledDate: string | null
  scheduledTime: string | null
  status: string
  homeTeam: { id: string; teamName: string; shortName: string | null } | null
  awayTeam: { id: string; teamName: string; shortName: string | null } | null
  homePlaceholder: string | null
  awayPlaceholder: string | null
  homeScore: string | null
  awayScore: string | null
  winner: { id: string; teamName: string } | null
  groundSlot: { venue: { name: string } } | null
}

interface TournamentRound {
  id: string
  roundNumber: number
  roundName: string | null
  roundType: string
  status: string
  fixtures: TournamentFixture[]
}

interface Tournament {
  id: string
  name: string
  description: string | null
  startDate: string
  endDate: string | null
  status: string
  formatType: string
  totalRounds: number | null
  matchFormat: string
  overs: number
  matchesPerDay: number
  teams: TournamentTeam[]
  rounds: TournamentRound[]
}

export default function TournamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { canManageTournaments } = usePermissions()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'teams' | 'fixtures' | 'standings'>('overview')
  const [showAddTeam, setShowAddTeam] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [isAddingTeam, setIsAddingTeam] = useState(false)

  useEffect(() => {
    fetchTournament()
  }, [resolvedParams.id])

  const fetchTournament = async () => {
    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query GetTournament($id: ID!) {
              tournament(id: $id) {
                id
                name
                description
                startDate
                endDate
                status
                formatType
                totalRounds
                matchFormat
                overs
                matchesPerDay
                teams {
                  id
                  teamName
                  shortName
                  points
                  buchholzScore
                  wins
                  losses
                  draws
                  isConfirmed
                  isWithdrawn
                  seedRank
                  groupName
                }
                rounds {
                  id
                  roundNumber
                  roundName
                  roundType
                  status
                  fixtures {
                    id
                    fixtureNumber
                    scheduledDate
                    scheduledTime
                    status
                    homeTeam { id teamName shortName }
                    awayTeam { id teamName shortName }
                    homePlaceholder
                    awayPlaceholder
                    homeScore
                    awayScore
                    winner { id teamName }
                    groundSlot { venue { name } }
                  }
                }
              }
            }
          `,
          variables: { id: resolvedParams.id }
        })
      })
      
      const { data } = await response.json()
      if (data?.tournament) {
        setTournament(data.tournament)
      }
    } catch (error) {
      console.error('Failed to fetch tournament:', error)
    } finally {
      setLoading(false)
    }
  }

  const addTeam = async () => {
    if (!newTeamName.trim()) return
    
    setIsAddingTeam(true)
    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation AddTeam($input: AddTournamentTeamInput!) {
              addTournamentTeam(input: $input) {
                id
                teamName
              }
            }
          `,
          variables: {
            input: {
              tournamentId: resolvedParams.id,
              teamName: newTeamName.trim()
            }
          }
        })
      })
      
      const { data } = await response.json()
      if (data?.addTournamentTeam) {
        setNewTeamName('')
        setShowAddTeam(false)
        fetchTournament()
      }
    } catch (error) {
      console.error('Failed to add team:', error)
    } finally {
      setIsAddingTeam(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="outline" className="bg-gray-100 text-gray-700">Draft</Badge>
      case 'REGISTRATION_OPEN':
        return <Badge className="bg-blue-100 text-blue-700">Registration Open</Badge>
      case 'REGISTRATION_CLOSED':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-700">Registration Closed</Badge>
      case 'SCHEDULING':
        return <Badge className="bg-purple-100 text-purple-700">Scheduling</Badge>
      case 'IN_PROGRESS':
        return <Badge className="bg-green-100 text-green-700">In Progress</Badge>
      case 'COMPLETED':
        return <Badge variant="outline" className="bg-emerald-100 text-emerald-700">Completed</Badge>
      case 'CANCELLED':
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getFormatLabel = (format: string) => {
    switch (format) {
      case 'SWISS': return 'Swiss System'
      case 'KNOCKOUT': return 'Knockout'
      case 'ROUND_ROBIN': return 'Round Robin'
      case 'GROUP_STAGE_KNOCKOUT': return 'Groups + Knockout'
      case 'DOUBLE_ELIMINATION': return 'Double Elimination'
      default: return format
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Tournament Not Found</h2>
        <Button variant="outline" onClick={() => router.push('/tournament')}>
          Back to Tournaments
        </Button>
      </div>
    )
  }

  const sortedTeams = [...tournament.teams]
    .filter(t => !t.isWithdrawn)
    .sort((a, b) => {
      if (a.points !== b.points) return b.points - a.points
      if (a.buchholzScore !== b.buchholzScore) return b.buchholzScore - a.buchholzScore
      return b.wins - a.wins
    })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/tournament')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{tournament.name}</h1>
            {getStatusBadge(tournament.status)}
          </div>
          <p className="text-muted-foreground mt-1">
            {getFormatLabel(tournament.formatType)} • {tournament.matchFormat} ({tournament.overs} overs)
          </p>
        </div>
        {canManageTournaments && (
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
            <Button className="gap-2">
              <Sparkles className="h-4 w-4" />
              AI Schedule
            </Button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tournament.teams.length}</p>
                <p className="text-sm text-muted-foreground">Teams</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <RefreshCw className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tournament.rounds.length}</p>
                <p className="text-sm text-muted-foreground">Rounds</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {tournament.rounds.flatMap(r => r.fixtures).filter(f => f.status === 'COMPLETED').length}
                </p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {tournament.rounds.flatMap(r => r.fixtures).filter(f => f.status === 'SCHEDULED').length}
                </p>
                <p className="text-sm text-muted-foreground">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {(['overview', 'teams', 'fixtures', 'standings'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors",
              activeTab === tab
                ? "border-b-2 border-cyan-500 text-cyan-600"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Tournament Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Start Date</span>
                <span>{new Date(tournament.startDate).toLocaleDateString()}</span>
              </div>
              {tournament.endDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">End Date</span>
                  <span>{new Date(tournament.endDate).toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Format</span>
                <span>{getFormatLabel(tournament.formatType)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Rounds</span>
                <span>{tournament.totalRounds || 'TBD'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Matches per Day</span>
                <span>{tournament.matchesPerDay}</span>
              </div>
              {tournament.description && (
                <div className="pt-3 border-t">
                  <p className="text-sm text-muted-foreground">{tournament.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {canManageTournaments && (
                <>
                  <Button className="w-full justify-start gap-2" variant="outline">
                    <Users className="h-4 w-4" />
                    Manage Teams
                  </Button>
                  <Button className="w-full justify-start gap-2" variant="outline">
                    <MapPin className="h-4 w-4" />
                    Manage Ground Slots
                  </Button>
                  <Button className="w-full justify-start gap-2" variant="outline">
                    <Calendar className="h-4 w-4" />
                    Generate Schedule
                  </Button>
                  <Button className="w-full justify-start gap-2 bg-cyan-50 text-cyan-700 hover:bg-cyan-100">
                    <Sparkles className="h-4 w-4" />
                    AI Swiss Pairing
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'teams' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Registered Teams ({tournament.teams.length})</CardTitle>
            {canManageTournaments && (
              <Button size="sm" onClick={() => setShowAddTeam(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Team
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {showAddTeam && (
              <div className="flex gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="Team name..."
                  className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  onKeyDown={(e) => e.key === 'Enter' && addTeam()}
                />
                <Button onClick={addTeam} disabled={isAddingTeam}>
                  {isAddingTeam ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
                </Button>
                <Button variant="ghost" onClick={() => setShowAddTeam(false)}>Cancel</Button>
              </div>
            )}
            
            <div className="space-y-2">
              {tournament.teams.map((team, index) => (
                <div
                  key={team.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg",
                    team.isWithdrawn ? "bg-red-50" : "bg-gray-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold text-gray-400 w-6">
                      {team.seedRank || index + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{team.teamName}</span>
                        {team.shortName && (
                          <span className="text-sm text-muted-foreground">({team.shortName})</span>
                        )}
                        {team.isConfirmed && (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                        {team.isWithdrawn && (
                          <Badge variant="destructive" className="text-xs">Withdrawn</Badge>
                        )}
                      </div>
                      {team.groupName && (
                        <span className="text-xs text-muted-foreground">{team.groupName}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-medium">{team.points} pts</span>
                    <span className="text-muted-foreground">W{team.wins}-L{team.losses}-D{team.draws}</span>
                  </div>
                </div>
              ))}
              
              {tournament.teams.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No teams registered yet
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'fixtures' && (
        <div className="space-y-4">
          {tournament.rounds.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Fixtures Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Generate fixtures using AI-powered Swiss pairing or create them manually.
                </p>
                {canManageTournaments && (
                  <Button className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Generate Fixtures
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            tournament.rounds.map((round) => (
              <Card key={round.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Round {round.roundNumber}{round.roundName ? `: ${round.roundName}` : ''}</span>
                    <Badge variant="outline">{round.status}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {round.fixtures.map((fixture) => (
                      <div
                        key={fixture.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground w-8">
                            #{fixture.fixtureNumber}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "font-medium",
                              fixture.winner?.id === fixture.homeTeam?.id && "text-green-600"
                            )}>
                              {fixture.homeTeam?.teamName || fixture.homePlaceholder || 'TBD'}
                            </span>
                            {fixture.homeScore && (
                              <span className="text-sm font-semibold">{fixture.homeScore}</span>
                            )}
                          </div>
                          <span className="text-muted-foreground">vs</span>
                          <div className="flex items-center gap-2">
                            {fixture.awayScore && (
                              <span className="text-sm font-semibold">{fixture.awayScore}</span>
                            )}
                            <span className={cn(
                              "font-medium",
                              fixture.winner?.id === fixture.awayTeam?.id && "text-green-600"
                            )}>
                              {fixture.awayTeam?.teamName || fixture.awayPlaceholder || 'TBD'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          {fixture.groundSlot && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {fixture.groundSlot.venue.name}
                            </span>
                          )}
                          {fixture.scheduledDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(fixture.scheduledDate).toLocaleDateString()}
                            </span>
                          )}
                          {fixture.scheduledTime && (
                            <span>{fixture.scheduledTime}</span>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {fixture.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'standings' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Standings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-muted-foreground border-b">
                    <th className="pb-3 w-12">#</th>
                    <th className="pb-3">Team</th>
                    <th className="pb-3 text-center">P</th>
                    <th className="pb-3 text-center">W</th>
                    <th className="pb-3 text-center">L</th>
                    <th className="pb-3 text-center">D</th>
                    <th className="pb-3 text-center">Pts</th>
                    <th className="pb-3 text-center">Buch</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTeams.map((team, index) => (
                    <tr key={team.id} className="border-b last:border-0">
                      <td className="py-3 font-semibold">{index + 1}</td>
                      <td className="py-3">
                        <span className="font-medium">{team.teamName}</span>
                      </td>
                      <td className="py-3 text-center">{team.wins + team.losses + team.draws}</td>
                      <td className="py-3 text-center text-green-600">{team.wins}</td>
                      <td className="py-3 text-center text-red-600">{team.losses}</td>
                      <td className="py-3 text-center">{team.draws}</td>
                      <td className="py-3 text-center font-bold">{team.points}</td>
                      <td className="py-3 text-center text-muted-foreground">{team.buchholzScore.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {sortedTeams.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No active teams in standings
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
