'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth-context'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Calculator, 
  ShieldAlert,
  Loader2,
  Check,
  X,
  RefreshCw,
  ArrowRight,
  Info
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface RatingChange {
  playerId: string
  playerName: string
  skillType: string
  previousRating: number
  newRating: number
  changeAmount: number
  performanceScore: number
  reason: string
}

interface PlayerRatings {
  battingSkill: number
  bowlingSkill: number
  fieldingSkill: number
  powerHitting: number
  runningBetweenWickets: number
  pressureHandling: number
}

interface PlayerRatingPreview {
  playerId: string
  playerName: string
  primaryRole: string
  currentRatings: PlayerRatings
  proposedChanges: RatingChange[]
  excluded: boolean
  exclusionReason: string | null
}

export default function RatingsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [previews, setPreviews] = useState<PlayerRatingPreview[]>([])
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [excludedPlayers, setExcludedPlayers] = useState<Set<string>>(new Set())
  const [exclusionReasons, setExclusionReasons] = useState<Record<string, string>>({})
  const [applied, setApplied] = useState(false)
  const [applyResult, setApplyResult] = useState<{ updated: number; skipped: number } | null>(null)

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/')
    }
  }, [user, router])

  // Fetch rating previews
  const fetchPreviews = async () => {
    setLoading(true)
    setApplied(false)
    setApplyResult(null)
    
    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query RatingPreview($excludePlayerIds: [String!]) {
              ratingPreview(excludePlayerIds: $excludePlayerIds) {
                playerId
                playerName
                primaryRole
                currentRatings {
                  battingSkill
                  bowlingSkill
                  fieldingSkill
                  powerHitting
                  runningBetweenWickets
                  pressureHandling
                }
                proposedChanges {
                  skillType
                  previousRating
                  newRating
                  changeAmount
                  performanceScore
                  reason
                }
                excluded
                exclusionReason
              }
            }
          `,
          variables: {
            excludePlayerIds: Array.from(excludedPlayers)
          }
        }),
      })
      
      const { data } = await response.json()
      if (data?.ratingPreview) {
        setPreviews(data.ratingPreview)
        
        // Initialize excluded players from database flags
        const dbExcluded = new Set<string>()
        const dbReasons: Record<string, string> = {}
        data.ratingPreview.forEach((p: PlayerRatingPreview) => {
          if (p.excluded) {
            dbExcluded.add(p.playerId)
            if (p.exclusionReason) {
              dbReasons[p.playerId] = p.exclusionReason
            }
          }
        })
        setExcludedPlayers(prev => new Set([...Array.from(prev), ...Array.from(dbExcluded)]))
        setExclusionReasons(prev => ({ ...prev, ...dbReasons }))
      }
    } catch (error) {
      console.error('Failed to fetch rating previews:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      fetchPreviews()
    }
  }, [user])

  const toggleExclusion = (playerId: string) => {
    setExcludedPlayers(prev => {
      const next = new Set(prev)
      if (next.has(playerId)) {
        next.delete(playerId)
      } else {
        next.add(playerId)
      }
      return next
    })
  }

  const updateExclusionReason = (playerId: string, reason: string) => {
    setExclusionReasons(prev => ({ ...prev, [playerId]: reason }))
  }

  const applyChanges = async () => {
    setApplying(true)
    
    try {
      // First, update exclusion flags in database
      for (const playerId of Array.from(excludedPlayers)) {
        await fetch('/api/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `
              mutation UpdateExclusion($playerId: String!, $exclude: Boolean!, $reason: String) {
                updatePlayerRatingExclusion(playerId: $playerId, exclude: $exclude, reason: $reason) {
                  id
                }
              }
            `,
            variables: {
              playerId,
              exclude: true,
              reason: exclusionReasons[playerId] || null
            }
          }),
        })
      }
      
      // Apply rating changes
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation ApplyRatingChanges($excludePlayerIds: [String!], $reason: String) {
              applyRatingChanges(excludePlayerIds: $excludePlayerIds, reason: $reason) {
                updated
                skipped
              }
            }
          `,
          variables: {
            excludePlayerIds: Array.from(excludedPlayers),
            reason: 'Bulk recalculation by admin'
          }
        }),
      })
      
      const { data } = await response.json()
      if (data?.applyRatingChanges) {
        setApplyResult(data.applyRatingChanges)
        setApplied(true)
      }
    } catch (error) {
      console.error('Failed to apply rating changes:', error)
    } finally {
      setApplying(false)
    }
  }

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-muted-foreground" />
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600'
    if (change < 0) return 'text-red-600'
    return 'text-muted-foreground'
  }

  const totalChanges = previews.reduce((sum, p) => sum + p.proposedChanges.length, 0)
  const playersWithChanges = previews.filter(p => p.proposedChanges.length > 0 && !excludedPlayers.has(p.playerId)).length

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-96">
          <CardContent className="pt-6 text-center">
            <ShieldAlert className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Admin Access Required</h2>
            <p className="text-muted-foreground">
              Only administrators can access the rating management page.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">AI Rating Management</h1>
          <p className="text-muted-foreground">
            Review and apply AI-calculated skill rating updates based on match performances
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchPreviews} disabled={loading}>
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button 
            onClick={applyChanges} 
            disabled={applying || playersWithChanges === 0 || applied}
            className="gap-2"
          >
            {applying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : applied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Calculator className="h-4 w-4" />
            )}
            {applied ? 'Applied!' : `Apply Changes (${playersWithChanges})`}
          </Button>
        </div>
      </div>

      {/* Result Banner */}
      {applied && applyResult && (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Check className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-700 dark:text-green-400">
                  Rating updates applied successfully!
                </p>
                <p className="text-sm text-green-600 dark:text-green-500">
                  {applyResult.updated} players updated, {applyResult.skipped} skipped
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Card */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-500 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">How AI Rating Updates Work</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Ratings are calculated from the last 5 match performances</li>
                <li>Current rating carries 70% weight, performance score carries 30%</li>
                <li>Important matches have higher impact on ratings</li>
                <li>You can exclude players whose ratings you want to preserve (e.g., experienced players in temporary bad form)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total Players</p>
            <p className="text-2xl font-bold">{previews.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">With Changes</p>
            <p className="text-2xl font-bold">{previews.filter(p => p.proposedChanges.length > 0).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Excluded</p>
            <p className="text-2xl font-bold">{excludedPlayers.size}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total Changes</p>
            <p className="text-2xl font-bold">{totalChanges}</p>
          </CardContent>
        </Card>
      </div>

      {/* Player List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          {previews.map(preview => {
            const isExcluded = excludedPlayers.has(preview.playerId)
            const hasChanges = preview.proposedChanges.length > 0
            
            return (
              <Card 
                key={preview.playerId}
                className={cn(
                  "transition-all",
                  isExcluded && "opacity-60 border-dashed"
                )}
              >
                <CardContent className="py-4">
                  <div className="flex flex-col lg:flex-row gap-4">
                    {/* Player Info */}
                    <div className="flex items-center gap-3 lg:w-64 flex-shrink-0">
                      <Checkbox
                        checked={!isExcluded}
                        onCheckedChange={() => toggleExclusion(preview.playerId)}
                        className="data-[state=checked]:bg-pitch-500 data-[state=checked]:border-pitch-500"
                      />
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className={cn(
                          "text-white text-sm font-semibold",
                          isExcluded ? "bg-muted-foreground" : "bg-pitch-500"
                        )}>
                          {preview.playerName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{preview.playerName}</p>
                        <Badge variant="outline" className="text-xs">
                          {preview.primaryRole.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>

                    {/* Changes */}
                    <div className="flex-1">
                      {hasChanges && !isExcluded ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {preview.proposedChanges.map((change, idx) => (
                            <div 
                              key={idx}
                              className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
                            >
                              {getChangeIcon(change.changeAmount)}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-muted-foreground truncate">
                                  {change.skillType.replace(/_/g, ' ')}
                                </p>
                                <div className="flex items-center gap-1">
                                  <span className="font-medium">{change.previousRating}</span>
                                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                  <span className={cn("font-bold", getChangeColor(change.changeAmount))}>
                                    {change.newRating}
                                  </span>
                                  <span className={cn("text-xs", getChangeColor(change.changeAmount))}>
                                    ({change.changeAmount > 0 ? '+' : ''}{change.changeAmount})
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : hasChanges && isExcluded ? (
                        <div className="flex items-center gap-2">
                          <X className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {preview.proposedChanges.length} changes will be skipped
                          </span>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No rating changes based on recent performances
                        </p>
                      )}
                    </div>

                    {/* Exclusion Reason */}
                    {isExcluded && (
                      <div className="lg:w-64 flex-shrink-0">
                        <Input
                          placeholder="Reason for exclusion..."
                          value={exclusionReasons[preview.playerId] || ''}
                          onChange={(e) => updateExclusionReason(preview.playerId, e.target.value)}
                          className="text-sm"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {previews.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Players Found</h3>
            <p className="text-muted-foreground">
              Add players and record match performances to enable AI rating updates.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
