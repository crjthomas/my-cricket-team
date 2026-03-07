/**
 * AI Tournament Scheduler Service
 * Handles AI-powered tournament format analysis and scheduling assistance
 */

import Anthropic from '@anthropic-ai/sdk'

export interface FormatAnalysisInput {
  documentText: string
}

export interface FormatAnalysisResult {
  formatType: 'SWISS' | 'KNOCKOUT' | 'ROUND_ROBIN' | 'GROUP_STAGE_KNOCKOUT' | 'DOUBLE_ELIMINATION' | 'CUSTOM'
  totalRounds: number | null
  pairingRules: string[]
  tiebreakerRules: string[]
  specialRules: string[]
  suggestions: string
}

export interface SwissPairingInput {
  teams: TeamStanding[]
  roundNumber: number
  previousMatchups: string[][]
}

export interface TeamStanding {
  id: string
  name: string
  points: number
  buchholzScore: number
  wins: number
  losses: number
  draws: number
}

export interface SwissPairingResult {
  pairings: Array<{ homeTeam: string; awayTeam: string; reason: string }>
  byeTeam?: string
  notes: string[]
}

export interface RescheduleInput {
  fixture: {
    id: string
    homeTeam: string
    awayTeam: string
    originalDate: string
    originalVenue: string
  }
  reason: string
  availableSlots: Array<{
    date: string
    venue: string
    time: string
    slotId: string
  }>
  constraints?: string[]
}

export interface RescheduleResult {
  recommendedSlot: {
    slotId: string
    date: string
    venue: string
    time: string
    reason: string
  } | null
  alternativeSlots: Array<{
    slotId: string
    date: string
    venue: string
    time: string
    reason: string
  }>
  notes: string[]
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

function analyzeFormatManually(text: string): FormatAnalysisResult {
  const lowerText = text.toLowerCase()
  
  let formatType: FormatAnalysisResult['formatType'] = 'CUSTOM'
  if (lowerText.includes('swiss')) {
    formatType = 'SWISS'
  } else if (lowerText.includes('knockout') || lowerText.includes('elimination') || lowerText.includes('single elimination')) {
    formatType = 'KNOCKOUT'
  } else if (lowerText.includes('round robin') || lowerText.includes('round-robin')) {
    formatType = 'ROUND_ROBIN'
  } else if (lowerText.includes('group') && (lowerText.includes('knockout') || lowerText.includes('final'))) {
    formatType = 'GROUP_STAGE_KNOCKOUT'
  } else if (lowerText.includes('double elimination')) {
    formatType = 'DOUBLE_ELIMINATION'
  }

  let totalRounds: number | null = null
  const roundMatch = text.match(/(\d+)\s*(rounds?|stages?)/i)
  if (roundMatch) {
    totalRounds = parseInt(roundMatch[1])
  }

  const pairingRules: string[] = []
  const tiebreakerRules: string[] = []
  const specialRules: string[] = []

  if (lowerText.includes('points') || lowerText.includes('standings')) {
    pairingRules.push('Teams paired based on standings/points')
  }
  if (lowerText.includes('random') || lowerText.includes('draw')) {
    pairingRules.push('Random pairing for initial rounds')
  }
  if (lowerText.includes('seed')) {
    pairingRules.push('Seeded pairing based on rankings')
  }

  if (lowerText.includes('net run rate') || lowerText.includes('nrr')) {
    tiebreakerRules.push('Net Run Rate (NRR)')
  }
  if (lowerText.includes('head to head') || lowerText.includes('head-to-head')) {
    tiebreakerRules.push('Head-to-head record')
  }
  if (lowerText.includes('buchholz')) {
    tiebreakerRules.push('Buchholz score (sum of opponents points)')
  }
  if ((lowerText.includes('goal') || lowerText.includes('run')) && lowerText.includes('difference')) {
    tiebreakerRules.push('Run/Goal difference')
  }

  const formatNames: Record<string, string> = {
    'SWISS': 'Swiss System',
    'KNOCKOUT': 'Knockout',
    'ROUND_ROBIN': 'Round Robin',
    'GROUP_STAGE_KNOCKOUT': 'Groups + Knockout',
    'DOUBLE_ELIMINATION': 'Double Elimination',
    'CUSTOM': 'Custom Format'
  }

  return {
    formatType,
    totalRounds,
    pairingRules: pairingRules.length > 0 ? pairingRules : ['Configure pairing rules manually'],
    tiebreakerRules: tiebreakerRules.length > 0 ? tiebreakerRules : ['Configure tiebreaker rules manually'],
    specialRules,
    suggestions: `Detected: ${formatNames[formatType]}${totalRounds ? ` with ${totalRounds} rounds` : ''}. ${pairingRules.length > 0 || tiebreakerRules.length > 0 ? 'Some rules were extracted from your text.' : 'Please review and configure the detailed rules manually.'}`
  }
}

export async function analyzeFormatDocument(input: FormatAnalysisInput): Promise<FormatAnalysisResult> {
  const { documentText } = input

  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('ANTHROPIC_API_KEY not set, using manual analysis')
    return analyzeFormatManually(documentText)
  }

  const prompt = `Analyze this tournament format document and extract the key rules.

DOCUMENT:
${documentText}

Extract and respond with a JSON object (no markdown):
{
  "formatType": "SWISS" | "KNOCKOUT" | "ROUND_ROBIN" | "GROUP_STAGE_KNOCKOUT" | "DOUBLE_ELIMINATION" | "CUSTOM",
  "totalRounds": number or null,
  "pairingRules": ["How teams are paired each round"],
  "tiebreakerRules": ["Rules for breaking ties"],
  "specialRules": ["Any special rules or modifications"],
  "suggestions": "Brief suggestions for the tournament manager"
}

Focus on:
1. Format type (Swiss, knockout, round-robin, etc.)
2. How teams are paired/matched
3. Tiebreaker rules
4. Point systems
5. Any unique modifications to standard formats`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    let jsonText = content.text.trim()
    const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonText = jsonMatch[1].trim()
    }

    const result = JSON.parse(jsonText)
    return result as FormatAnalysisResult
  } catch (error) {
    console.error('Format analysis AI error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    const manualResult = analyzeFormatManually(documentText)
    manualResult.suggestions = `AI analysis failed: ${errorMessage}. ${manualResult.suggestions}`
    return manualResult
  }
}

export async function generateSwissPairings(input: SwissPairingInput): Promise<SwissPairingResult> {
  const { teams, roundNumber, previousMatchups } = input

  if (!process.env.ANTHROPIC_API_KEY) {
    return generateSwissPairingsManually(input)
  }

  const prompt = `Generate Swiss system pairings for Round ${roundNumber}.

CURRENT STANDINGS:
${teams.map((t, i) => `${i + 1}. ${t.name} - ${t.points} pts, W${t.wins} L${t.losses} D${t.draws}, Buchholz: ${t.buchholzScore}`).join('\n')}

PREVIOUS MATCHUPS (teams that have already played each other):
${previousMatchups.map(m => m.join(' vs ')).join('\n') || 'None'}

SWISS PAIRING RULES:
1. Teams with similar points should be paired
2. Avoid repeat matchups when possible
3. If odd number of teams, assign a bye to lowest-ranked team that hasn't had a bye

Respond with JSON (no markdown):
{
  "pairings": [
    { "homeTeam": "Team A ID", "awayTeam": "Team B ID", "reason": "Both teams on X points" }
  ],
  "byeTeam": "Team ID or null",
  "notes": ["Any notes about the pairing"]
}`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    let jsonText = content.text.trim()
    const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonText = jsonMatch[1].trim()
    }

    return JSON.parse(jsonText) as SwissPairingResult
  } catch (error) {
    console.error('Swiss pairing AI error:', error)
    return generateSwissPairingsManually(input)
  }
}

function generateSwissPairingsManually(input: SwissPairingInput): SwissPairingResult {
  const { teams, previousMatchups } = input
  
  const sortedTeams = [...teams].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    return b.buchholzScore - a.buchholzScore
  })

  const pairings: SwissPairingResult['pairings'] = []
  const paired = new Set<string>()
  let byeTeam: string | undefined

  const hasPlayed = (t1: string, t2: string) => {
    return previousMatchups.some(m => 
      (m[0] === t1 && m[1] === t2) || (m[0] === t2 && m[1] === t1)
    )
  }

  for (let i = 0; i < sortedTeams.length; i++) {
    const team1 = sortedTeams[i]
    if (paired.has(team1.id)) continue

    let found = false
    for (let j = i + 1; j < sortedTeams.length; j++) {
      const team2 = sortedTeams[j]
      if (paired.has(team2.id)) continue
      if (hasPlayed(team1.id, team2.id)) continue

      pairings.push({
        homeTeam: team1.id,
        awayTeam: team2.id,
        reason: `Ranked ${i + 1} vs ${j + 1} by standings`
      })
      paired.add(team1.id)
      paired.add(team2.id)
      found = true
      break
    }

    if (!found && !paired.has(team1.id)) {
      for (let j = i + 1; j < sortedTeams.length; j++) {
        const team2 = sortedTeams[j]
        if (paired.has(team2.id)) continue

        pairings.push({
          homeTeam: team1.id,
          awayTeam: team2.id,
          reason: `Repeat matchup necessary`
        })
        paired.add(team1.id)
        paired.add(team2.id)
        found = true
        break
      }
    }

    if (!found && !paired.has(team1.id)) {
      byeTeam = team1.id
      paired.add(team1.id)
    }
  }

  return {
    pairings,
    byeTeam,
    notes: ['Pairings generated using basic Swiss algorithm']
  }
}

export async function suggestReschedule(input: RescheduleInput): Promise<RescheduleResult> {
  const { fixture, reason, availableSlots, constraints } = input

  if (!process.env.ANTHROPIC_API_KEY || availableSlots.length === 0) {
    return suggestRescheduleManually(input)
  }

  const prompt = `Suggest the best slot to reschedule this cricket match.

FIXTURE TO RESCHEDULE:
${fixture.homeTeam} vs ${fixture.awayTeam}
Original: ${fixture.originalDate} at ${fixture.originalVenue}
Reason for reschedule: ${reason}

AVAILABLE SLOTS:
${availableSlots.map((s, i) => `${i + 1}. ${s.date} at ${s.venue} (${s.time})`).join('\n')}

CONSTRAINTS:
${constraints?.join('\n') || 'None specified'}

Select the best slot considering:
1. Fairness to both teams
2. Weather/conditions if mentioned
3. Venue preference (same venue if possible)
4. Time slot preferences

Respond with JSON (no markdown):
{
  "recommendedSlot": {
    "slotId": "ID from available slots",
    "date": "date",
    "venue": "venue",
    "time": "time",
    "reason": "Why this is the best option"
  },
  "alternativeSlots": [...],
  "notes": ["Any scheduling notes"]
}`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type')
    }

    let jsonText = content.text.trim()
    const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonText = jsonMatch[1].trim()
    }

    return JSON.parse(jsonText) as RescheduleResult
  } catch (error) {
    console.error('Reschedule AI error:', error)
    return suggestRescheduleManually(input)
  }
}

function suggestRescheduleManually(input: RescheduleInput): RescheduleResult {
  const { availableSlots, fixture } = input

  if (availableSlots.length === 0) {
    return {
      recommendedSlot: null,
      alternativeSlots: [],
      notes: ['No available slots for rescheduling']
    }
  }

  const sameVenueSlots = availableSlots.filter(s => s.venue === fixture.originalVenue)
  const sortedSlots = sameVenueSlots.length > 0 ? sameVenueSlots : availableSlots

  const recommended = sortedSlots[0]
  const alternatives = sortedSlots.slice(1, 3)

  return {
    recommendedSlot: {
      slotId: recommended.slotId,
      date: recommended.date,
      venue: recommended.venue,
      time: recommended.time,
      reason: sameVenueSlots.length > 0 
        ? 'Same venue as original fixture' 
        : 'Earliest available slot'
    },
    alternativeSlots: alternatives.map(s => ({
      slotId: s.slotId,
      date: s.date,
      venue: s.venue,
      time: s.time,
      reason: 'Alternative option'
    })),
    notes: ['Recommended based on venue preference and availability']
  }
}
