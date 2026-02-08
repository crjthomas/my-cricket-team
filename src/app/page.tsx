'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Trophy, 
  Users, 
  Calendar, 
  TrendingUp, 
  ArrowRight,
  Sparkles,
  Target,
  Clock,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Season {
  id: string
  name: string
  wins: number
  losses: number
  draws: number
  matchesPlayed: number
  totalMatches: number
  currentPosition?: number
  totalTeams?: number
}

interface Match {
  id: string
  matchNumber: number
  matchDate: string
  importance: string
  opponent: { name: string }
  venue: { name: string }
}

interface Player {
  id: string
  name: string
  primaryRole: string
  currentSeasonStats?: {
    runsScored: number
    wicketsTaken: number
    catches: number
    currentForm: string
  }
}

interface Activity {
  id: string
  type: string
  title: string
  description?: string
  createdAt: string
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [season, setSeason] = useState<Season | null>(null)
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([])
  const [recentActivities, setRecentActivities] = useState<Activity[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [teamStrengths, setTeamStrengths] = useState({
    batting: 0,
    bowling: 0,
    fielding: 0,
    experience: 0,
  })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query {
              activeSeason {
                id name wins losses draws matchesPlayed totalMatches currentPosition totalTeams
              }
              upcomingMatches(limit: 3) {
                id matchNumber matchDate importance
                opponent { name }
                venue { name }
              }
              activities(limit: 5) {
                id type title description createdAt
              }
              players(activeOnly: true) {
                id name primaryRole
                currentSeasonStats {
                  runsScored wicketsTaken catches currentForm
                }
              }
            }
          `,
        }),
      })
      const { data } = await res.json()
      
      setSeason(data?.activeSeason)
      setUpcomingMatches(data?.upcomingMatches || [])
      setRecentActivities(data?.activities || [])
      setPlayers(data?.players || [])
      
      // Calculate team strengths from player skills
      if (data?.players?.length > 0) {
        const avgBatting = data.players.reduce((sum: number, p: { battingSkill?: number }) => sum + (p.battingSkill || 5), 0) / data.players.length
        const avgBowling = data.players.reduce((sum: number, p: { bowlingSkill?: number }) => sum + (p.bowlingSkill || 5), 0) / data.players.length
        const avgFielding = data.players.reduce((sum: number, p: { fieldingSkill?: number }) => sum + (p.fieldingSkill || 5), 0) / data.players.length
        const avgExperience = data.players.reduce((sum: number, p: { experienceLevel?: number }) => sum + (p.experienceLevel || 5), 0) / data.players.length
        
        setTeamStrengths({
          batting: avgBatting * 10,
          bowling: avgBowling * 10,
          fielding: avgFielding * 10,
          experience: avgExperience * 10,
        })
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
    return date.toLocaleDateString()
  }

  // Get top performers
  const topScorer = [...players]
    .filter(p => p.currentSeasonStats?.runsScored)
    .sort((a, b) => (b.currentSeasonStats?.runsScored || 0) - (a.currentSeasonStats?.runsScored || 0))[0]
  
  const topWicketTaker = [...players]
    .filter(p => p.currentSeasonStats?.wicketsTaken)
    .sort((a, b) => (b.currentSeasonStats?.wicketsTaken || 0) - (a.currentSeasonStats?.wicketsTaken || 0))[0]
  
  const topFielder = [...players]
    .filter(p => p.currentSeasonStats?.catches)
    .sort((a, b) => (b.currentSeasonStats?.catches || 0) - (a.currentSeasonStats?.catches || 0))[0]

  const topPerformers = [
    topScorer && { name: topScorer.name, stat: `${topScorer.currentSeasonStats?.runsScored} runs`, form: topScorer.currentSeasonStats?.currentForm },
    topWicketTaker && { name: topWicketTaker.name, stat: `${topWicketTaker.currentSeasonStats?.wicketsTaken} wickets`, form: topWicketTaker.currentSeasonStats?.currentForm },
    topFielder && { name: topFielder.name, stat: `${topFielder.currentSeasonStats?.catches} catches`, form: topFielder.currentSeasonStats?.currentForm },
  ].filter(Boolean)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Stats cards data
  const stats = [
    {
      title: 'Season Record',
      value: season ? `W${season.wins} L${season.losses} D${season.draws}` : 'N/A',
      subtitle: season ? `${season.matchesPlayed} of ${season.totalMatches} matches played` : 'No active season',
      icon: Trophy,
      color: 'text-stumps-500',
      bgColor: 'bg-stumps-50 dark:bg-stumps-950',
    },
    {
      title: 'Squad Strength',
      value: players.length.toString(),
      subtitle: 'Active players',
      icon: Users,
      color: 'text-pitch-500',
      bgColor: 'bg-pitch-50 dark:bg-pitch-950',
    },
    {
      title: 'Next Match',
      value: upcomingMatches[0] 
        ? new Date(upcomingMatches[0].matchDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : 'TBD',
      subtitle: upcomingMatches[0] ? `vs ${upcomingMatches[0].opponent.name}` : 'No matches scheduled',
      icon: Calendar,
      color: 'text-leather-500',
      bgColor: 'bg-leather-50 dark:bg-leather-950',
    },
    {
      title: 'League Position',
      value: season?.currentPosition ? `${season.currentPosition}${getOrdinalSuffix(season.currentPosition)}` : '-',
      subtitle: season?.totalTeams ? `of ${season.totalTeams} teams` : 'Not set',
      icon: TrendingUp,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950',
    },
  ]

  function getOrdinalSuffix(n: number) {
    const s = ['th', 'st', 'nd', 'rd']
    const v = n % 100
    return s[(v - 20) % 10] || s[v] || s[0]
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here&apos;s your team overview.
          </p>
        </div>
        <Link href="/squad">
          <Button className="gap-2" variant="default">
            <Sparkles className="h-4 w-4" />
            AI Squad Selector
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={stat.title} glow className={`stagger-${index + 1} animate-slide-up`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upcoming Matches */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Upcoming Matches</CardTitle>
            <Link href="/matches" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingMatches.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No upcoming matches scheduled</p>
                <Link href="/matches">
                  <Button variant="outline" size="sm" className="mt-2">
                    Schedule Match
                  </Button>
                </Link>
              </div>
            ) : (
              upcomingMatches.map((match) => (
                <div 
                  key={match.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-midnight-700 to-midnight-900 text-white font-bold">
                      {match.opponent.name.split(' ').map(w => w[0]).join('')}
                    </div>
                    <div>
                      <p className="font-semibold">{match.opponent.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(match.matchDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        <span className="text-muted-foreground/50">•</span>
                        {match.venue.name}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant={match.importance === 'MUST_WIN' ? 'error' : match.importance === 'IMPORTANT' ? 'warning' : 'secondary'}
                    >
                      {match.importance.replace('_', ' ')}
                    </Badge>
                    <Link href={`/squad`}>
                      <Button size="sm" variant="outline">
                        Select Squad
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Target className="h-5 w-5 text-pitch-500" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topPerformers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No stats recorded yet</p>
              </div>
            ) : (
              topPerformers.map((player, index) => player && (
                <div key={player.name} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-pitch-400 to-pitch-600 text-white font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{player.name}</p>
                    <p className="text-sm text-muted-foreground">{player.stat}</p>
                  </div>
                  {player.form && (
                    <Badge variant={player.form === 'EXCELLENT' ? 'success' : player.form === 'GOOD' ? 'info' : 'secondary'}>
                      {player.form}
                    </Badge>
                  )}
                </div>
              ))
            )}
            <Link href="/players">
              <Button variant="outline" className="w-full mt-2">
                View All Players
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Team Strength Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Team Strengths</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: 'Batting', value: teamStrengths.batting || 50, color: 'bg-blue-500' },
                { label: 'Bowling', value: teamStrengths.bowling || 50, color: 'bg-leather-500' },
                { label: 'Fielding', value: teamStrengths.fielding || 50, color: 'bg-pitch-500' },
                { label: 'Experience', value: teamStrengths.experience || 50, color: 'bg-stumps-500' },
              ].map((stat) => (
                <div key={stat.label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{stat.label}</span>
                    <span className="text-muted-foreground">{Math.round(stat.value)}%</span>
                  </div>
                  <Progress 
                    value={stat.value} 
                    className="h-2" 
                    indicatorClassName={stat.color}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No recent activity</p>
                </div>
              ) : (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className={`mt-1 h-2 w-2 rounded-full ${
                      activity.type.includes('SQUAD') ? 'bg-pitch-500' :
                      activity.type.includes('MATCH') ? 'bg-stumps-500' : 'bg-blue-500'
                    }`} />
                    <div>
                      <p className="text-sm">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{formatTimeAgo(activity.createdAt)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights Card */}
      <Card className="border-pitch-200 dark:border-pitch-800 bg-gradient-to-r from-pitch-50 to-transparent dark:from-pitch-950/50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-pitch-100 dark:bg-pitch-900">
              <Sparkles className="h-6 w-6 text-pitch-600 dark:text-pitch-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-1">AI Squad Selector</h3>
              <p className="text-muted-foreground mb-3">
                Use AI to analyze your team and opponents, then get optimal squad recommendations for upcoming matches.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-pitch-500" />
                  <span>Win-focused, balanced, or opportunity-focused selection modes</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-pitch-500" />
                  <span>Considers player form, opponent analysis, and pitch conditions</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-pitch-500" />
                  <span>Tracks playing opportunities for fair team selection</span>
                </li>
              </ul>
            </div>
            <Link href="/squad">
              <Button variant="success" className="gap-2">
                <Sparkles className="h-4 w-4" />
                Get AI Squad
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
