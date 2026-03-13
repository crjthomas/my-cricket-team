'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
  RefreshCw,
  Download,
  FileSpreadsheet
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScheduleGenerator } from '@/components/tournament/schedule-generator'

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

export default function TournamentDetailPage() {
  const params = useParams()
  const tournamentId = params.id as string
  const router = useRouter()
  const { canManageTournaments } = usePermissions()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'teams' | 'schedule' | 'fixtures' | 'standings'>('overview')
  const [showAddTeam, setShowAddTeam] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  const [isAddingTeam, setIsAddingTeam] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (tournamentId) fetchTournament()
  }, [tournamentId])

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
          variables: { id: tournamentId }
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
              tournamentId: tournamentId,
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

  const deleteTournament = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation DeleteTournament($id: ID!) {
              deleteTournament(id: $id)
            }
          `,
          variables: { id: tournamentId }
        })
      })
      
      const { data, errors } = await response.json()
      if (errors) {
        console.error('Failed to delete tournament:', errors)
        alert('Failed to delete tournament. Please try again.')
        return
      }
      if (data?.deleteTournament) {
        router.push('/tournament')
      }
    } catch (error) {
      console.error('Failed to delete tournament:', error)
      alert('Failed to delete tournament. Please try again.')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const downloadScheduleCSV = () => {
    if (!tournament || tournament.rounds.length === 0) return

    const allFixtures: Array<{
      round: number
      roundName: string
      fixtureNum: number | null
      homeTeam: string
      awayTeam: string
      date: string
      time: string
      venue: string
      status: string
      homeScore: string
      awayScore: string
      winner: string
    }> = []

    tournament.rounds.forEach((round) => {
      round.fixtures.forEach((fixture) => {
        allFixtures.push({
          round: round.roundNumber,
          roundName: round.roundName || `Round ${round.roundNumber}`,
          fixtureNum: fixture.fixtureNumber,
          homeTeam: fixture.homeTeam?.teamName || fixture.homePlaceholder || 'TBD',
          awayTeam: fixture.awayTeam?.teamName || fixture.awayPlaceholder || 'TBD',
          date: fixture.scheduledDate ? new Date(fixture.scheduledDate).toLocaleDateString() : 'TBD',
          time: fixture.scheduledTime || 'TBD',
          venue: fixture.groundSlot?.venue.name || 'TBD',
          status: fixture.status,
          homeScore: fixture.homeScore || '-',
          awayScore: fixture.awayScore || '-',
          winner: fixture.winner?.teamName || '-'
        })
      })
    })

    const headers = ['Match #', 'Round', 'Round Name', 'Home Team', 'Away Team', 'Date', 'Time', 'Venue', 'Status', 'Home Score', 'Away Score', 'Winner']
    const csvRows = [
      headers.join(','),
      ...allFixtures.map(f => [
        f.fixtureNum || '-',
        f.round,
        `"${f.roundName}"`,
        `"${f.homeTeam}"`,
        `"${f.awayTeam}"`,
        f.date,
        f.time,
        `"${f.venue}"`,
        f.status,
        f.homeScore,
        f.awayScore,
        `"${f.winner}"`
      ].join(','))
    ]

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${tournament.name.replace(/[^a-zA-Z0-9]/g, '_')}_Schedule.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const downloadSchedulePrintable = () => {
    if (!tournament || tournament.rounds.length === 0) return

    let htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>${tournament.name} - Schedule</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; max-width: 1000px; margin: 0 auto; }
    h1 { color: #0891b2; border-bottom: 2px solid #0891b2; padding-bottom: 10px; }
    h2 { color: #374151; margin-top: 30px; }
    .info { color: #6b7280; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { background: #f3f4f6; text-align: left; padding: 10px; border: 1px solid #e5e7eb; }
    td { padding: 10px; border: 1px solid #e5e7eb; }
    .match-num { font-weight: bold; color: #6b7280; }
    .winner { color: #059669; font-weight: bold; }
    .venue { color: #6b7280; font-size: 0.9em; }
    .time { color: #0891b2; }
    @media print { body { padding: 0; } h1 { font-size: 24px; } }
  </style>
</head>
<body>
  <h1>${tournament.name}</h1>
  <div class="info">
    <p><strong>Format:</strong> ${tournament.formatType} | <strong>Match Format:</strong> ${tournament.matchFormat} (${tournament.overs} overs)</p>
    <p><strong>Start Date:</strong> ${new Date(tournament.startDate).toLocaleDateString()}${tournament.endDate ? ` | <strong>End Date:</strong> ${new Date(tournament.endDate).toLocaleDateString()}` : ''}</p>
    <p><strong>Teams:</strong> ${tournament.teams.length} | <strong>Total Matches:</strong> ${tournament.rounds.reduce((sum, r) => sum + r.fixtures.length, 0)}</p>
  </div>
`

    tournament.rounds.forEach((round) => {
      htmlContent += `
  <h2>Round ${round.roundNumber}${round.roundName ? `: ${round.roundName}` : ''}</h2>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Home Team</th>
        <th>vs</th>
        <th>Away Team</th>
        <th>Date & Time</th>
        <th>Venue</th>
        <th>Result</th>
      </tr>
    </thead>
    <tbody>
`
      round.fixtures.forEach((fixture) => {
        const homeTeam = fixture.homeTeam?.teamName || fixture.homePlaceholder || 'TBD'
        const awayTeam = fixture.awayTeam?.teamName || fixture.awayPlaceholder || 'TBD'
        const isHomeWinner = fixture.winner?.id === fixture.homeTeam?.id
        const isAwayWinner = fixture.winner?.id === fixture.awayTeam?.id
        const dateStr = fixture.scheduledDate ? new Date(fixture.scheduledDate).toLocaleDateString() : 'TBD'
        const timeStr = fixture.scheduledTime || ''
        const venue = fixture.groundSlot?.venue.name || 'TBD'
        const result = fixture.homeScore && fixture.awayScore 
          ? `${fixture.homeScore} - ${fixture.awayScore}` 
          : fixture.status

        htmlContent += `
      <tr>
        <td class="match-num">${fixture.fixtureNumber || '-'}</td>
        <td${isHomeWinner ? ' class="winner"' : ''}>${homeTeam}</td>
        <td>vs</td>
        <td${isAwayWinner ? ' class="winner"' : ''}>${awayTeam}</td>
        <td><span class="time">${dateStr}${timeStr ? ` ${timeStr}` : ''}</span></td>
        <td class="venue">${venue}</td>
        <td>${result}</td>
      </tr>
`
      })

      htmlContent += `
    </tbody>
  </table>
`
    })

    htmlContent += `
  <div style="margin-top: 40px; text-align: center; color: #9ca3af; font-size: 0.8em;">
    Generated on ${new Date().toLocaleString()}
  </div>
</body>
</html>
`

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${tournament.name.replace(/[^a-zA-Z0-9]/g, '_')}_Schedule.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
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
        {(['overview', 'teams', 'schedule', 'fixtures', 'standings'] as const).map((tab) => (
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
                  <Button 
                    className="w-full justify-start gap-2" 
                    variant="outline"
                    onClick={() => setActiveTab('teams')}
                  >
                    <Users className="h-4 w-4" />
                    Manage Teams
                  </Button>
                  <Button 
                    className="w-full justify-start gap-2" 
                    variant="outline"
                    onClick={() => router.push(`/tournament/${tournamentId}/venues`)}
                  >
                    <MapPin className="h-4 w-4" />
                    Venue Availability
                  </Button>
                  <Button className="w-full justify-start gap-2" variant="outline">
                    <Calendar className="h-4 w-4" />
                    Generate Schedule
                  </Button>
                  <Button className="w-full justify-start gap-2 bg-cyan-50 text-cyan-700 hover:bg-cyan-100">
                    <Sparkles className="h-4 w-4" />
                    AI Swiss Pairing
                  </Button>
                  <div className="border-t pt-3 mt-3">
                    <Button 
                      className="w-full justify-start gap-2 text-red-600 hover:bg-red-50 hover:text-red-700" 
                      variant="outline"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Tournament
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                Delete Tournament
              </CardTitle>
              <CardDescription>
                This action cannot be undone. All teams, fixtures, and related data will be permanently deleted.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">
                Are you sure you want to delete <strong>{tournament.name}</strong>?
              </p>
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={deleteTournament}
                  disabled={isDeleting}
                  className="gap-2"
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Delete
                </Button>
              </div>
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

      {activeTab === 'schedule' && (
        <div className="space-y-6">
          <Card className="bg-gradient-to-r from-purple-50 to-cyan-50 border-purple-200">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Schedule Generator</h3>
                  <p className="text-sm text-muted-foreground">
                    Generate groups and fixtures automatically based on your configuration.
                    Works without AI - uses rule-based algorithms.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <ScheduleGenerator
            tournamentId={tournament.id}
            teams={tournament.teams.map(t => ({
              id: t.id,
              teamName: t.teamName,
              seedRank: t.seedRank
            }))}
            startDate={tournament.startDate}
            onScheduleGenerated={() => {
              fetchTournament()
              setActiveTab('fixtures')
            }}
          />
        </div>
      )}

      {activeTab === 'fixtures' && (
        <div className="space-y-4">
          {/* Download Options */}
          {tournament.rounds.length > 0 && (
            <Card className="bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                      <Download className="h-5 w-5 text-cyan-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Download Schedule</h4>
                      <p className="text-sm text-muted-foreground">Export for offline use or printing</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2" onClick={downloadScheduleCSV}>
                      <FileSpreadsheet className="h-4 w-4" />
                      CSV (Excel)
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2" onClick={downloadSchedulePrintable}>
                      <Download className="h-4 w-4" />
                      Printable HTML
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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
