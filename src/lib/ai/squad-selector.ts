import Anthropic from '@anthropic-ai/sdk'
import type { Player, SeasonStats, Match, Opponent, Venue, Season } from '@prisma/client'

type PlayerWithStats = Player & { stats?: SeasonStats | null }

interface SquadRecommendationInput {
  players: PlayerWithStats[]
  match: Match
  opponent: Opponent
  venue: Venue
  mode: 'WIN_FOCUSED' | 'BALANCED' | 'OPPORTUNITY_FOCUSED'
  season: Season
}

interface SquadPlayerRecommendation {
  player: Player
  battingOrder: number
  roleInMatch: string
  selectionReason: string
}

interface TeamBalance {
  batsmen: number
  bowlers: number
  allRounders: number
  wicketkeepers: number
  paceOptions: number
  spinOptions: number
  leftHandBatsmen: number
  rightHandBatsmen: number
}

interface SquadRecommendation {
  selectedPlayers: SquadPlayerRecommendation[]
  reasoning: string
  teamBalance: TeamBalance
  winProbability: number
  fairnessScore: number
  warnings: string[]
  insights: string[]
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

function formatPlayerData(player: PlayerWithStats): string {
  const stats = player.stats
  const opportunityRatio = stats && stats.matchesAvailable > 0 
    ? (stats.matchesPlayed / stats.matchesAvailable * 100).toFixed(0) 
    : 'N/A'
  
  return `
- ${player.name} (Jersey #${player.jerseyNumber || 'N/A'})
  Role: ${player.primaryRole.replace(/_/g, ' ')}
  Batting: ${player.battingStyle.replace('_', '-')} | Position: ${player.battingPosition.replace('_', ' ')}
  Bowling: ${player.bowlingStyle.replace('_', ' ')}
  Skills: Batting ${player.battingSkill}/10, Bowling ${player.bowlingSkill}/10, Fielding ${player.fieldingSkill}/10
  Experience: ${player.experienceLevel}/10 | Captain's Choice: ${player.captainChoice === 1 ? '1st' : player.captainChoice === 2 ? '2nd' : '3rd'}
  ${player.isCaptain ? '★ CAPTAIN' : ''}${player.isViceCaptain ? '★ VICE-CAPTAIN' : ''}${player.isWicketkeeper ? '🧤 WICKETKEEPER' : ''}
  Season Stats: ${stats ? `Played ${stats.matchesPlayed}/${stats.matchesAvailable} (${opportunityRatio}%)` : 'No stats'}
  ${stats ? `Runs: ${stats.runsScored} | Wickets: ${stats.wicketsTaken} | Catches: ${stats.catches}` : ''}
  ${stats ? `Form: ${stats.currentForm}` : ''}`
}

function buildPrompt(input: SquadRecommendationInput): string {
  const { players, match, opponent, venue, mode, season } = input
  
  const modeDescriptions = {
    WIN_FOCUSED: 'Prioritize winning the match. Select the strongest possible XI based on skill and form.',
    BALANCED: 'Balance between winning and giving fair opportunities. Consider players who need more games while maintaining competitiveness.',
    OPPORTUNITY_FOCUSED: 'Prioritize giving playing time to players who have fewer opportunities this season, while still fielding a reasonable team.',
  }

  return `You are an expert cricket team selector and strategist. Your task is to select the best possible playing XI from the available players.

## SELECTION MODE
${modeDescriptions[mode]}

## MATCH CONTEXT
- Match Date: ${match.matchDate}
- Importance: ${match.importance.replace('_', ' ')}
- League Position: ${match.leaguePosition || 'N/A'} / ${season.totalTeams || 'N/A'}
- Matches Remaining: ${match.matchesRemaining || 'N/A'}
- Captain's Notes: ${match.captainNotes || 'None'}

## OPPONENT: ${opponent.name}
- Overall Strength: ${opponent.overallStrength}/10
- Batting Strength: ${opponent.battingStrength}/10
- Bowling Strength: ${opponent.bowlingStrength}/10
- Key Players: ${opponent.keyPlayers?.join(', ') || 'Unknown'}
- Playing Style: ${opponent.playingStyle || 'Unknown'}
- Our Record vs Them: Won ${opponent.matchesWon}, Lost ${opponent.matchesLost}, Drawn ${opponent.matchesDrawn}
- Notes: ${opponent.notes || 'None'}

## VENUE: ${venue.name}
- Pitch Type: ${venue.pitchType.replace('_', ' ')}
- Boundary Size: ${venue.boundarySize}
- Outfield Speed: ${venue.outfieldSpeed}
- Conditions: ${venue.typicalConditions || 'Unknown'}
- Average First Innings Score: ${venue.averageFirstInningsScore || 'Unknown'}

## WEATHER
${match.weather?.replace('_', ' ') || 'Unknown'}

## SEASON SUMMARY
- Season: ${season.name}
- Matches Played: ${season.matchesPlayed}/${season.totalMatches}
- Record: W${season.wins} L${season.losses} D${season.draws}
- Position: ${season.currentPosition || 'N/A'}/${season.totalTeams || 'N/A'}

## AVAILABLE PLAYERS (${players.length})
${players.map(formatPlayerData).join('\n')}

## SELECTION REQUIREMENTS
1. Select exactly 11 players for the playing XI
2. Must include at least 1 wicketkeeper
3. Must have at least 4 frontline bowling options (can include all-rounders)
4. Balance the batting order (openers, middle order, finishers)
5. Consider pitch conditions when selecting pace vs spin bowlers
6. Factor in player form and recent performance
7. Consider opportunity ratios - players with low played/available ratios deserve chances

## OUTPUT FORMAT
Respond with a JSON object (no markdown formatting):
{
  "selectedPlayers": [
    {
      "playerId": "player_id_here",
      "name": "Player Name",
      "battingOrder": 1,
      "roleInMatch": "Opening batsman",
      "selectionReason": "Brief reason for selection"
    }
  ],
  "reasoning": "Overall reasoning for team selection (2-3 paragraphs)",
  "teamBalance": {
    "batsmen": 0,
    "bowlers": 0,
    "allRounders": 0,
    "wicketkeepers": 0,
    "paceOptions": 0,
    "spinOptions": 0,
    "leftHandBatsmen": 0,
    "rightHandBatsmen": 0
  },
  "winProbability": 65,
  "fairnessScore": 75,
  "warnings": ["Any concerns about the selection"],
  "insights": ["Tactical insights for the match"]
}

Remember:
- Order players by batting order (1-11)
- Be specific about each player's role in this match
- Consider the opponent's weaknesses
- Account for pitch and weather conditions`
}

export async function generateSquadRecommendation(
  input: SquadRecommendationInput
): Promise<SquadRecommendation> {
  const { players } = input

  // If API key is not set, use fallback logic
  if (!process.env.ANTHROPIC_API_KEY) {
    return generateFallbackRecommendation(input)
  }

  try {
    const prompt = buildPrompt(input)

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    // Parse JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Could not parse JSON from response')
    }

    const aiResult = JSON.parse(jsonMatch[0])

    // Map player IDs back to actual player objects
    const selectedPlayers: SquadPlayerRecommendation[] = aiResult.selectedPlayers.map(
      (sp: { playerId?: string; name: string; battingOrder: number; roleInMatch: string; selectionReason: string }) => {
        const player = players.find(
          (p) => p.id === sp.playerId || p.name.toLowerCase() === sp.name.toLowerCase()
        )
        if (!player) {
          console.warn(`Could not find player: ${sp.name}`)
          return null
        }
        return {
          player,
          battingOrder: sp.battingOrder,
          roleInMatch: sp.roleInMatch,
          selectionReason: sp.selectionReason,
        }
      }
    ).filter(Boolean) as SquadPlayerRecommendation[]

    // Ensure we have 11 players
    if (selectedPlayers.length < 11 && players.length >= 11) {
      // Fill with remaining players
      const selectedIds = new Set(selectedPlayers.map((sp) => sp.player.id))
      const remaining = players.filter((p) => !selectedIds.has(p.id))
      
      let order = selectedPlayers.length + 1
      for (const player of remaining) {
        if (selectedPlayers.length >= 11) break
        selectedPlayers.push({
          player,
          battingOrder: order++,
          roleInMatch: player.primaryRole.replace(/_/g, ' ').toLowerCase(),
          selectionReason: 'Added to complete the XI',
        })
      }
    }

    return {
      selectedPlayers,
      reasoning: aiResult.reasoning || 'AI-generated squad selection',
      teamBalance: aiResult.teamBalance || calculateTeamBalance(selectedPlayers.map((sp) => sp.player)),
      winProbability: aiResult.winProbability || 50,
      fairnessScore: aiResult.fairnessScore || 50,
      warnings: aiResult.warnings || [],
      insights: aiResult.insights || [],
    }
  } catch (error) {
    console.error('AI squad generation error:', error)
    return generateFallbackRecommendation(input)
  }
}

function calculateTeamBalance(players: Player[]): TeamBalance {
  return {
    batsmen: players.filter((p) => p.primaryRole === 'BATSMAN').length,
    bowlers: players.filter((p) => p.primaryRole === 'BOWLER').length,
    allRounders: players.filter((p) => p.primaryRole === 'ALL_ROUNDER').length,
    wicketkeepers: players.filter((p) => p.primaryRole === 'WICKETKEEPER' || p.isWicketkeeper).length,
    paceOptions: players.filter((p) => ['FAST', 'MEDIUM_FAST', 'MEDIUM'].includes(p.bowlingStyle)).length,
    spinOptions: players.filter((p) => ['SPIN_OFF', 'SPIN_LEG', 'SPIN_LEFT_ARM'].includes(p.bowlingStyle)).length,
    leftHandBatsmen: players.filter((p) => p.battingStyle === 'LEFT_HAND').length,
    rightHandBatsmen: players.filter((p) => p.battingStyle === 'RIGHT_HAND').length,
  }
}

function generateFallbackRecommendation(input: SquadRecommendationInput): SquadRecommendation {
  const { players, opponent, venue, mode } = input

  // Sort players by a scoring algorithm
  const scoredPlayers = players.map((player) => {
    let score = 0
    const stats = player.stats

    // Base skill score
    score += player.battingSkill * 2
    score += player.bowlingSkill * 2
    score += player.fieldingSkill
    score += player.experienceLevel

    // Captain's preference
    score += (4 - player.captainChoice) * 5

    // Form bonus
    if (stats) {
      if (stats.currentForm === 'EXCELLENT') score += 15
      else if (stats.currentForm === 'GOOD') score += 10
      else if (stats.currentForm === 'AVERAGE') score += 5
    }

    // Mode adjustments
    if (mode === 'OPPORTUNITY_FOCUSED' && stats) {
      const ratio = stats.matchesAvailable > 0 ? stats.matchesPlayed / stats.matchesAvailable : 0
      score += (1 - ratio) * 20 // Boost players with fewer games
    }

    // Pitch adjustments
    if (venue.pitchType === 'SPIN_FRIENDLY' && ['SPIN_OFF', 'SPIN_LEG', 'SPIN_LEFT_ARM'].includes(player.bowlingStyle)) {
      score += 10
    }
    if (venue.pitchType === 'PACE_FRIENDLY' && ['FAST', 'MEDIUM_FAST'].includes(player.bowlingStyle)) {
      score += 10
    }

    return { player, score }
  })

  // Select team with balance
  const selected: PlayerWithStats[] = []
  const roles = {
    wicketkeeper: 0,
    batsman: 0,
    allRounder: 0,
    bowler: 0,
  }

  // Sort by score
  scoredPlayers.sort((a, b) => b.score - a.score)

  // First, ensure we have a wicketkeeper
  const keeper = scoredPlayers.find((sp) => sp.player.isWicketkeeper || sp.player.primaryRole === 'WICKETKEEPER')
  if (keeper) {
    selected.push(keeper.player)
    roles.wicketkeeper = 1
  }

  // Then fill the rest maintaining balance
  for (const sp of scoredPlayers) {
    if (selected.length >= 11) break
    if (selected.includes(sp.player)) continue

    const role = sp.player.primaryRole
    if (role === 'BATSMAN' && roles.batsman < 5) {
      selected.push(sp.player)
      roles.batsman++
    } else if (role === 'BOWLER' && roles.bowler < 4) {
      selected.push(sp.player)
      roles.bowler++
    } else if (role === 'ALL_ROUNDER' && roles.allRounder < 3) {
      selected.push(sp.player)
      roles.allRounder++
    } else if (selected.length < 11) {
      selected.push(sp.player)
    }
  }

  // Fill remaining slots
  for (const sp of scoredPlayers) {
    if (selected.length >= 11) break
    if (!selected.includes(sp.player)) {
      selected.push(sp.player)
    }
  }

  // Sort by batting position for batting order
  const positionOrder = ['OPENER', 'TOP_ORDER', 'MIDDLE_ORDER', 'LOWER_ORDER', 'FINISHER']
  selected.sort((a, b) => {
    const aPos = positionOrder.indexOf(a.battingPosition)
    const bPos = positionOrder.indexOf(b.battingPosition)
    if (aPos !== bPos) return aPos - bPos
    return b.battingSkill - a.battingSkill
  })

  // Calculate fairness score
  let totalRatio = 0
  let countWithStats = 0
  for (const player of selected) {
    const stats = player.stats
    if (stats && stats.matchesAvailable > 0) {
      totalRatio += stats.matchesPlayed / stats.matchesAvailable
      countWithStats++
    }
  }
  // Fairness is higher when we select players with lower ratios
  const avgRatio = countWithStats > 0 ? totalRatio / countWithStats : 0.5
  const fairnessScore = Math.round(100 - avgRatio * 50)

  // Calculate win probability based on skills vs opponent
  const avgSkill = selected.reduce((sum, p) => sum + (p.battingSkill + p.bowlingSkill) / 2, 0) / selected.length
  const opponentAvg = (opponent.battingStrength + opponent.bowlingStrength) / 2
  const winProbability = Math.min(85, Math.max(25, 50 + (avgSkill - opponentAvg) * 5))

  const selectedPlayers: SquadPlayerRecommendation[] = selected.map((player, index) => ({
    player,
    battingOrder: index + 1,
    roleInMatch: getRoleDescription(player, index),
    selectionReason: getSelectionReason(player, mode),
  }))

  return {
    selectedPlayers,
    reasoning: generateReasoning(selected, opponent, venue, mode),
    teamBalance: calculateTeamBalance(selected),
    winProbability: Math.round(winProbability),
    fairnessScore,
    warnings: generateWarnings(selected, players),
    insights: generateInsights(selected, opponent, venue),
  }
}

function getRoleDescription(player: Player, battingOrder: number): string {
  if (battingOrder <= 2) return 'Opening batsman'
  if (battingOrder <= 4) return 'Top order batsman'
  if (player.primaryRole === 'WICKETKEEPER') return 'Wicketkeeper-batsman'
  if (player.primaryRole === 'ALL_ROUNDER') return 'All-rounder'
  if (battingOrder <= 7) return 'Middle order batsman'
  if (player.primaryRole === 'BOWLER') {
    if (['FAST', 'MEDIUM_FAST'].includes(player.bowlingStyle)) return 'Pace bowler'
    if (player.bowlingStyle.startsWith('SPIN')) return 'Spin bowler'
    return 'Medium pace bowler'
  }
  return 'Lower order batsman'
}

function getSelectionReason(player: PlayerWithStats, mode: string): string {
  const stats = player.stats
  const reasons: string[] = []

  if (player.captainChoice === 1) reasons.push("Captain's first choice")
  if (player.isCaptain) reasons.push('Team captain')
  if (stats?.currentForm === 'EXCELLENT') reasons.push('Excellent form')
  if (stats?.currentForm === 'GOOD') reasons.push('Good form')
  
  if (mode === 'OPPORTUNITY_FOCUSED' && stats) {
    const ratio = stats.matchesAvailable > 0 ? stats.matchesPlayed / stats.matchesAvailable : 0
    if (ratio < 0.5) reasons.push('Deserves more playing time')
  }

  if (player.battingSkill >= 8) reasons.push('Key batsman')
  if (player.bowlingSkill >= 8) reasons.push('Key bowler')
  if (player.isWicketkeeper) reasons.push('Primary wicketkeeper')

  return reasons.length > 0 ? reasons.join('. ') + '.' : 'Solid team player.'
}

function generateReasoning(selected: Player[], opponent: Opponent, venue: Venue, mode: string): string {
  const paceCount = selected.filter((p) => ['FAST', 'MEDIUM_FAST'].includes(p.bowlingStyle)).length
  const spinCount = selected.filter((p) => p.bowlingStyle.startsWith('SPIN')).length

  let reasoning = `Team selected in ${mode.replace('_', ' ').toLowerCase()} mode. `

  reasoning += `Against ${opponent.name} (strength ${opponent.overallStrength}/10), we have assembled a balanced XI. `

  if (venue.pitchType === 'SPIN_FRIENDLY') {
    reasoning += `Given the spin-friendly conditions at ${venue.name}, we've included ${spinCount} spin options. `
  } else if (venue.pitchType === 'PACE_FRIENDLY') {
    reasoning += `The pace-friendly pitch at ${venue.name} influenced our selection of ${paceCount} pace bowlers. `
  }

  if (mode === 'OPPORTUNITY_FOCUSED') {
    reasoning += `Special consideration was given to players who have had fewer opportunities this season. `
  } else if (mode === 'WIN_FOCUSED') {
    reasoning += `Selection prioritized our strongest XI based on current form and match-ups. `
  }

  return reasoning
}

function generateWarnings(selected: Player[], allPlayers: PlayerWithStats[]): string[] {
  const warnings: string[] = []

  // Check wicketkeeper
  if (!selected.some((p) => p.isWicketkeeper || p.primaryRole === 'WICKETKEEPER')) {
    warnings.push('No designated wicketkeeper in the XI')
  }

  // Check bowling options
  const bowlers = selected.filter((p) => p.bowlingSkill >= 5 || p.primaryRole === 'BOWLER' || p.primaryRole === 'ALL_ROUNDER')
  if (bowlers.length < 5) {
    warnings.push('Limited bowling options - may struggle to complete overs')
  }

  // Check players missing out
  const missedFirstChoice = allPlayers.filter(
    (p) => p.captainChoice === 1 && !selected.some((s) => s.id === p.id)
  )
  if (missedFirstChoice.length > 0) {
    warnings.push(`First-choice players not selected: ${missedFirstChoice.map((p) => p.name).join(', ')}`)
  }

  return warnings
}

function generateInsights(selected: Player[], opponent: Opponent, venue: Venue): string[] {
  const insights: string[] = []

  // Batting depth
  const strongBatsmen = selected.filter((p) => p.battingSkill >= 7).length
  if (strongBatsmen >= 6) {
    insights.push('Strong batting depth should allow aggressive approach')
  }

  // Against opponent weaknesses
  if (opponent.battingStrength > opponent.bowlingStrength) {
    insights.push(`${opponent.name}'s batting is stronger than bowling - bowl first if possible`)
  } else if (opponent.bowlingStrength > opponent.battingStrength) {
    insights.push(`${opponent.name}'s bowling is stronger - be cautious in the first few overs`)
  }

  // Venue insight
  if (venue.boundarySize === 'SMALL') {
    insights.push('Small boundaries favor attacking batting')
  } else if (venue.boundarySize === 'LARGE') {
    insights.push('Large ground - running between wickets will be crucial')
  }

  return insights
}

