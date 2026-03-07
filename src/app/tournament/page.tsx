'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { usePermissions } from '@/lib/auth-context'
import { 
  Plus, 
  CalendarClock, 
  Users, 
  MapPin, 
  Trophy,
  Loader2,
  Calendar,
  Sparkles,
  ChevronRight,
  Play,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

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
  _count: {
    teams: number
    fixtures: number
    rounds: number
  }
}

export default function TournamentPage() {
  const router = useRouter()
  const { canManageTournaments, canViewTournaments } = usePermissions()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!canViewTournaments) {
      router.push('/')
      return
    }
    fetchTournaments()
  }, [canViewTournaments, router])

  const fetchTournaments = async () => {
    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query GetTournaments {
              tournaments {
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
                _count {
                  teams
                  fixtures
                  rounds
                }
              }
            }
          `
        })
      })
      
      const { data } = await response.json()
      if (data?.tournaments) {
        setTournaments(data.tournaments)
      }
    } catch (error) {
      console.error('Failed to fetch tournaments:', error)
    } finally {
      setLoading(false)
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <CalendarClock className="h-8 w-8 text-cyan-500" />
            Tournament Manager
          </h1>
          <p className="text-muted-foreground mt-1">
            Create, schedule, and manage cricket tournaments with AI assistance
          </p>
        </div>
        
        {canManageTournaments && (
          <Button 
            onClick={() => router.push('/tournament/create')}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            New Tournament
          </Button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{tournaments.length}</p>
                <p className="text-sm text-muted-foreground">Tournaments</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Play className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {tournaments.filter(t => t.status === 'IN_PROGRESS').length}
                </p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {tournaments.reduce((sum, t) => sum + t._count.teams, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Teams</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {tournaments.reduce((sum, t) => sum + t._count.fixtures, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Fixtures</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tournament List */}
      {tournaments.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-cyan-100 flex items-center justify-center mb-4">
                <CalendarClock className="h-8 w-8 text-cyan-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Tournaments Yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Create your first tournament to start managing schedules, teams, and fixtures with AI-powered assistance.
              </p>
              {canManageTournaments && (
                <Button onClick={() => router.push('/tournament/create')} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create Tournament
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tournaments.map((tournament) => (
            <Card 
              key={tournament.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/tournament/${tournament.id}`)}
            >
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-12 w-12 rounded-lg flex items-center justify-center",
                      tournament.status === 'IN_PROGRESS' ? 'bg-green-100' :
                      tournament.status === 'COMPLETED' ? 'bg-emerald-100' :
                      tournament.status === 'DRAFT' ? 'bg-gray-100' :
                      'bg-cyan-100'
                    )}>
                      <Trophy className={cn(
                        "h-6 w-6",
                        tournament.status === 'IN_PROGRESS' ? 'text-green-600' :
                        tournament.status === 'COMPLETED' ? 'text-emerald-600' :
                        tournament.status === 'DRAFT' ? 'text-gray-600' :
                        'text-cyan-600'
                      )} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{tournament.name}</h3>
                        {getStatusBadge(tournament.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          {getFormatLabel(tournament.formatType)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {tournament._count.teams} teams
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {tournament._count.fixtures} fixtures
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {tournament.matchFormat} ({tournament.overs} overs)
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* AI Assistant Card */}
      {canManageTournaments && (
        <Card className="bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-cyan-700">
              <Sparkles className="h-5 w-5" />
              AI Scheduling Assistant
            </CardTitle>
            <CardDescription className="text-cyan-600">
              Get intelligent help with tournament scheduling and management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-cyan-600" />
                </div>
                <div>
                  <p className="font-medium text-sm text-cyan-800">Format Analysis</p>
                  <p className="text-xs text-cyan-600">Upload format documents for AI parsing</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-cyan-600" />
                </div>
                <div>
                  <p className="font-medium text-sm text-cyan-800">Smart Pairing</p>
                  <p className="text-xs text-cyan-600">Swiss system pairings with AI</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-cyan-600" />
                </div>
                <div>
                  <p className="font-medium text-sm text-cyan-800">Conflict Resolution</p>
                  <p className="text-xs text-cyan-600">Intelligent rescheduling suggestions</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
