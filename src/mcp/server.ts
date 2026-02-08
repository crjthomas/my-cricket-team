/**
 * MCP (Model Context Protocol) Server for Cricket Team Management
 * 
 * This server provides structured tools for AI assistants to interact
 * with the cricket team management system.
 * 
 * Run with: npx tsx src/mcp/server.ts
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'

// Types
interface Player {
  id: string
  name: string
  jerseyNumber: number
  role: string
  battingSkill: number
  bowlingSkill: number
  fieldingSkill: number
  form: string
  matchesPlayed: number
  matchesAvailable: number
  runsScored: number
  wicketsTaken: number
}

interface Match {
  id: string
  matchNumber: number
  opponent: string
  venue: string
  date: string
  importance: string
  result?: string
}

interface SquadRecommendation {
  players: Array<{ name: string; battingOrder: number; reason: string }>
  reasoning: string
  winProbability: number
  fairnessScore: number
}

// Mock data (in production, this would connect to the database)
const players: Player[] = [
  { id: '1', name: 'Raj Kumar', jerseyNumber: 7, role: 'BATSMAN', battingSkill: 9, bowlingSkill: 4, fieldingSkill: 8, form: 'EXCELLENT', matchesPlayed: 6, matchesAvailable: 6, runsScored: 285, wicketsTaken: 0 },
  { id: '2', name: 'Amit Singh', jerseyNumber: 11, role: 'ALL_ROUNDER', battingSkill: 7, bowlingSkill: 8, fieldingSkill: 7, form: 'GOOD', matchesPlayed: 5, matchesAvailable: 6, runsScored: 145, wicketsTaken: 8 },
  { id: '3', name: 'Vikram Patel', jerseyNumber: 45, role: 'BOWLER', battingSkill: 3, bowlingSkill: 9, fieldingSkill: 6, form: 'EXCELLENT', matchesPlayed: 6, matchesAvailable: 6, runsScored: 15, wicketsTaken: 12 },
  { id: '4', name: 'Suresh Menon', jerseyNumber: 1, role: 'WICKETKEEPER', battingSkill: 7, bowlingSkill: 1, fieldingSkill: 9, form: 'GOOD', matchesPlayed: 6, matchesAvailable: 6, runsScored: 168, wicketsTaken: 0 },
  { id: '5', name: 'Karthik Nair', jerseyNumber: 23, role: 'BATSMAN', battingSkill: 8, bowlingSkill: 3, fieldingSkill: 7, form: 'AVERAGE', matchesPlayed: 2, matchesAvailable: 6, runsScored: 35, wicketsTaken: 0 },
]

const matches: Match[] = [
  { id: '1', matchNumber: 7, opponent: 'Thunder Hawks', venue: 'Riverside Ground', date: '2026-02-08', importance: 'MUST_WIN' },
  { id: '2', matchNumber: 8, opponent: 'Royal Strikers', venue: 'Central Park', date: '2026-02-15', importance: 'IMPORTANT' },
]

// Create MCP server
const server = new Server(
  {
    name: 'cricket-team-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
)

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_players',
        description: 'Get list of all players with their stats and attributes',
        inputSchema: {
          type: 'object',
          properties: {
            role: {
              type: 'string',
              description: 'Filter by player role (BATSMAN, BOWLER, ALL_ROUNDER, WICKETKEEPER)',
              enum: ['BATSMAN', 'BOWLER', 'ALL_ROUNDER', 'WICKETKEEPER'],
            },
            form: {
              type: 'string',
              description: 'Filter by current form',
              enum: ['EXCELLENT', 'GOOD', 'AVERAGE', 'POOR'],
            },
          },
        },
      },
      {
        name: 'get_player_stats',
        description: 'Get detailed statistics for a specific player',
        inputSchema: {
          type: 'object',
          properties: {
            playerId: {
              type: 'string',
              description: 'The ID of the player',
            },
            playerName: {
              type: 'string',
              description: 'The name of the player (alternative to ID)',
            },
          },
        },
      },
      {
        name: 'get_upcoming_matches',
        description: 'Get list of upcoming matches',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Maximum number of matches to return',
              default: 5,
            },
          },
        },
      },
      {
        name: 'get_opportunity_debt',
        description: 'Get players who need more playing opportunities based on their availability vs matches played ratio',
        inputSchema: {
          type: 'object',
          properties: {
            threshold: {
              type: 'number',
              description: 'Minimum ratio threshold (0-1). Players below this need more games.',
              default: 0.6,
            },
          },
        },
      },
      {
        name: 'suggest_squad',
        description: 'Get AI-powered squad suggestion for a match',
        inputSchema: {
          type: 'object',
          properties: {
            matchId: {
              type: 'string',
              description: 'The ID of the match to select squad for',
            },
            mode: {
              type: 'string',
              description: 'Selection mode',
              enum: ['WIN_FOCUSED', 'BALANCED', 'OPPORTUNITY_FOCUSED'],
              default: 'BALANCED',
            },
            opponentStrength: {
              type: 'number',
              description: 'Opponent strength rating (1-10)',
            },
            pitchType: {
              type: 'string',
              description: 'Pitch conditions',
              enum: ['BATTING_FRIENDLY', 'BOWLING_FRIENDLY', 'BALANCED', 'SPIN_FRIENDLY', 'PACE_FRIENDLY'],
            },
          },
          required: ['matchId'],
        },
      },
      {
        name: 'analyze_match',
        description: 'Get analysis and insights for a specific match',
        inputSchema: {
          type: 'object',
          properties: {
            matchId: {
              type: 'string',
              description: 'The ID of the match to analyze',
            },
          },
          required: ['matchId'],
        },
      },
      {
        name: 'get_training_plan',
        description: 'Generate a personalized training plan for a player',
        inputSchema: {
          type: 'object',
          properties: {
            playerId: {
              type: 'string',
              description: 'The ID of the player',
            },
            focus: {
              type: 'string',
              description: 'Area to focus on',
              enum: ['BATTING', 'BOWLING', 'FIELDING', 'FITNESS', 'ALL_ROUND'],
            },
            duration: {
              type: 'string',
              description: 'Duration of the plan',
              enum: ['1_WEEK', '2_WEEKS', '1_MONTH'],
              default: '2_WEEKS',
            },
          },
          required: ['playerId'],
        },
      },
      {
        name: 'compare_players',
        description: 'Compare two or more players across various metrics',
        inputSchema: {
          type: 'object',
          properties: {
            playerIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'IDs of players to compare',
            },
          },
          required: ['playerIds'],
        },
      },
    ],
  }
})

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'cricket://season/current',
        name: 'Current Season',
        description: 'Current season overview and standings',
        mimeType: 'application/json',
      },
      {
        uri: 'cricket://team/roster',
        name: 'Team Roster',
        description: 'Complete team roster with all players',
        mimeType: 'application/json',
      },
      {
        uri: 'cricket://stats/leaderboard',
        name: 'Stats Leaderboard',
        description: 'Season statistics leaderboard',
        mimeType: 'application/json',
      },
    ],
  }
})

// Read resources
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params

  switch (uri) {
    case 'cricket://season/current':
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify({
              name: 'Winter League 2026',
              matchesPlayed: 6,
              totalMatches: 12,
              wins: 4,
              losses: 1,
              draws: 1,
              position: 3,
              totalTeams: 8,
              pointsTable: [
                { team: 'Storm Riders', points: 14 },
                { team: 'Thunder Hawks', points: 12 },
                { team: 'Our Team', points: 10 },
                { team: 'Royal Strikers', points: 8 },
              ],
            }, null, 2),
          },
        ],
      }

    case 'cricket://team/roster':
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify({ players }, null, 2),
          },
        ],
      }

    case 'cricket://stats/leaderboard':
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify({
              batting: players.sort((a, b) => b.runsScored - a.runsScored).slice(0, 5),
              bowling: players.sort((a, b) => b.wicketsTaken - a.wicketsTaken).slice(0, 5),
            }, null, 2),
          },
        ],
      }

    default:
      throw new Error(`Unknown resource: ${uri}`)
  }
})

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  switch (name) {
    case 'get_players': {
      let result = [...players]
      if (args?.role) {
        result = result.filter((p) => p.role === args.role)
      }
      if (args?.form) {
        result = result.filter((p) => p.form === args.form)
      }
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      }
    }

    case 'get_player_stats': {
      const player = players.find(
        (p) => p.id === args?.playerId || p.name.toLowerCase().includes((args?.playerName || '').toLowerCase())
      )
      if (!player) {
        return {
          content: [{ type: 'text', text: 'Player not found' }],
          isError: true,
        }
      }
      const opportunityRatio = player.matchesPlayed / player.matchesAvailable
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                ...player,
                opportunityRatio: (opportunityRatio * 100).toFixed(1) + '%',
                needsMoreGames: opportunityRatio < 0.6,
                battingAverage: player.matchesPlayed > 0 ? (player.runsScored / player.matchesPlayed).toFixed(2) : 'N/A',
              },
              null,
              2
            ),
          },
        ],
      }
    }

    case 'get_upcoming_matches': {
      const limit = args?.limit || 5
      return {
        content: [{ type: 'text', text: JSON.stringify(matches.slice(0, limit), null, 2) }],
      }
    }

    case 'get_opportunity_debt': {
      const threshold = args?.threshold || 0.6
      const playersNeedingGames = players
        .map((p) => ({
          ...p,
          ratio: p.matchesPlayed / p.matchesAvailable,
        }))
        .filter((p) => p.ratio < threshold)
        .sort((a, b) => a.ratio - b.ratio)

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                threshold,
                playersNeedingGames: playersNeedingGames.map((p) => ({
                  name: p.name,
                  matchesPlayed: p.matchesPlayed,
                  matchesAvailable: p.matchesAvailable,
                  ratio: (p.ratio * 100).toFixed(1) + '%',
                  gamesNeeded: Math.ceil(p.matchesAvailable * threshold) - p.matchesPlayed,
                })),
                recommendation:
                  playersNeedingGames.length > 0
                    ? `Consider giving more opportunities to: ${playersNeedingGames.map((p) => p.name).join(', ')}`
                    : 'All players are getting fair opportunities.',
              },
              null,
              2
            ),
          },
        ],
      }
    }

    case 'suggest_squad': {
      const match = matches.find((m) => m.id === args?.matchId)
      if (!match) {
        return {
          content: [{ type: 'text', text: 'Match not found' }],
          isError: true,
        }
      }

      const mode = args?.mode || 'BALANCED'
      
      // Simple squad selection logic (in production, this would call the AI service)
      const sortedPlayers = [...players].sort((a, b) => {
        let scoreA = (a.battingSkill + a.bowlingSkill) / 2
        let scoreB = (b.battingSkill + b.bowlingSkill) / 2

        // Adjust for mode
        if (mode === 'OPPORTUNITY_FOCUSED') {
          const ratioA = a.matchesPlayed / a.matchesAvailable
          const ratioB = b.matchesPlayed / b.matchesAvailable
          scoreA += (1 - ratioA) * 5
          scoreB += (1 - ratioB) * 5
        }

        // Form bonus
        if (a.form === 'EXCELLENT') scoreA += 2
        if (b.form === 'EXCELLENT') scoreB += 2

        return scoreB - scoreA
      })

      const recommendation: SquadRecommendation = {
        players: sortedPlayers.slice(0, 11).map((p, i) => ({
          name: p.name,
          battingOrder: i + 1,
          reason: `${p.role} with ${p.form.toLowerCase()} form`,
        })),
        reasoning: `Squad selected in ${mode.replace('_', ' ').toLowerCase()} mode for match against ${match.opponent}.`,
        winProbability: 65,
        fairnessScore: mode === 'OPPORTUNITY_FOCUSED' ? 85 : 70,
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(recommendation, null, 2) }],
      }
    }

    case 'analyze_match': {
      const match = matches.find((m) => m.id === args?.matchId)
      if (!match) {
        return {
          content: [{ type: 'text', text: 'Match not found' }],
          isError: true,
        }
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                match,
                analysis: {
                  opponentStrength: 'Strong fast bowling attack',
                  keyMatchups: [
                    'Their pace vs our top order',
                    'Our spinners vs their middle order',
                  ],
                  recommendations: [
                    'Pick extra pace bowler if conditions are overcast',
                    'Consider left-handed openers to counter their off-spinner',
                  ],
                  historicalRecord: 'Won 1, Lost 1 in last 2 meetings',
                },
              },
              null,
              2
            ),
          },
        ],
      }
    }

    case 'get_training_plan': {
      const player = players.find((p) => p.id === args?.playerId)
      if (!player) {
        return {
          content: [{ type: 'text', text: 'Player not found' }],
          isError: true,
        }
      }

      const focus = args?.focus || 'ALL_ROUND'
      const duration = args?.duration || '2_WEEKS'

      const plan = {
        player: player.name,
        focus,
        duration,
        currentLevel: {
          batting: player.battingSkill,
          bowling: player.bowlingSkill,
          fielding: player.fieldingSkill,
        },
        areasForImprovement: [] as string[],
        drills: [] as Array<{ name: string; frequency: string; duration: string }>,
        goals: [] as string[],
      }

      // Generate personalized plan based on focus and weaknesses
      if (focus === 'BATTING' || focus === 'ALL_ROUND') {
        if (player.battingSkill < 7) {
          plan.areasForImprovement.push('Batting technique')
          plan.drills.push(
            { name: 'Net practice', frequency: '3x/week', duration: '45 mins' },
            { name: 'Throw-downs', frequency: '2x/week', duration: '30 mins' }
          )
          plan.goals.push('Improve strike rate by 10%')
        }
      }

      if (focus === 'BOWLING' || focus === 'ALL_ROUND') {
        if (player.bowlingSkill < 7) {
          plan.areasForImprovement.push('Bowling accuracy')
          plan.drills.push(
            { name: 'Target bowling', frequency: '3x/week', duration: '30 mins' },
            { name: 'Variation practice', frequency: '2x/week', duration: '20 mins' }
          )
          plan.goals.push('Reduce economy rate by 0.5')
        }
      }

      if (focus === 'FIELDING' || focus === 'ALL_ROUND') {
        plan.drills.push(
          { name: 'Catching practice', frequency: '4x/week', duration: '20 mins' },
          { name: 'Ground fielding', frequency: '3x/week', duration: '25 mins' }
        )
        plan.goals.push('Zero dropped catches in next 5 matches')
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(plan, null, 2) }],
      }
    }

    case 'compare_players': {
      const playerIds = args?.playerIds as string[]
      if (!playerIds || playerIds.length < 2) {
        return {
          content: [{ type: 'text', text: 'Please provide at least 2 player IDs to compare' }],
          isError: true,
        }
      }

      const playersToCompare = players.filter((p) => playerIds.includes(p.id))
      
      const comparison = {
        players: playersToCompare.map((p) => ({
          name: p.name,
          role: p.role,
          battingSkill: p.battingSkill,
          bowlingSkill: p.bowlingSkill,
          fieldingSkill: p.fieldingSkill,
          overallSkill: ((p.battingSkill + p.bowlingSkill + p.fieldingSkill) / 3).toFixed(1),
          form: p.form,
          runsScored: p.runsScored,
          wicketsTaken: p.wicketsTaken,
          opportunityRatio: ((p.matchesPlayed / p.matchesAvailable) * 100).toFixed(1) + '%',
        })),
        summary: '',
      }

      // Generate comparison summary
      const best = playersToCompare.reduce((a, b) => 
        (a.battingSkill + a.bowlingSkill + a.fieldingSkill) > (b.battingSkill + b.bowlingSkill + b.fieldingSkill) ? a : b
      )
      comparison.summary = `${best.name} has the highest overall skill rating. `
      
      const needsGames = playersToCompare.filter((p) => p.matchesPlayed / p.matchesAvailable < 0.6)
      if (needsGames.length > 0) {
        comparison.summary += `${needsGames.map((p) => p.name).join(', ')} need${needsGames.length === 1 ? 's' : ''} more playing opportunities.`
      }

      return {
        content: [{ type: 'text', text: JSON.stringify(comparison, null, 2) }],
      }
    }

    default:
      return {
        content: [{ type: 'text', text: `Unknown tool: ${name}` }],
        isError: true,
      }
  }
})

// Start the server
async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('Cricket Team MCP Server running on stdio')
}

main().catch(console.error)

