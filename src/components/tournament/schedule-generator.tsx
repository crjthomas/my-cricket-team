'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar, 
  Users, 
  MapPin, 
  Loader2, 
  CheckCircle, 
  AlertTriangle,
  Download,
  Copy,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Team {
  id: string
  teamName: string
  seedRank: number | null
}

interface ScheduleGeneratorProps {
  tournamentId: string
  teams: Team[]
  startDate: string
  onScheduleGenerated?: () => void
}

interface GeneratedGroup {
  groupName: string
  teams: Array<{ id: string; name: string; seedRank: number }>
}

interface GeneratedFixture {
  homeTeam: { id: string; name: string; seedRank: number }
  awayTeam: { id: string; name: string; seedRank: number }
  groupName: string
  roundNumber: number
  isCrossGroup: boolean
  scheduledDate: string
  scheduledTime: string
  venue: string
}

interface ScheduleResult {
  success: boolean
  groups: GeneratedGroup[]
  fixtures: GeneratedFixture[]
  summary: {
    totalGroups: number
    totalFixtures: number
    totalWeeks: number
    gamesPerWeekend: number
  }
  warnings: string[]
  formattedSchedule: string
}

export function ScheduleGenerator({ tournamentId, teams, startDate, onScheduleGenerated }: ScheduleGeneratorProps) {
  const [config, setConfig] = useState({
    teamsPerGroup: 5,
    gamesPerTeam: 5,
    venues: 6,
    saturdayGamesPerVenue: 2,
    sundayGamesPerVenue: 1,
    avoidDoubleHeaders: true,
    startDate: startDate.split('T')[0]
  })

  const [isGenerating, setIsGenerating] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [result, setResult] = useState<ScheduleResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation GenerateSchedule($input: GenerateScheduleInput!) {
              generateTournamentSchedule(input: $input) {
                success
                groups {
                  groupName
                  teams { id name seedRank }
                }
                fixtures {
                  homeTeam { id name seedRank }
                  awayTeam { id name seedRank }
                  groupName
                  roundNumber
                  isCrossGroup
                  scheduledDate
                  scheduledTime
                  venue
                }
                summary {
                  totalGroups
                  totalFixtures
                  totalWeeks
                  gamesPerWeekend
                }
                warnings
                formattedSchedule
              }
            }
          `,
          variables: {
            input: {
              tournamentId,
              ...config,
              startDate: new Date(config.startDate).toISOString()
            }
          }
        })
      })

      const data = await response.json()
      
      if (data.errors) {
        throw new Error(data.errors[0]?.message || 'Failed to generate schedule')
      }

      setResult(data.data.generateTournamentSchedule)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate schedule')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleApply = async () => {
    if (!result || !result.success) return

    setIsApplying(true)
    setError(null)

    try {
      const fixtures = result.fixtures.map((f, i) => ({
        tournamentId,
        homeTeamId: f.homeTeam.id,
        awayTeamId: f.awayTeam.id,
        scheduledDate: f.scheduledDate,
        scheduledTime: f.scheduledTime,
        fixtureNumber: i + 1
      }))

      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation ApplySchedule($tournamentId: ID!, $fixtures: [CreateTournamentFixtureInput!]!) {
              applyGeneratedSchedule(tournamentId: $tournamentId, fixtures: $fixtures)
            }
          `,
          variables: { tournamentId, fixtures }
        })
      })

      const data = await response.json()
      
      if (data.errors) {
        throw new Error(data.errors[0]?.message || 'Failed to apply schedule')
      }

      if (data.data.applyGeneratedSchedule) {
        onScheduleGenerated?.()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to apply schedule')
    } finally {
      setIsApplying(false)
    }
  }

  const handleCopySchedule = () => {
    if (result?.formattedSchedule) {
      navigator.clipboard.writeText(result.formattedSchedule)
    }
  }

  const handleDownloadSchedule = () => {
    if (result?.formattedSchedule) {
      const blob = new Blob([result.formattedSchedule], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'tournament-schedule.md'
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const confirmedTeams = teams.filter(t => t.seedRank !== null)

  return (
    <div className="space-y-6">
      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-cyan-600" />
            Schedule Generator
          </CardTitle>
          <CardDescription>
            Generate groups and fixtures based on your configuration. No AI required.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Team Info */}
          <div className="p-4 rounded-lg bg-cyan-50 border border-cyan-200">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-cyan-600" />
              <span className="font-medium text-cyan-900">Teams: {teams.length}</span>
            </div>
            <p className="text-sm text-cyan-700">
              {confirmedTeams.length} teams have seed rankings assigned. 
              {confirmedTeams.length < teams.length && 
                ` ${teams.length - confirmedTeams.length} teams need seed rankings before generating.`}
            </p>
          </div>

          {/* Configuration Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="teamsPerGroup">Teams per Group</Label>
              <Input
                id="teamsPerGroup"
                type="number"
                min={3}
                max={8}
                value={config.teamsPerGroup}
                onChange={(e) => setConfig({ ...config, teamsPerGroup: parseInt(e.target.value) || 5 })}
              />
              <p className="text-xs text-muted-foreground">
                {teams.length} teams → {Math.ceil(teams.length / config.teamsPerGroup)} groups
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gamesPerTeam">Games per Team</Label>
              <Input
                id="gamesPerTeam"
                type="number"
                min={3}
                max={10}
                value={config.gamesPerTeam}
                onChange={(e) => setConfig({ ...config, gamesPerTeam: parseInt(e.target.value) || 5 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="venues">Number of Venues</Label>
              <Input
                id="venues"
                type="number"
                min={1}
                max={12}
                value={config.venues}
                onChange={(e) => setConfig({ ...config, venues: parseInt(e.target.value) || 6 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="saturdayGames">Saturday Games/Venue</Label>
              <Input
                id="saturdayGames"
                type="number"
                min={1}
                max={3}
                value={config.saturdayGamesPerVenue}
                onChange={(e) => setConfig({ ...config, saturdayGamesPerVenue: parseInt(e.target.value) || 2 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sundayGames">Sunday Games/Venue</Label>
              <Input
                id="sundayGames"
                type="number"
                min={1}
                max={2}
                value={config.sundayGamesPerVenue}
                onChange={(e) => setConfig({ ...config, sundayGamesPerVenue: parseInt(e.target.value) || 1 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={config.startDate}
                onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
              />
            </div>
          </div>

          {/* Double Header Toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="avoidDoubleHeaders"
              checked={config.avoidDoubleHeaders}
              onChange={(e) => setConfig({ ...config, avoidDoubleHeaders: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="avoidDoubleHeaders" className="font-normal">
              Avoid double headers (no team plays twice on the same day)
            </Label>
          </div>

          {/* Games Per Weekend Info */}
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-sm">
              <strong>Games per weekend:</strong>{' '}
              {(config.venues * config.saturdayGamesPerVenue) + (config.venues * config.sundayGamesPerVenue)} games
              ({config.venues * config.saturdayGamesPerVenue} Saturday + {config.venues * config.sundayGamesPerVenue} Sunday)
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || teams.length < 4}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Generating Schedule...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Generate Schedule
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <Card className={cn(
          "border-2",
          result.success ? "border-green-200" : "border-red-200"
        )}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              )}
              Generated Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            {result.success && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-cyan-50 text-center">
                  <p className="text-2xl font-bold text-cyan-700">{result.summary.totalGroups}</p>
                  <p className="text-sm text-cyan-600">Groups</p>
                </div>
                <div className="p-3 rounded-lg bg-green-50 text-center">
                  <p className="text-2xl font-bold text-green-700">{result.summary.totalFixtures}</p>
                  <p className="text-sm text-green-600">Fixtures</p>
                </div>
                <div className="p-3 rounded-lg bg-purple-50 text-center">
                  <p className="text-2xl font-bold text-purple-700">{result.summary.totalWeeks}</p>
                  <p className="text-sm text-purple-600">Weeks</p>
                </div>
                <div className="p-3 rounded-lg bg-orange-50 text-center">
                  <p className="text-2xl font-bold text-orange-700">{result.summary.gamesPerWeekend}</p>
                  <p className="text-sm text-orange-600">Games/Weekend</p>
                </div>
              </div>
            )}

            {/* Groups */}
            {result.groups.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Groups</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {result.groups.map((group) => (
                    <div key={group.groupName} className="p-3 rounded-lg border">
                      <h5 className="font-medium mb-2">Group {group.groupName}</h5>
                      <ul className="text-sm space-y-1">
                        {group.teams.map((team) => (
                          <li key={team.id} className="flex items-center gap-2">
                            <Badge variant="outline" className="w-6 h-6 p-0 justify-center text-xs">
                              {team.seedRank}
                            </Badge>
                            <span className="truncate">{team.name}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Warnings */}
            {result.warnings.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">Notes</h4>
                <div className="space-y-1">
                  {result.warnings.map((warning, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span>{warning}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sample Fixtures */}
            {result.fixtures.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Sample Fixtures (First 10)</h4>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {result.fixtures.slice(0, 10).map((fixture, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded border text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{fixture.homeTeam.name}</span>
                        <span className="text-muted-foreground">vs</span>
                        <span className="font-medium">{fixture.awayTeam.name}</span>
                        {fixture.isCrossGroup && (
                          <Badge variant="secondary" className="text-xs">Cross-group</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{fixture.venue}</span>
                        <span>•</span>
                        <span>{fixture.scheduledTime}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            {result.success && (
              <div className="flex flex-wrap gap-3">
                <Button onClick={handleCopySchedule} variant="outline">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Schedule
                </Button>
                <Button onClick={handleDownloadSchedule} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button 
                  onClick={handleApply} 
                  disabled={isApplying}
                  className="ml-auto"
                >
                  {isApplying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Applying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Apply to Tournament
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
