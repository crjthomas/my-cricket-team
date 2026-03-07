/**
 * Natural Language Query Service
 * Allows users to ask questions about their team in plain English
 */

import Anthropic from '@anthropic-ai/sdk'
import { aiCache, CacheKeys } from './cache'

export interface NLQueryInput {
  query: string
  context: {
    players: PlayerContext[]
    recentMatches?: MatchContext[]
    upcomingMatch?: MatchContext
    seasonStats?: SeasonContext
  }
}

interface PlayerContext {
  id: string
  name: string
  role: string
  battingSkill: number
  bowlingSkill: number
  fieldingSkill: number
  form: string
  matchesPlayed: number
  matchesAvailable: number
  isActive: boolean
  isCaptain: boolean
  isViceCaptain: boolean
  isWicketkeeper: boolean
  recentPerformance?: string
}

interface MatchContext {
  opponent: string
  date: string
  result?: string
  venue?: string
}

interface SeasonContext {
  matchesPlayed: number
  wins: number
  losses: number
  draws: number
  position?: number
}

export interface NLQueryResult {
  answer: string
  relevantPlayers?: string[]
  suggestions?: string[]
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  queryType: 'PLAYER_SEARCH' | 'STATS' | 'RECOMMENDATION' | 'COMPARISON' | 'GENERAL'
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

function formatContext(context: NLQueryInput['context']): string {
  const { players, recentMatches, upcomingMatch, seasonStats } = context

  let contextStr = '## TEAM ROSTER\n'
  players.forEach(p => {
    const playRate = p.matchesAvailable > 0 
      ? ((p.matchesPlayed / p.matchesAvailable) * 100).toFixed(0) 
      : 'N/A'
    contextStr += `- ${p.name}: ${p.role.replace(/_/g, ' ')} | Bat: ${p.battingSkill}/10, Bowl: ${p.bowlingSkill}/10 | Form: ${p.form} | Played: ${p.matchesPlayed}/${p.matchesAvailable} (${playRate}%)`
    if (p.isCaptain) contextStr += ' [CAPTAIN]'
    if (p.isViceCaptain) contextStr += ' [VICE-CAPTAIN]'
    if (p.isWicketkeeper) contextStr += ' [WK]'
    if (!p.isActive) contextStr += ' [INACTIVE]'
    contextStr += '\n'
  })

  if (seasonStats) {
    contextStr += `\n## SEASON STATS\n`
    contextStr += `Matches: ${seasonStats.matchesPlayed} | W: ${seasonStats.wins} L: ${seasonStats.losses} D: ${seasonStats.draws}`
    if (seasonStats.position) contextStr += ` | Position: ${seasonStats.position}`
    contextStr += '\n'
  }

  if (recentMatches && recentMatches.length > 0) {
    contextStr += `\n## RECENT MATCHES\n`
    recentMatches.forEach(m => {
      contextStr += `- vs ${m.opponent} (${m.date}): ${m.result || 'Upcoming'}\n`
    })
  }

  if (upcomingMatch) {
    contextStr += `\n## UPCOMING MATCH\nvs ${upcomingMatch.opponent} on ${upcomingMatch.date}`
    if (upcomingMatch.venue) contextStr += ` at ${upcomingMatch.venue}`
    contextStr += '\n'
  }

  return contextStr
}

function classifyQuery(query: string): NLQueryResult['queryType'] {
  const lowerQuery = query.toLowerCase()
  
  if (lowerQuery.includes('compare') || lowerQuery.includes('vs') || lowerQuery.includes('better')) {
    return 'COMPARISON'
  }
  if (lowerQuery.includes('who should') || lowerQuery.includes('recommend') || lowerQuery.includes('suggest') || lowerQuery.includes('pick')) {
    return 'RECOMMENDATION'
  }
  if (lowerQuery.includes('stats') || lowerQuery.includes('average') || lowerQuery.includes('how many') || lowerQuery.includes('total')) {
    return 'STATS'
  }
  if (lowerQuery.includes('who') || lowerQuery.includes('which player') || lowerQuery.includes('find') || lowerQuery.includes('list')) {
    return 'PLAYER_SEARCH'
  }
  return 'GENERAL'
}

export async function processNLQuery(input: NLQueryInput): Promise<NLQueryResult> {
  const { query, context } = input

  // Check cache first
  const cacheKey = { query: query.toLowerCase().trim(), playerCount: context.players.length }
  const cached = aiCache.get<NLQueryResult>(CacheKeys.NL_QUERY, cacheKey)
  if (cached) {
    return cached
  }

  // Try rules-based response first for common queries
  const rulesBasedResult = tryRulesBasedResponse(query, context)
  if (rulesBasedResult) {
    aiCache.set(CacheKeys.NL_QUERY, cacheKey, rulesBasedResult, { ttlMinutes: 30 })
    return rulesBasedResult
  }

  // If no API key, return helpful message
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      answer: "AI assistant is not configured. Here's what I found based on your roster data.",
      relevantPlayers: [],
      suggestions: ['Configure ANTHROPIC_API_KEY for AI-powered responses'],
      confidence: 'LOW',
      queryType: classifyQuery(query)
    }
  }

  const queryType = classifyQuery(query)
  const contextStr = formatContext(context)

  const prompt = `You are a cricket team assistant. Answer questions about the team based on the provided data.

${contextStr}

## USER QUESTION
${query}

## INSTRUCTIONS
1. Answer the question directly and concisely
2. Reference specific players by name when relevant
3. If recommending players, explain why
4. If data is insufficient, say so
5. Keep response under 200 words

## RESPONSE FORMAT (JSON)
{
  "answer": "Your response here",
  "relevantPlayers": ["Player Name 1", "Player Name 2"],
  "suggestions": ["Optional follow-up suggestions"],
  "confidence": "HIGH" | "MEDIUM" | "LOW"
}

Return ONLY valid JSON.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
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
    const finalResult: NLQueryResult = {
      answer: result.answer || 'Unable to process query.',
      relevantPlayers: result.relevantPlayers || [],
      suggestions: result.suggestions || [],
      confidence: result.confidence || 'MEDIUM',
      queryType
    }

    aiCache.set(CacheKeys.NL_QUERY, cacheKey, finalResult, { ttlMinutes: 30 })
    return finalResult

  } catch (error) {
    console.error('NL Query AI error:', error)
    return {
      answer: `I couldn't process that query. ${error instanceof Error ? error.message : 'Please try rephrasing.'}`,
      relevantPlayers: [],
      suggestions: ['Try asking about specific players', 'Ask about team selection', 'Query player stats'],
      confidence: 'LOW',
      queryType
    }
  }
}

function tryRulesBasedResponse(query: string, context: NLQueryInput['context']): NLQueryResult | null {
  const lowerQuery = query.toLowerCase()
  const { players } = context

  // "Who is the captain?"
  if (lowerQuery.includes('captain') && !lowerQuery.includes('vice')) {
    const captain = players.find(p => p.isCaptain)
    if (captain) {
      return {
        answer: `${captain.name} is the team captain.`,
        relevantPlayers: [captain.name],
        confidence: 'HIGH',
        queryType: 'PLAYER_SEARCH'
      }
    }
  }

  // "Who is the vice captain?"
  if (lowerQuery.includes('vice captain') || lowerQuery.includes('vice-captain')) {
    const vc = players.find(p => p.isViceCaptain)
    if (vc) {
      return {
        answer: `${vc.name} is the vice-captain.`,
        relevantPlayers: [vc.name],
        confidence: 'HIGH',
        queryType: 'PLAYER_SEARCH'
      }
    }
  }

  // "Who are the wicketkeepers?"
  if (lowerQuery.includes('wicketkeeper') || lowerQuery.includes('keeper')) {
    const keepers = players.filter(p => p.isWicketkeeper)
    if (keepers.length > 0) {
      return {
        answer: `Wicketkeeper(s): ${keepers.map(k => k.name).join(', ')}`,
        relevantPlayers: keepers.map(k => k.name),
        confidence: 'HIGH',
        queryType: 'PLAYER_SEARCH'
      }
    }
  }

  // "Who hasn't played recently?" or "players with low opportunities"
  if (lowerQuery.includes('hasn\'t played') || lowerQuery.includes('haven\'t played') || 
      lowerQuery.includes('not played') || lowerQuery.includes('low opportunities') ||
      lowerQuery.includes('need more games')) {
    const lowPlaytime = players
      .filter(p => p.isActive && p.matchesAvailable > 0)
      .filter(p => (p.matchesPlayed / p.matchesAvailable) < 0.5)
      .sort((a, b) => (a.matchesPlayed / a.matchesAvailable) - (b.matchesPlayed / b.matchesAvailable))
      .slice(0, 5)

    if (lowPlaytime.length > 0) {
      const list = lowPlaytime.map(p => {
        const pct = ((p.matchesPlayed / p.matchesAvailable) * 100).toFixed(0)
        return `${p.name} (${p.matchesPlayed}/${p.matchesAvailable} = ${pct}%)`
      }).join(', ')
      return {
        answer: `Players with fewer opportunities: ${list}`,
        relevantPlayers: lowPlaytime.map(p => p.name),
        suggestions: ['Consider giving these players more game time'],
        confidence: 'HIGH',
        queryType: 'PLAYER_SEARCH'
      }
    }
  }

  // "Best batsmen" or "top batsmen"
  if ((lowerQuery.includes('best') || lowerQuery.includes('top')) && 
      (lowerQuery.includes('batsman') || lowerQuery.includes('batsmen') || lowerQuery.includes('batter'))) {
    const topBatsmen = players
      .filter(p => p.isActive)
      .sort((a, b) => b.battingSkill - a.battingSkill)
      .slice(0, 5)

    return {
      answer: `Top batsmen by skill: ${topBatsmen.map(p => `${p.name} (${p.battingSkill}/10)`).join(', ')}`,
      relevantPlayers: topBatsmen.map(p => p.name),
      confidence: 'HIGH',
      queryType: 'PLAYER_SEARCH'
    }
  }

  // "Best bowlers" or "top bowlers"
  if ((lowerQuery.includes('best') || lowerQuery.includes('top')) && 
      (lowerQuery.includes('bowler') || lowerQuery.includes('bowling'))) {
    const topBowlers = players
      .filter(p => p.isActive)
      .sort((a, b) => b.bowlingSkill - a.bowlingSkill)
      .slice(0, 5)

    return {
      answer: `Top bowlers by skill: ${topBowlers.map(p => `${p.name} (${p.bowlingSkill}/10)`).join(', ')}`,
      relevantPlayers: topBowlers.map(p => p.name),
      confidence: 'HIGH',
      queryType: 'PLAYER_SEARCH'
    }
  }

  // "How many players" or "total players"
  if (lowerQuery.includes('how many players') || lowerQuery.includes('total players')) {
    const active = players.filter(p => p.isActive).length
    const inactive = players.filter(p => !p.isActive).length
    return {
      answer: `Total players: ${players.length} (${active} active, ${inactive} inactive)`,
      confidence: 'HIGH',
      queryType: 'STATS'
    }
  }

  // "All rounders"
  if (lowerQuery.includes('all rounder') || lowerQuery.includes('all-rounder') || lowerQuery.includes('allrounder')) {
    const allRounders = players.filter(p => 
      p.isActive && p.role.toLowerCase().includes('all_rounder')
    )
    if (allRounders.length > 0) {
      return {
        answer: `All-rounders: ${allRounders.map(p => p.name).join(', ')}`,
        relevantPlayers: allRounders.map(p => p.name),
        confidence: 'HIGH',
        queryType: 'PLAYER_SEARCH'
      }
    }
  }

  return null
}

export const EXAMPLE_QUERIES = [
  "Who should open against a strong pace attack?",
  "Which players haven't played recently?",
  "Who are our best batsmen?",
  "Compare Player A vs Player B",
  "Who is the captain?",
  "List all wicketkeepers",
  "Who are our all-rounders?",
  "Best bowler for spinning pitches?",
  "Players in good form",
  "Who needs more game time?"
]
