import { Suspense } from 'react'
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
  Clock
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

// Stats cards data
const stats = [
  {
    title: 'Season Record',
    value: 'W4 L1 D1',
    subtitle: '6 of 12 matches played',
    icon: Trophy,
    color: 'text-stumps-500',
    bgColor: 'bg-stumps-50 dark:bg-stumps-950',
  },
  {
    title: 'Squad Strength',
    value: '15',
    subtitle: 'Active players',
    icon: Users,
    color: 'text-pitch-500',
    bgColor: 'bg-pitch-50 dark:bg-pitch-950',
  },
  {
    title: 'Next Match',
    value: 'Feb 8',
    subtitle: 'vs Thunder Hawks',
    icon: Calendar,
    color: 'text-leather-500',
    bgColor: 'bg-leather-50 dark:bg-leather-950',
  },
  {
    title: 'League Position',
    value: '3rd',
    subtitle: 'of 8 teams',
    icon: TrendingUp,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
  },
]

const topPerformers = [
  { name: 'Raj Kumar', stat: '285 runs', role: 'Batsman', form: 'EXCELLENT' },
  { name: 'Vikram Patel', stat: '12 wickets', role: 'Bowler', form: 'EXCELLENT' },
  { name: 'Suresh Menon', stat: '8 catches', role: 'Wicketkeeper', form: 'GOOD' },
]

const upcomingMatches = [
  { 
    opponent: 'Thunder Hawks', 
    date: 'Feb 8, 2026', 
    venue: 'Riverside Ground',
    importance: 'MUST_WIN',
    availableCount: 14
  },
  { 
    opponent: 'Royal Strikers', 
    date: 'Feb 15, 2026', 
    venue: 'Central Park',
    importance: 'IMPORTANT',
    availableCount: null
  },
]

const recentActivities = [
  { action: 'Squad selected for Match #7', time: '2 hours ago', type: 'squad' },
  { action: 'Raj Kumar scored 78', time: '3 days ago', type: 'performance' },
  { action: 'Won vs City Lions by 25 runs', time: '3 days ago', type: 'match' },
  { action: 'Vikram Patel took 4/28', time: '3 days ago', type: 'performance' },
]

export default function DashboardPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, Captain! Here&apos;s your team overview.
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
            {upcomingMatches.map((match, index) => (
              <div 
                key={match.opponent}
                className="flex items-center justify-between p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-midnight-700 to-midnight-900 text-white font-bold">
                    {match.opponent.split(' ').map(w => w[0]).join('')}
                  </div>
                  <div>
                    <p className="font-semibold">{match.opponent}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {match.date}
                      <span className="text-muted-foreground/50">•</span>
                      {match.venue}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge 
                    variant={match.importance === 'MUST_WIN' ? 'error' : 'warning'}
                  >
                    {match.importance.replace('_', ' ')}
                  </Badge>
                  {match.availableCount !== null && (
                    <div className="text-right">
                      <p className="text-sm font-medium">{match.availableCount} available</p>
                      <Link href={`/squad`}>
                        <Button size="sm" variant="outline" className="mt-1">
                          Select Squad
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
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
            {topPerformers.map((player, index) => (
              <div key={player.name} className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-pitch-400 to-pitch-600 text-white font-semibold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{player.name}</p>
                  <p className="text-sm text-muted-foreground">{player.stat}</p>
                </div>
                <Badge variant={player.form === 'EXCELLENT' ? 'success' : 'info'}>
                  {player.form}
                </Badge>
              </div>
            ))}
            <Link href="/stats">
              <Button variant="outline" className="w-full mt-2">
                View All Statistics
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
                { label: 'Batting', value: 78, color: 'bg-blue-500' },
                { label: 'Bowling', value: 72, color: 'bg-leather-500' },
                { label: 'Fielding', value: 68, color: 'bg-pitch-500' },
                { label: 'Experience', value: 65, color: 'bg-stumps-500' },
              ].map((stat) => (
                <div key={stat.label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{stat.label}</span>
                    <span className="text-muted-foreground">{stat.value}%</span>
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
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className={`mt-1 h-2 w-2 rounded-full ${
                    activity.type === 'squad' ? 'bg-pitch-500' :
                    activity.type === 'match' ? 'bg-stumps-500' : 'bg-blue-500'
                  }`} />
                  <div>
                    <p className="text-sm">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
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
              <h3 className="font-semibold text-lg mb-1">AI Insights</h3>
              <p className="text-muted-foreground mb-3">
                Based on your upcoming match against Thunder Hawks, here are some recommendations:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-pitch-500" />
                  <span>Consider picking more pace bowlers - overcast conditions expected</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-pitch-500" />
                  <span>Karthik Nair has only played 2 of 6 available matches - consider giving him a chance</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-pitch-500" />
                  <span>Thunder Hawks struggle against left-arm spinners - Anand Pillai could be key</span>
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

