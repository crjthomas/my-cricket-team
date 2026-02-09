/**
 * AI Rating Calculator
 * 
 * Calculates player skill ratings based on match performances.
 * Uses weighted averages of recent performances to adjust ratings.
 */

import { prisma } from './prisma'

// Types for match performance data
interface MatchPerformanceData {
  id: string
  matchId: string
  playerId: string
  didBat: boolean
  battingOrder: number | null
  runsScored: number
  ballsFaced: number
  fours: number
  sixes: number
  isNotOut: boolean
  didBowl: boolean
  oversBowled: number
  runsConceded: number
  wicketsTaken: number
  maidens: number
  wides: number
  noBalls: number
  catches: number
  runOuts: number
  stumpings: number
  droppedCatches: number
  isManOfMatch: boolean
  match?: {
    importance: string
  }
}

interface PlayerData {
  id: string
  name: string
  primaryRole: string
  battingSkill: number
  bowlingSkill: number
  fieldingSkill: number
  powerHitting: number
  runningBetweenWickets: number
  pressureHandling: number
  excludeFromAutoRating: boolean
}

interface RatingChange {
  playerId: string
  playerName: string
  skillType: 'BATTING' | 'BOWLING' | 'FIELDING' | 'POWER_HITTING' | 'RUNNING_BETWEEN_WICKETS' | 'PRESSURE_HANDLING'
  previousRating: number
  newRating: number
  changeAmount: number
  performanceScore: number
  reason: string
}

interface RatingCalculationResult {
  playerId: string
  playerName: string
  changes: RatingChange[]
  excluded: boolean
  exclusionReason?: string
}

// Constants for rating calculation
const WEIGHT_CURRENT = 0.7  // 70% weight to current rating
const WEIGHT_PERFORMANCE = 0.3  // 30% weight to recent performance
const MIN_RATING = 1
const MAX_RATING = 10

// Match importance multipliers
const IMPORTANCE_MULTIPLIER: Record<string, number> = {
  MUST_WIN: 1.5,
  IMPORTANT: 1.25,
  REGULAR: 1.0,
  LOW_STAKES: 0.75,
}

/**
 * Calculate batting performance score (0-10)
 */
export function calculateBattingPerformanceScore(performance: MatchPerformanceData): number {
  if (!performance.didBat) return -1 // -1 indicates didn't participate
  
  let score = 5 // Base score
  
  // Runs contribution (0-3 points)
  if (performance.runsScored >= 100) score += 3
  else if (performance.runsScored >= 50) score += 2.5
  else if (performance.runsScored >= 30) score += 1.5
  else if (performance.runsScored >= 20) score += 1
  else if (performance.runsScored >= 10) score += 0.5
  else if (performance.runsScored < 5 && !performance.isNotOut) score -= 1
  
  // Strike rate bonus/penalty (0-1 points)
  if (performance.ballsFaced > 0) {
    const strikeRate = (performance.runsScored / performance.ballsFaced) * 100
    if (strikeRate >= 150) score += 1
    else if (strikeRate >= 120) score += 0.5
    else if (strikeRate < 70 && performance.ballsFaced >= 10) score -= 0.5
  }
  
  // Boundary hitting (0-0.5 points)
  const boundaries = performance.fours + performance.sixes
  if (boundaries >= 8) score += 0.5
  else if (boundaries >= 5) score += 0.25
  
  // Not out bonus
  if (performance.isNotOut && performance.runsScored >= 20) score += 0.5
  
  // Apply match importance
  const importance = performance.match?.importance || 'REGULAR'
  const multiplier = IMPORTANCE_MULTIPLIER[importance] || 1.0
  
  // Man of match bonus
  if (performance.isManOfMatch) score += 0.5
  
  return Math.min(MAX_RATING, Math.max(MIN_RATING, score * multiplier))
}

/**
 * Calculate bowling performance score (0-10)
 */
export function calculateBowlingPerformanceScore(performance: MatchPerformanceData): number {
  if (!performance.didBowl || performance.oversBowled === 0) return -1
  
  let score = 5 // Base score
  
  // Wickets contribution (0-3 points)
  if (performance.wicketsTaken >= 5) score += 3
  else if (performance.wicketsTaken >= 3) score += 2
  else if (performance.wicketsTaken >= 2) score += 1.5
  else if (performance.wicketsTaken >= 1) score += 0.75
  else score -= 0.5 // No wickets penalty
  
  // Economy rate (0-1.5 points)
  const economy = performance.runsConceded / performance.oversBowled
  if (economy <= 4) score += 1.5
  else if (economy <= 6) score += 1
  else if (economy <= 8) score += 0.5
  else if (economy > 10) score -= 1
  
  // Maidens bonus
  if (performance.maidens >= 2) score += 0.5
  else if (performance.maidens >= 1) score += 0.25
  
  // Extras penalty
  const extras = performance.wides + performance.noBalls
  if (extras >= 5) score -= 0.5
  
  // Apply match importance
  const importance = performance.match?.importance || 'REGULAR'
  const multiplier = IMPORTANCE_MULTIPLIER[importance] || 1.0
  
  // Man of match bonus
  if (performance.isManOfMatch) score += 0.5
  
  return Math.min(MAX_RATING, Math.max(MIN_RATING, score * multiplier))
}

/**
 * Calculate fielding performance score (0-10)
 */
export function calculateFieldingPerformanceScore(performance: MatchPerformanceData): number {
  let score = 5 // Base score
  
  // Catches (0-2 points)
  if (performance.catches >= 3) score += 2
  else if (performance.catches >= 2) score += 1.5
  else if (performance.catches >= 1) score += 0.75
  
  // Run outs (0-1 point)
  if (performance.runOuts >= 2) score += 1
  else if (performance.runOuts >= 1) score += 0.5
  
  // Stumpings (wicketkeeper bonus)
  if (performance.stumpings >= 2) score += 1
  else if (performance.stumpings >= 1) score += 0.5
  
  // Dropped catches penalty
  if (performance.droppedCatches >= 2) score -= 1.5
  else if (performance.droppedCatches >= 1) score -= 0.75
  
  // Apply match importance
  const importance = performance.match?.importance || 'REGULAR'
  const multiplier = IMPORTANCE_MULTIPLIER[importance] || 1.0
  
  return Math.min(MAX_RATING, Math.max(MIN_RATING, score * multiplier))
}

/**
 * Calculate new rating based on current rating and performance score
 */
function calculateNewRating(currentRating: number, performanceScore: number): number {
  if (performanceScore < 0) return currentRating // Didn't participate
  
  const newRating = (currentRating * WEIGHT_CURRENT) + (performanceScore * WEIGHT_PERFORMANCE)
  return Math.round(Math.min(MAX_RATING, Math.max(MIN_RATING, newRating)) * 10) / 10
}

/**
 * Calculate rating changes for a single player based on their recent performances
 */
export async function calculatePlayerRatingChanges(
  playerId: string,
  seasonId?: string,
  matchLimit: number = 5
): Promise<RatingCalculationResult> {
  
  // Get player with current ratings
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    select: {
      id: true,
      name: true,
      primaryRole: true,
      battingSkill: true,
      bowlingSkill: true,
      fieldingSkill: true,
      powerHitting: true,
      runningBetweenWickets: true,
      pressureHandling: true,
      excludeFromAutoRating: true,
      ratingExclusionReason: true,
    }
  })
  
  if (!player) {
    throw new Error(`Player not found: ${playerId}`)
  }
  
  // If excluded, return early
  if (player.excludeFromAutoRating) {
    return {
      playerId: player.id,
      playerName: player.name,
      changes: [],
      excluded: true,
      exclusionReason: player.ratingExclusionReason || 'Excluded by admin'
    }
  }
  
  // Get recent match performances
  const performances = await prisma.matchPerformance.findMany({
    where: {
      playerId,
      match: seasonId ? { seasonId } : undefined,
    },
    include: {
      match: {
        select: { importance: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: matchLimit
  })
  
  if (performances.length === 0) {
    return {
      playerId: player.id,
      playerName: player.name,
      changes: [],
      excluded: false
    }
  }
  
  const changes: RatingChange[] = []
  
  // Calculate batting rating change
  const battingScores = performances
    .map(p => calculateBattingPerformanceScore(p as MatchPerformanceData))
    .filter(s => s >= 0)
  
  if (battingScores.length > 0) {
    const avgBattingScore = battingScores.reduce((a, b) => a + b, 0) / battingScores.length
    const newBattingRating = Math.round(calculateNewRating(player.battingSkill, avgBattingScore))
    
    if (newBattingRating !== player.battingSkill) {
      changes.push({
        playerId: player.id,
        playerName: player.name,
        skillType: 'BATTING',
        previousRating: player.battingSkill,
        newRating: newBattingRating,
        changeAmount: newBattingRating - player.battingSkill,
        performanceScore: Math.round(avgBattingScore * 10) / 10,
        reason: `Based on ${battingScores.length} recent innings`
      })
    }
  }
  
  // Calculate bowling rating change
  const bowlingScores = performances
    .map(p => calculateBowlingPerformanceScore(p as MatchPerformanceData))
    .filter(s => s >= 0)
  
  if (bowlingScores.length > 0) {
    const avgBowlingScore = bowlingScores.reduce((a, b) => a + b, 0) / bowlingScores.length
    const newBowlingRating = Math.round(calculateNewRating(player.bowlingSkill, avgBowlingScore))
    
    if (newBowlingRating !== player.bowlingSkill) {
      changes.push({
        playerId: player.id,
        playerName: player.name,
        skillType: 'BOWLING',
        previousRating: player.bowlingSkill,
        newRating: newBowlingRating,
        changeAmount: newBowlingRating - player.bowlingSkill,
        performanceScore: Math.round(avgBowlingScore * 10) / 10,
        reason: `Based on ${bowlingScores.length} recent bowling spells`
      })
    }
  }
  
  // Calculate fielding rating change
  const fieldingScores = performances.map(p => calculateFieldingPerformanceScore(p as MatchPerformanceData))
  const avgFieldingScore = fieldingScores.reduce((a, b) => a + b, 0) / fieldingScores.length
  const newFieldingRating = Math.round(calculateNewRating(player.fieldingSkill, avgFieldingScore))
  
  if (newFieldingRating !== player.fieldingSkill) {
    changes.push({
      playerId: player.id,
      playerName: player.name,
      skillType: 'FIELDING',
      previousRating: player.fieldingSkill,
      newRating: newFieldingRating,
      changeAmount: newFieldingRating - player.fieldingSkill,
      performanceScore: Math.round(avgFieldingScore * 10) / 10,
      reason: `Based on ${performances.length} recent matches`
    })
  }
  
  return {
    playerId: player.id,
    playerName: player.name,
    changes,
    excluded: false
  }
}

/**
 * Apply rating changes to a player and log to history
 */
export async function applyRatingChanges(
  changes: RatingChange[],
  matchId?: string
): Promise<void> {
  
  if (changes.length === 0) return
  
  const playerId = changes[0].playerId
  
  // Build update data
  const updateData: Record<string, number> = {}
  
  for (const change of changes) {
    switch (change.skillType) {
      case 'BATTING':
        updateData.battingSkill = change.newRating
        break
      case 'BOWLING':
        updateData.bowlingSkill = change.newRating
        break
      case 'FIELDING':
        updateData.fieldingSkill = change.newRating
        break
      case 'POWER_HITTING':
        updateData.powerHitting = change.newRating
        break
      case 'RUNNING_BETWEEN_WICKETS':
        updateData.runningBetweenWickets = change.newRating
        break
      case 'PRESSURE_HANDLING':
        updateData.pressureHandling = change.newRating
        break
    }
  }
  
  // Update player ratings
  await prisma.player.update({
    where: { id: playerId },
    data: {
      ...updateData,
      lastRatingUpdate: new Date()
    }
  })
  
  // Log rating history
  await prisma.ratingHistory.createMany({
    data: changes.map(change => ({
      playerId: change.playerId,
      matchId,
      skillType: change.skillType,
      previousRating: change.previousRating,
      newRating: change.newRating,
      changeAmount: change.changeAmount,
      performanceScore: change.performanceScore,
      reason: change.reason
    }))
  })
}

/**
 * Calculate rating changes for all players (for bulk recalculation)
 */
export async function calculateAllPlayerRatingChanges(
  seasonId?: string,
  excludePlayerIds: string[] = []
): Promise<RatingCalculationResult[]> {
  
  const players = await prisma.player.findMany({
    where: {
      isActive: true,
      id: { notIn: excludePlayerIds }
    },
    select: { id: true }
  })
  
  const results: RatingCalculationResult[] = []
  
  for (const player of players) {
    const result = await calculatePlayerRatingChanges(player.id, seasonId)
    results.push(result)
  }
  
  return results
}

/**
 * Apply all rating changes from bulk calculation
 */
export async function applyAllRatingChanges(
  results: RatingCalculationResult[],
  reason: string = 'Bulk recalculation'
): Promise<{ updated: number; skipped: number }> {
  let updated = 0
  let skipped = 0
  
  for (const result of results) {
    if (result.excluded || result.changes.length === 0) {
      skipped++
      continue
    }
    
    // Add reason to all changes
    const changesWithReason = result.changes.map(c => ({
      ...c,
      reason: reason
    }))
    
    await applyRatingChanges(changesWithReason)
    updated++
  }
  
  return { updated, skipped }
}

/**
 * Update form status based on recent performances
 */
export async function updatePlayerFormStatus(playerId: string, seasonId: string): Promise<void> {
  
  // Get last 5 performances
  const performances = await prisma.matchPerformance.findMany({
    where: {
      playerId,
      match: { seasonId }
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  })
  
  if (performances.length === 0) return
  
  // Calculate average performance score
  const scores: number[] = []
  for (const p of performances) {
    const batScore = calculateBattingPerformanceScore(p as MatchPerformanceData)
    const bowlScore = calculateBowlingPerformanceScore(p as MatchPerformanceData)
    
    // Use the better of the two scores, or average if both participated
    if (batScore >= 0 && bowlScore >= 0) {
      scores.push((batScore + bowlScore) / 2)
    } else if (batScore >= 0) {
      scores.push(batScore)
    } else if (bowlScore >= 0) {
      scores.push(bowlScore)
    }
  }
  
  if (scores.length === 0) return
  
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length
  
  // Determine form status
  let form: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR'
  if (avgScore >= 8) form = 'EXCELLENT'
  else if (avgScore >= 6) form = 'GOOD'
  else if (avgScore >= 4) form = 'AVERAGE'
  else form = 'POOR'
  
  // Update season stats
  await prisma.seasonStats.upsert({
    where: {
      playerId_seasonId: { playerId, seasonId }
    },
    update: { currentForm: form },
    create: {
      playerId,
      seasonId,
      currentForm: form
    }
  })
}
