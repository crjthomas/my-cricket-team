import Anthropic from '@anthropic-ai/sdk'
import type { Tournament, TournamentTeam, TournamentRound, TournamentFixture, GroundSlot, Venue } from '@prisma/client'

type TeamWithStats = TournamentTeam & {
  opponents?: string[]
}

type GroundSlotWithVenue = GroundSlot & {
  venue: Venue
}

interface SwissPairingInput {
  tournament: Tournament
  teams: TeamWithStats[]
  roundNumber: number
  previousPairings: { homeTeamId: string; awayTeamId: string }[]
  availableSlots: GroundSlotWithVenue[]
}

interface PairingRecommendation {
  homeTeamId: string
  awayTeamId: string
  homeTeamName: string
  awayTeamName: string
  slotId?: string
  reason: string
}

interface SwissPairingResult {
  pairings: PairingRecommendation[]
  reasoning: string
  notes: string[]
  warnings: string[]
}

interface RescheduleInput {
  tournament: Tournament
  fixture: TournamentFixture & { homeTeam?: TournamentTeam; awayTeam?: TournamentTeam }
  reason: string
  availableSlots: GroundSlotWithVenue[]
  constraints?: {
    preferredDates?: string[]
    avoidDates?: string[]
    preferredVenues?: string[]
  }
}

interface RescheduleRecommendation {
  newSlotId: string
  newDate: string
  newTime: string
  venue: string
  reason: string
  impactAnalysis: string
}

interface FormatAnalysisInput {
  documentText: string
}

interface FormatAnalysisResult {
  formatType: string
  totalRounds: number | null
  pairingRules: string[]
  tiebreakerRules: string[]
  specialRules: string[]
  suggestions: string
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

function formatTeamData(team: TeamWithStats): string {
  return `
- ${team.teamName}${team.shortName ? ` (${team.shortName})` : ''}
  Seed: ${team.seedRank || 'Unseeded'}
  Points: ${team.points} | W-L-D: ${team.wins}-${team.losses}-${team.draws}
  Buchholz: ${team.buchholzScore.toFixed(1)}
  ${team.groupName ? `Group: ${team.groupName}` : ''}
  ${team.isConfirmed ? '✓ Confirmed' : '⏳ Pending'}
  Opponents played: ${team.opponents?.join(', ') || 'None yet'}`
}

function formatSlotData(slot: GroundSlotWithVenue): string {
  const date = new Date(slot.date).toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  })
  return `- Slot ${slot.id.slice(-6)}: ${slot.venue.name} on ${date} (${slot.startTime}-${slot.endTime})${slot.isPrimary ? ' [Primary]' : ''}`
}

export async function generateSwissPairings(input: SwissPairingInput): Promise<SwissPairingResult> {
  const { tournament, teams, roundNumber, previousPairings, availableSlots } = input

  const activeTeams = teams.filter(t => !t.isWithdrawn)
  const teamData = activeTeams.map(formatTeamData).join('\n')
  const slotData = availableSlots.filter(s => s.isAvailable && !s.isBlocked).map(formatSlotData).join('\n')

  const previousPairingsList = previousPairings.map(p => {
    const home = teams.find(t => t.id === p.homeTeamId)
    const away = teams.find(t => t.id === p.awayTeamId)
    return `${home?.teamName || 'Unknown'} vs ${away?.teamName || 'Unknown'}`
  }).join('\n')

  const prompt = `You are an expert tournament scheduler specializing in Swiss system tournaments.

## TOURNAMENT: ${tournament.name}
Format: ${tournament.formatType}
Total Rounds: ${tournament.totalRounds || 'TBD'}
Current Round: ${roundNumber}
Match Format: ${tournament.matchFormat} (${tournament.overs} overs)

## SWISS SYSTEM RULES
1. Teams with similar points should play each other (pairing by score)
2. No team should play the same opponent twice
3. Each team plays exactly once per round
4. If odd number of teams, one team gets a bye (counts as a win with default points)
5. Consider Buchholz score (sum of opponents' scores) as first tiebreaker
6. Avoid back-to-back games at the same venue for a team if possible

## ACTIVE TEAMS (${activeTeams.length})
${teamData}

## PREVIOUS PAIRINGS (to avoid repeats)
${previousPairingsList || 'None - this is Round 1'}

## AVAILABLE GROUND SLOTS
${slotData || 'No slots specified yet'}

## TASK
Generate optimal pairings for Round ${roundNumber}. For each pairing:
1. Select two teams that haven't played each other
2. Prioritize matching teams with similar points
3. Assign an appropriate ground slot if available
4. Explain the reasoning

Respond in this exact JSON format:
{
  "pairings": [
    {
      "homeTeamId": "team-id-1",
      "awayTeamId": "team-id-2",
      "homeTeamName": "Team Name 1",
      "awayTeamName": "Team Name 2",
      "slotId": "slot-id or null",
      "reason": "Brief explanation of why these teams are paired"
    }
  ],
  "reasoning": "Overall explanation of the pairing strategy",
  "notes": ["Important notes about the pairings"],
  "warnings": ["Any concerns or issues to address"]
}

Important: Return ONLY valid JSON, no markdown or explanations outside the JSON.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    const result = JSON.parse(content.text.trim())
    return result as SwissPairingResult
  } catch (error) {
    console.error('Swiss pairing AI error:', error)
    return {
      pairings: [],
      reasoning: 'AI pairing failed - manual pairing required',
      notes: [],
      warnings: ['AI service error: ' + (error instanceof Error ? error.message : 'Unknown error')],
    }
  }
}

export async function suggestReschedule(input: RescheduleInput): Promise<RescheduleRecommendation[]> {
  const { tournament, fixture, reason, availableSlots, constraints } = input

  const slotData = availableSlots
    .filter(s => s.isAvailable && !s.isBlocked)
    .map(formatSlotData)
    .join('\n')

  const prompt = `You are an expert tournament scheduler helping to reschedule a cricket match.

## TOURNAMENT: ${tournament.name}
Format: ${tournament.matchFormat} (${tournament.overs} overs)

## MATCH TO RESCHEDULE
${fixture.homeTeam?.teamName || fixture.homePlaceholder || 'TBD'} vs ${fixture.awayTeam?.teamName || fixture.awayPlaceholder || 'TBD'}
Original Date: ${fixture.scheduledDate ? new Date(fixture.scheduledDate).toLocaleDateString() : 'Not set'}
Original Time: ${fixture.scheduledTime || 'Not set'}
Reason for reschedule: ${reason}

## CONSTRAINTS
Preferred dates: ${constraints?.preferredDates?.join(', ') || 'None specified'}
Dates to avoid: ${constraints?.avoidDates?.join(', ') || 'None'}
Preferred venues: ${constraints?.preferredVenues?.join(', ') || 'Any'}

## AVAILABLE SLOTS
${slotData || 'No available slots'}

## TASK
Suggest the best rescheduling options considering:
1. Minimal disruption to the tournament schedule
2. Fair notice period for teams
3. Venue availability and preference
4. Impact on other matches

Respond in this exact JSON format:
{
  "recommendations": [
    {
      "newSlotId": "slot-id",
      "newDate": "YYYY-MM-DD",
      "newTime": "HH:MM",
      "venue": "Venue Name",
      "reason": "Why this slot is recommended",
      "impactAnalysis": "How this affects other matches/teams"
    }
  ]
}

Return ONLY valid JSON.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    const result = JSON.parse(content.text.trim())
    return result.recommendations as RescheduleRecommendation[]
  } catch (error) {
    console.error('Reschedule AI error:', error)
    return []
  }
}

export async function analyzeFormatDocument(input: FormatAnalysisInput): Promise<FormatAnalysisResult> {
  const { documentText } = input

  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is not set')
    return {
      formatType: 'CUSTOM',
      totalRounds: null,
      pairingRules: [],
      tiebreakerRules: [],
      specialRules: [],
      suggestions: 'AI analysis not available. API key not configured. Please configure the format manually.',
    }
  }

  const prompt = `You are an expert in cricket tournament formats. Analyze the following tournament format document and extract the key rules.

## DOCUMENT CONTENT
${documentText.slice(0, 10000)}

## TASK
Extract and summarize:
1. Tournament format type (Swiss, Knockout, Round Robin, Groups+Knockout, etc.)
2. Number of rounds or stages
3. Pairing rules (how teams are matched each round)
4. Tiebreaker rules (how standings are determined)
5. Any special rules or conditions

Respond in this exact JSON format:
{
  "formatType": "SWISS" | "KNOCKOUT" | "ROUND_ROBIN" | "GROUP_STAGE_KNOCKOUT" | "DOUBLE_ELIMINATION" | "CUSTOM",
  "totalRounds": number or null,
  "pairingRules": ["Rule 1", "Rule 2"],
  "tiebreakerRules": ["Tiebreaker 1", "Tiebreaker 2"],
  "specialRules": ["Special rule 1"],
  "suggestions": "Summary of the format and recommendations for setup"
}

Return ONLY valid JSON.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    // Try to extract JSON from the response
    let jsonText = content.text.trim()
    // Handle case where response might have markdown code blocks
    const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonText = jsonMatch[1].trim()
    }

    const result = JSON.parse(jsonText)
    return result as FormatAnalysisResult
  } catch (error) {
    console.error('Format analysis AI error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return {
      formatType: 'CUSTOM',
      totalRounds: null,
      pairingRules: [],
      tiebreakerRules: [],
      specialRules: [],
      suggestions: `AI analysis failed: ${errorMessage}. Please configure the format manually.`,
    }
  }
}

export async function calculateBuchholzScores(
  teams: TournamentTeam[],
  fixtures: TournamentFixture[]
): Promise<Map<string, number>> {
  const scores = new Map<string, number>()
  const teamPoints = new Map<string, number>()
  
  teams.forEach(t => teamPoints.set(t.id, t.points))
  
  teams.forEach(team => {
    let buchholz = 0
    
    fixtures
      .filter(f => 
        f.status === 'COMPLETED' && 
        (f.homeTeamId === team.id || f.awayTeamId === team.id)
      )
      .forEach(f => {
        const opponentId = f.homeTeamId === team.id ? f.awayTeamId : f.homeTeamId
        if (opponentId) {
          buchholz += teamPoints.get(opponentId) || 0
        }
      })
    
    scores.set(team.id, buchholz)
  })
  
  return scores
}

export function calculateNetRunRate(team: TournamentTeam): number {
  if (team.oversBowled === 0 || team.oversPlayed === 0) {
    return 0
  }
  
  const runsPerOverScored = team.runsScored / team.oversPlayed
  const runsPerOverConceded = team.runsConceded / team.oversBowled
  
  return runsPerOverScored - runsPerOverConceded
}

export function rankTeams(teams: TournamentTeam[]): TournamentTeam[] {
  return [...teams].sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points
    if (a.buchholzScore !== b.buchholzScore) return b.buchholzScore - a.buchholzScore
    
    const nrrA = calculateNetRunRate(a)
    const nrrB = calculateNetRunRate(b)
    if (nrrA !== nrrB) return nrrB - nrrA
    
    if (a.wins !== b.wins) return b.wins - a.wins
    
    return 0
  })
}
