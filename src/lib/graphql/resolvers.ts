import { prisma } from '@/lib/prisma'
import { generateSquadRecommendation } from '@/lib/ai/squad-selector'
import { calculatePlayerRatingChanges, calculateAllPlayerRatingChanges, applyRatingChanges } from '@/lib/rating-calculator'
import { GraphQLScalarType, Kind } from 'graphql'
import type { Player, SeasonStats, Match, Opponent, Season, Squad, SquadPlayer, PlayerAvailability, RatingHistory } from '@prisma/client'

// DateTime scalar
const dateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'DateTime custom scalar type',
  serialize(value: unknown) {
    if (value instanceof Date) {
      return value.toISOString()
    }
    return null
  },
  parseValue(value: unknown) {
    if (typeof value === 'string' || typeof value === 'number') {
      return new Date(value)
    }
    return null
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value)
    }
    return null
  },
})

// Helper to calculate computed stats
const calculateBattingAverage = (stats: SeasonStats) => {
  const dismissals = stats.innings - stats.notOuts
  return dismissals > 0 ? stats.runsScored / dismissals : stats.runsScored
}

const calculateStrikeRate = (stats: SeasonStats) => {
  return stats.ballsFaced > 0 ? (stats.runsScored / stats.ballsFaced) * 100 : 0
}

const calculateBowlingAverage = (stats: SeasonStats) => {
  return stats.wicketsTaken > 0 ? stats.runsConceded / stats.wicketsTaken : 0
}

const calculateEconomyRate = (stats: SeasonStats) => {
  return stats.oversBowled > 0 ? stats.runsConceded / stats.oversBowled : 0
}

export const resolvers = {
  DateTime: dateTimeScalar,

  // ============================================
  // PLAYER RESOLVERS
  // ============================================
  Player: {
    seasonStats: async (parent: Player) => {
      return prisma.seasonStats.findMany({
        where: { playerId: parent.id },
      })
    },
    currentSeasonStats: async (parent: Player) => {
      const activeSeason = await prisma.season.findFirst({
        where: { isActive: true },
      })
      if (!activeSeason) return null
      return prisma.seasonStats.findUnique({
        where: {
          playerId_seasonId: {
            playerId: parent.id,
            seasonId: activeSeason.id,
          },
        },
      })
    },
    availabilities: async (parent: Player) => {
      return prisma.playerAvailability.findMany({
        where: { playerId: parent.id },
        include: { match: true },
      })
    },
    opportunityRatio: async (parent: Player) => {
      const activeSeason = await prisma.season.findFirst({
        where: { isActive: true },
      })
      if (!activeSeason) return null
      const stats = await prisma.seasonStats.findUnique({
        where: {
          playerId_seasonId: {
            playerId: parent.id,
            seasonId: activeSeason.id,
          },
        },
      })
      if (!stats || stats.matchesAvailable === 0) return null
      return stats.matchesPlayed / stats.matchesAvailable
    },
    overallSkill: (parent: Player) => {
      return (parent.battingSkill + parent.bowlingSkill + parent.fieldingSkill) / 3
    },
    ratingHistory: async (parent: Player) => {
      return prisma.ratingHistory.findMany({
        where: { playerId: parent.id },
        orderBy: { createdAt: 'desc' },
        take: 20,
      })
    },
  },

  RatingHistory: {
    // No additional resolvers needed - all fields are directly on the model
  },

  SeasonStats: {
    battingAverage: calculateBattingAverage,
    strikeRate: calculateStrikeRate,
    bowlingAverage: calculateBowlingAverage,
    economyRate: calculateEconomyRate,
  },

  // ============================================
  // MATCH RESOLVERS
  // ============================================
  Match: {
    opponent: async (parent: Match) => {
      return prisma.opponent.findUnique({ where: { id: parent.opponentId } })
    },
    venue: async (parent: Match) => {
      return prisma.venue.findUnique({ where: { id: parent.venueId } })
    },
    season: async (parent: Match) => {
      return prisma.season.findUnique({ where: { id: parent.seasonId } })
    },
    squad: async (parent: Match) => {
      return prisma.squad.findUnique({
        where: { matchId: parent.id },
        include: {
          players: {
            include: { player: true },
          },
        },
      })
    },
    availabilities: async (parent: Match) => {
      return prisma.playerAvailability.findMany({
        where: { matchId: parent.id },
        include: { player: true },
      })
    },
    performances: async (parent: Match) => {
      return prisma.matchPerformance.findMany({
        where: { matchId: parent.id },
        include: { player: true },
      })
    },
    availablePlayers: async (parent: Match) => {
      const availabilities = await prisma.playerAvailability.findMany({
        where: { matchId: parent.id, status: 'AVAILABLE' },
        include: { player: true },
      })
      return availabilities.map((a) => a.player)
    },
    availableCount: async (parent: Match) => {
      return prisma.playerAvailability.count({
        where: { matchId: parent.id, status: 'AVAILABLE' },
      })
    },
  },

  Opponent: {
    winRateAgainst: (parent: Opponent) => {
      if (parent.matchesPlayed === 0) return null
      return parent.matchesWon / parent.matchesPlayed
    },
  },

  Season: {
    matches: async (parent: Season) => {
      return prisma.match.findMany({
        where: { seasonId: parent.id },
        orderBy: { matchDate: 'asc' },
      })
    },
  },

  Squad: {
    players: async (parent: Squad) => {
      return prisma.squadPlayer.findMany({
        where: { squadId: parent.id },
        include: { player: true },
        orderBy: { battingOrder: 'asc' },
      })
    },
    match: async (parent: Squad) => {
      return prisma.match.findUnique({ where: { id: parent.matchId } })
    },
  },

  SquadPlayer: {
    player: async (parent: SquadPlayer) => {
      return prisma.player.findUnique({ where: { id: parent.playerId } })
    },
  },

  PlayerAvailability: {
    player: async (parent: PlayerAvailability) => {
      return prisma.player.findUnique({ where: { id: parent.playerId } })
    },
    match: async (parent: PlayerAvailability) => {
      return prisma.match.findUnique({ where: { id: parent.matchId } })
    },
  },

  // ============================================
  // QUERIES
  // ============================================
  Query: {
    players: async (_: unknown, { activeOnly }: { activeOnly?: boolean }) => {
      return prisma.player.findMany({
        where: activeOnly ? { isActive: true } : undefined,
        orderBy: { name: 'asc' },
      })
    },

    player: async (_: unknown, { id }: { id: string }) => {
      return prisma.player.findUnique({ where: { id } })
    },

    playersWithStats: async (_: unknown, { seasonId }: { seasonId?: string }) => {
      const season = seasonId
        ? await prisma.season.findUnique({ where: { id: seasonId } })
        : await prisma.season.findFirst({ where: { isActive: true } })

      if (!season) return []

      return prisma.player.findMany({
        where: { isActive: true },
        include: {
          seasonStats: {
            where: { seasonId: season.id },
          },
        },
        orderBy: { name: 'asc' },
      })
    },

    seasons: async () => {
      return prisma.season.findMany({
        orderBy: { startDate: 'desc' },
      })
    },

    activeSeason: async () => {
      return prisma.season.findFirst({
        where: { isActive: true },
      })
    },

    season: async (_: unknown, { id }: { id: string }) => {
      return prisma.season.findUnique({ where: { id } })
    },

    matches: async (
      _: unknown,
      { seasonId, status }: { seasonId?: string; status?: string }
    ) => {
      const where: Record<string, unknown> = {}
      if (seasonId) where.seasonId = seasonId
      if (status) where.status = status

      return prisma.match.findMany({
        where,
        include: {
          opponent: true,
          venue: true,
        },
        orderBy: { matchDate: 'asc' },
      })
    },

    match: async (_: unknown, { id }: { id: string }) => {
      return prisma.match.findUnique({
        where: { id },
        include: {
          opponent: true,
          venue: true,
          squad: {
            include: {
              players: {
                include: { player: true },
              },
            },
          },
          availabilities: {
            include: { player: true },
          },
        },
      })
    },

    upcomingMatches: async (_: unknown, { limit }: { limit?: number }) => {
      return prisma.match.findMany({
        where: {
          matchDate: { gte: new Date() },
          status: { in: ['UPCOMING', 'IN_PROGRESS'] },
        },
        include: {
          opponent: true,
          venue: true,
        },
        orderBy: { matchDate: 'asc' },
        take: limit || 5,
      })
    },

    recentMatches: async (_: unknown, { limit }: { limit?: number }) => {
      return prisma.match.findMany({
        where: { status: 'COMPLETED' },
        include: {
          opponent: true,
          venue: true,
        },
        orderBy: { matchDate: 'desc' },
        take: limit || 5,
      })
    },

    opponents: async () => {
      return prisma.opponent.findMany({
        orderBy: { name: 'asc' },
      })
    },

    opponent: async (_: unknown, { id }: { id: string }) => {
      return prisma.opponent.findUnique({ where: { id } })
    },

    venues: async () => {
      return prisma.venue.findMany({
        orderBy: { name: 'asc' },
      })
    },

    venue: async (_: unknown, { id }: { id: string }) => {
      return prisma.venue.findUnique({ where: { id } })
    },

    squad: async (_: unknown, { matchId }: { matchId: string }) => {
      return prisma.squad.findUnique({
        where: { matchId },
        include: {
          players: {
            include: { player: true },
            orderBy: { battingOrder: 'asc' },
          },
        },
      })
    },

    dashboardStats: async () => {
      const season = await prisma.season.findFirst({
        where: { isActive: true },
      })

      if (!season) throw new Error('No active season')

      // Get top performers
      const topBatsman = await prisma.seasonStats.findFirst({
        where: { seasonId: season.id },
        orderBy: { runsScored: 'desc' },
        include: { player: true },
      })

      const topBowler = await prisma.seasonStats.findFirst({
        where: { seasonId: season.id },
        orderBy: { wicketsTaken: 'desc' },
        include: { player: true },
      })

      const topFielder = await prisma.seasonStats.findFirst({
        where: { seasonId: season.id },
        orderBy: { catches: 'desc' },
        include: { player: true },
      })

      const recentMatches = await prisma.match.findMany({
        where: { seasonId: season.id, status: 'COMPLETED' },
        include: { opponent: true, venue: true },
        orderBy: { matchDate: 'desc' },
        take: 3,
      })

      const upcomingMatches = await prisma.match.findMany({
        where: { seasonId: season.id, status: 'UPCOMING' },
        include: { opponent: true, venue: true },
        orderBy: { matchDate: 'asc' },
        take: 3,
      })

      const recentActivities = await prisma.activity.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
      })

      // Calculate team strengths
      const allStats = await prisma.seasonStats.findMany({
        where: { seasonId: season.id },
        include: { player: true },
      })

      const activePlayers = allStats.filter((s) => s.player.isActive)
      const avgBatting = activePlayers.reduce((sum, s) => sum + s.player.battingSkill, 0) / activePlayers.length
      const avgBowling = activePlayers.reduce((sum, s) => sum + s.player.bowlingSkill, 0) / activePlayers.length
      const avgFielding = activePlayers.reduce((sum, s) => sum + s.player.fieldingSkill, 0) / activePlayers.length
      const avgExperience = activePlayers.reduce((sum, s) => sum + s.player.experienceLevel, 0) / activePlayers.length

      return {
        season,
        topScorer: topBatsman?.player,
        topWicketTaker: topBowler?.player,
        topFielder: topFielder?.player,
        recentMatches,
        upcomingMatches,
        recentActivities,
        teamStrengths: {
          batting: avgBatting,
          bowling: avgBowling,
          fielding: avgFielding,
          experience: avgExperience,
          overall: (avgBatting + avgBowling + avgFielding + avgExperience) / 4,
        },
      }
    },

    opportunityTracker: async (_: unknown, { seasonId }: { seasonId?: string }) => {
      const season = seasonId
        ? await prisma.season.findUnique({ where: { id: seasonId } })
        : await prisma.season.findFirst({ where: { isActive: true } })

      if (!season) throw new Error('No season found')

      const stats = await prisma.seasonStats.findMany({
        where: { seasonId: season.id },
        include: { player: true },
      })

      const TARGET_RATIO = 0.6 // 60% target

      const playerOpportunities = stats
        .filter((s) => s.player.isActive)
        .map((s) => {
          const ratio = s.matchesAvailable > 0 ? s.matchesPlayed / s.matchesAvailable : 0
          let status = 'ON_TRACK'
          if (ratio < TARGET_RATIO - 0.2) status = 'NEEDS_GAMES'
          else if (ratio < TARGET_RATIO) status = 'BELOW_TARGET'
          else if (ratio > 0.8) status = 'WELL_COVERED'

          const gamesNeeded = Math.max(0, Math.ceil(s.matchesAvailable * TARGET_RATIO) - s.matchesPlayed)

          return {
            player: s.player,
            matchesAvailable: s.matchesAvailable,
            matchesPlayed: s.matchesPlayed,
            ratio,
            status,
            gamesNeeded,
          }
        })
        .sort((a, b) => a.ratio - b.ratio)

      const playersNeedingGames = playerOpportunities
        .filter((p) => p.status === 'NEEDS_GAMES')
        .map((p) => p.player)

      return {
        players: playerOpportunities,
        targetRatio: TARGET_RATIO,
        playersNeedingGames,
        recommendation:
          playersNeedingGames.length > 0
            ? `${playersNeedingGames.length} players need more playing time. Consider prioritizing: ${playersNeedingGames.map((p) => p.name).join(', ')}`
            : 'All players are getting fair opportunities.',
      }
    },

    activities: async (_: unknown, { limit }: { limit?: number }) => {
      return prisma.activity.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit || 20,
      })
    },

    media: async () => {
      return prisma.media.findMany({
        include: {
          match: {
            include: {
              opponent: true,
            },
          },
          tags: true,
        },
        orderBy: { createdAt: 'desc' },
      })
    },

    aiSquadRecommendation: async (_: unknown, { input }: { input: { matchId: string; mode: string; context?: Record<string, unknown> } }) => {
      const match = await prisma.match.findUnique({
        where: { id: input.matchId },
        include: {
          opponent: true,
          venue: true,
          availabilities: {
            where: { status: 'AVAILABLE' },
            include: { player: true },
          },
        },
      })

      if (!match) throw new Error('Match not found')

      const season = await prisma.season.findFirst({ where: { isActive: true } })
      if (!season) throw new Error('No active season')

      const availablePlayers = match.availabilities.map((a) => a.player)

      // Get stats for available players
      const playerStats = await prisma.seasonStats.findMany({
        where: {
          seasonId: season.id,
          playerId: { in: availablePlayers.map((p) => p.id) },
        },
      })

      const playersWithStats = availablePlayers.map((player) => ({
        ...player,
        stats: playerStats.find((s) => s.playerId === player.id),
      }))

      // Call AI service
      const recommendation = await generateSquadRecommendation({
        players: playersWithStats,
        match,
        opponent: match.opponent,
        venue: match.venue,
        mode: input.mode as 'WIN_FOCUSED' | 'BALANCED' | 'OPPORTUNITY_FOCUSED',
        season,
      })

      return recommendation
    },

    // Rating Queries (Admin only - authorization handled in frontend/API layer)
    ratingPreview: async (_: unknown, { seasonId, excludePlayerIds }: { seasonId?: string; excludePlayerIds?: string[] }) => {
      const results = await calculateAllPlayerRatingChanges(seasonId, excludePlayerIds || [])
      
      // Get current player data to include in response
      const playerIds = results.map(r => r.playerId)
      const players = await prisma.player.findMany({
        where: { id: { in: playerIds } },
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
      
      const playerMap = new Map(players.map(p => [p.id, p]))
      
      return results.map(result => {
        const player = playerMap.get(result.playerId)
        return {
          playerId: result.playerId,
          playerName: result.playerName,
          primaryRole: player?.primaryRole || 'BATSMAN',
          currentRatings: {
            battingSkill: player?.battingSkill || 5,
            bowlingSkill: player?.bowlingSkill || 5,
            fieldingSkill: player?.fieldingSkill || 5,
            powerHitting: player?.powerHitting || 5,
            runningBetweenWickets: player?.runningBetweenWickets || 5,
            pressureHandling: player?.pressureHandling || 5,
          },
          proposedChanges: result.changes,
          excluded: result.excluded,
          exclusionReason: result.exclusionReason,
        }
      })
    },

    playerRatingHistory: async (_: unknown, { playerId, limit }: { playerId: string; limit?: number }) => {
      return prisma.ratingHistory.findMany({
        where: { playerId },
        orderBy: { createdAt: 'desc' },
        take: limit || 20,
      })
    },
  },

  // ============================================
  // MUTATIONS
  // ============================================
  Mutation: {
    createPlayer: async (_: unknown, { input }: { input: Record<string, unknown> }) => {
      const player = await prisma.player.create({
        data: {
          name: input.name as string,
          email: input.email as string | undefined,
          phone: input.phone as string | undefined,
          jerseyNumber: input.jerseyNumber as number | undefined,
          primaryRole: input.primaryRole as 'BATSMAN' | 'BOWLER' | 'ALL_ROUNDER' | 'WICKETKEEPER',
          battingStyle: input.battingStyle as 'RIGHT_HAND' | 'LEFT_HAND',
          bowlingStyle: input.bowlingStyle as 'FAST' | 'MEDIUM_FAST' | 'MEDIUM' | 'SPIN_OFF' | 'SPIN_LEG' | 'SPIN_LEFT_ARM' | 'NONE',
          battingPosition: input.battingPosition as 'OPENER' | 'TOP_ORDER' | 'MIDDLE_ORDER' | 'LOWER_ORDER' | 'FINISHER',
          battingSkill: (input.battingSkill as number) || 5,
          bowlingSkill: (input.bowlingSkill as number) || 5,
          fieldingSkill: (input.fieldingSkill as number) || 5,
          experienceLevel: (input.experienceLevel as number) || 5,
          captainChoice: (input.captainChoice as number) || 2,
          isWicketkeeper: (input.isWicketkeeper as boolean) || false,
        },
      })

      // Create season stats for active season
      const activeSeason = await prisma.season.findFirst({ where: { isActive: true } })
      if (activeSeason) {
        await prisma.seasonStats.create({
          data: {
            playerId: player.id,
            seasonId: activeSeason.id,
          },
        })
      }

      await prisma.activity.create({
        data: {
          type: 'PLAYER_ADDED',
          title: `${player.name} joined the team`,
          description: `New ${player.primaryRole.toLowerCase().replace('_', ' ')} added`,
          entityType: 'player',
          entityId: player.id,
        },
      })

      return player
    },

    updatePlayer: async (_: unknown, { id, input }: { id: string; input: Record<string, unknown> }) => {
      const player = await prisma.player.update({
        where: { id },
        data: input,
      })

      await prisma.activity.create({
        data: {
          type: 'PLAYER_UPDATED',
          title: `${player.name}'s profile updated`,
          entityType: 'player',
          entityId: player.id,
        },
      })

      return player
    },

    deletePlayer: async (_: unknown, { id }: { id: string }) => {
      await prisma.player.delete({ where: { id } })
      return true
    },

    updateAvailability: async (
      _: unknown,
      { matchId, availabilities }: { matchId: string; availabilities: Array<{ playerId: string; status: string; note?: string }> }
    ) => {
      const results = await Promise.all(
        availabilities.map((a) =>
          prisma.playerAvailability.upsert({
            where: {
              playerId_matchId: {
                playerId: a.playerId,
                matchId,
              },
            },
            update: {
              status: a.status as 'AVAILABLE' | 'UNAVAILABLE' | 'MAYBE' | 'PENDING',
              note: a.note,
              respondedAt: new Date(),
            },
            create: {
              playerId: a.playerId,
              matchId,
              status: a.status as 'AVAILABLE' | 'UNAVAILABLE' | 'MAYBE' | 'PENDING',
              note: a.note,
              respondedAt: new Date(),
            },
            include: { player: true, match: true },
          })
        )
      )

      await prisma.activity.create({
        data: {
          type: 'AVAILABILITY_UPDATED',
          title: 'Player availability updated',
          description: `${availabilities.length} players updated their availability`,
          entityType: 'match',
          entityId: matchId,
        },
      })

      return results
    },

    saveSquad: async (
      _: unknown,
      { input }: { input: { matchId: string; playerIds: string[]; battingOrder: string[]; modificationReason?: string } }
    ) => {
      // Delete existing squad if any
      await prisma.squad.deleteMany({ where: { matchId: input.matchId } })

      // Create new squad
      const squad = await prisma.squad.create({
        data: {
          matchId: input.matchId,
          isAiGenerated: false,
          selectionMode: 'BALANCED',
          wasModified: true,
          modificationReason: input.modificationReason,
          players: {
            create: input.playerIds.map((playerId, index) => ({
              playerId,
              battingOrder: input.battingOrder.indexOf(playerId) + 1,
              isPlaying: index < 11,
            })),
          },
        },
        include: {
          players: {
            include: { player: true },
          },
        },
      })

      await prisma.activity.create({
        data: {
          type: 'SQUAD_SELECTED',
          title: 'Squad finalized',
          description: `11 players selected for the match`,
          entityType: 'squad',
          entityId: squad.id,
        },
      })

      return squad
    },

    generateAiSquad: async (_: unknown, { input }: { input: { matchId: string; mode: string } }) => {
      const match = await prisma.match.findUnique({
        where: { id: input.matchId },
        include: {
          opponent: true,
          venue: true,
          availabilities: {
            where: { status: 'AVAILABLE' },
            include: { player: true },
          },
        },
      })

      if (!match) throw new Error('Match not found')

      const season = await prisma.season.findFirst({ where: { isActive: true } })
      if (!season) throw new Error('No active season')

      const availablePlayers = match.availabilities.map((a) => a.player)
      const playerStats = await prisma.seasonStats.findMany({
        where: {
          seasonId: season.id,
          playerId: { in: availablePlayers.map((p) => p.id) },
        },
      })

      const playersWithStats = availablePlayers.map((player) => ({
        ...player,
        stats: playerStats.find((s) => s.playerId === player.id),
      }))

      const recommendation = await generateSquadRecommendation({
        players: playersWithStats,
        match,
        opponent: match.opponent,
        venue: match.venue,
        mode: input.mode as 'WIN_FOCUSED' | 'BALANCED' | 'OPPORTUNITY_FOCUSED',
        season,
      })

      // Delete existing squad
      await prisma.squad.deleteMany({ where: { matchId: input.matchId } })

      // Save the AI-generated squad
      const squad = await prisma.squad.create({
        data: {
          matchId: input.matchId,
          isAiGenerated: true,
          selectionMode: input.mode as 'WIN_FOCUSED' | 'BALANCED' | 'OPPORTUNITY_FOCUSED',
          aiReasoning: recommendation.reasoning,
          winProbability: recommendation.winProbability,
          fairnessScore: recommendation.fairnessScore,
          players: {
            create: recommendation.selectedPlayers.map((sp, index) => ({
              playerId: sp.player.id,
              battingOrder: sp.battingOrder,
              isPlaying: index < 11,
              roleInMatch: sp.roleInMatch,
              selectionReason: sp.selectionReason,
            })),
          },
        },
        include: {
          players: {
            include: { player: true },
          },
        },
      })

      await prisma.activity.create({
        data: {
          type: 'AI_RECOMMENDATION',
          title: 'AI Squad Generated',
          description: `AI recommended squad with ${recommendation.winProbability}% win probability`,
          entityType: 'squad',
          entityId: squad.id,
        },
      })

      return squad
    },

    createMatch: async (
      _: unknown,
      args: {
        matchDate: Date
        opponentId: string
        venueId: string
        seasonId: string
        importance?: string
        captainNotes?: string
      }
    ) => {
      const season = await prisma.season.findUnique({ where: { id: args.seasonId } })
      const matchCount = await prisma.match.count({ where: { seasonId: args.seasonId } })

      const match = await prisma.match.create({
        data: {
          matchDate: args.matchDate,
          opponentId: args.opponentId,
          venueId: args.venueId,
          seasonId: args.seasonId,
          matchNumber: matchCount + 1,
          importance: (args.importance as 'MUST_WIN' | 'IMPORTANT' | 'REGULAR' | 'LOW_STAKES') || 'REGULAR',
          captainNotes: args.captainNotes,
        },
        include: {
          opponent: true,
          venue: true,
        },
      })

      // Create availability entries for all active players
      const players = await prisma.player.findMany({ where: { isActive: true } })
      await prisma.playerAvailability.createMany({
        data: players.map((p) => ({
          playerId: p.id,
          matchId: match.id,
          status: 'PENDING' as const,
        })),
      })

      await prisma.activity.create({
        data: {
          type: 'MATCH_CREATED',
          title: `Match scheduled vs ${match.opponent.name}`,
          description: `Match #${match.matchNumber} at ${match.venue.name}`,
          entityType: 'match',
          entityId: match.id,
        },
      })

      return match
    },

    updateMatchResult: async (
      _: unknown,
      args: {
        id: string
        result: string
        ourScore?: string
        opponentScore?: string
        marginOfVictory?: string
        manOfMatch?: string
        matchReport?: string
      }
    ) => {
      const match = await prisma.match.update({
        where: { id: args.id },
        data: {
          status: 'COMPLETED',
          result: args.result as 'WON' | 'LOST' | 'DRAW' | 'NO_RESULT' | 'ABANDONED',
          ourScore: args.ourScore,
          opponentScore: args.opponentScore,
          marginOfVictory: args.marginOfVictory,
          manOfMatch: args.manOfMatch,
          matchReport: args.matchReport,
        },
        include: {
          opponent: true,
        },
      })

      // Update season stats
      const season = await prisma.season.findUnique({ where: { id: match.seasonId } })
      if (season) {
        const updateData: Record<string, number> = {
          matchesPlayed: season.matchesPlayed + 1,
        }
        if (args.result === 'WON') updateData.wins = season.wins + 1
        if (args.result === 'LOST') updateData.losses = season.losses + 1
        if (args.result === 'DRAW') updateData.draws = season.draws + 1
        if (args.result === 'NO_RESULT') updateData.noResults = season.noResults + 1

        await prisma.season.update({
          where: { id: season.id },
          data: updateData,
        })
      }

      await prisma.activity.create({
        data: {
          type: 'MATCH_UPDATED',
          title: `Match vs ${match.opponent.name} - ${args.result}`,
          description: args.marginOfVictory || `Final: ${args.ourScore} vs ${args.opponentScore}`,
          entityType: 'match',
          entityId: match.id,
        },
      })

      return match
    },

    createOpponent: async (
      _: unknown,
      args: {
        name: string
        shortName?: string
        overallStrength?: number
        battingStrength?: number
        bowlingStrength?: number
        keyPlayers?: string[]
        notes?: string
      }
    ) => {
      return prisma.opponent.create({
        data: {
          name: args.name,
          shortName: args.shortName,
          overallStrength: args.overallStrength || 5,
          battingStrength: args.battingStrength || 5,
          bowlingStrength: args.bowlingStrength || 5,
          keyPlayers: args.keyPlayers || [],
          notes: args.notes,
        },
      })
    },

    createVenue: async (
      _: unknown,
      args: {
        name: string
        address?: string
        city?: string
        pitchType?: string
        boundarySize?: string
        outfieldSpeed?: string
        typicalConditions?: string
      }
    ) => {
      return prisma.venue.create({
        data: {
          name: args.name,
          address: args.address,
          city: args.city,
          pitchType: (args.pitchType as 'BATTING_FRIENDLY' | 'BOWLING_FRIENDLY' | 'BALANCED' | 'SPIN_FRIENDLY' | 'PACE_FRIENDLY') || 'BALANCED',
          boundarySize: (args.boundarySize as 'SMALL' | 'MEDIUM' | 'LARGE') || 'MEDIUM',
          outfieldSpeed: (args.outfieldSpeed as 'FAST' | 'MEDIUM' | 'SLOW') || 'MEDIUM',
          typicalConditions: args.typicalConditions,
        },
      })
    },

    deleteVenue: async (_: unknown, { id }: { id: string }) => {
      await prisma.venue.delete({ where: { id } })
      return true
    },

    deleteOpponent: async (_: unknown, { id }: { id: string }) => {
      await prisma.opponent.delete({ where: { id } })
      return true
    },

    updateOpponent: async (
      _: unknown,
      args: {
        id: string
        name?: string
        shortName?: string
        overallStrength?: number
        battingStrength?: number
        bowlingStrength?: number
        keyPlayers?: string[]
        notes?: string
      }
    ) => {
      const { id, ...data } = args
      const updateData: Record<string, unknown> = {}
      if (data.name !== undefined) updateData.name = data.name
      if (data.shortName !== undefined) updateData.shortName = data.shortName
      if (data.overallStrength !== undefined) updateData.overallStrength = data.overallStrength
      if (data.battingStrength !== undefined) updateData.battingStrength = data.battingStrength
      if (data.bowlingStrength !== undefined) updateData.bowlingStrength = data.bowlingStrength
      if (data.keyPlayers !== undefined) updateData.keyPlayers = data.keyPlayers
      if (data.notes !== undefined) updateData.notes = data.notes

      return prisma.opponent.update({
        where: { id },
        data: updateData,
      })
    },

    updateVenue: async (
      _: unknown,
      args: {
        id: string
        name?: string
        address?: string
        city?: string
        pitchType?: string
        boundarySize?: string
        outfieldSpeed?: string
        typicalConditions?: string
      }
    ) => {
      const { id, ...data } = args
      const updateData: Record<string, unknown> = {}
      if (data.name !== undefined) updateData.name = data.name
      if (data.address !== undefined) updateData.address = data.address
      if (data.city !== undefined) updateData.city = data.city
      if (data.pitchType !== undefined) updateData.pitchType = data.pitchType
      if (data.boundarySize !== undefined) updateData.boundarySize = data.boundarySize
      if (data.outfieldSpeed !== undefined) updateData.outfieldSpeed = data.outfieldSpeed
      if (data.typicalConditions !== undefined) updateData.typicalConditions = data.typicalConditions

      return prisma.venue.update({
        where: { id },
        data: updateData,
      })
    },

    createSeason: async (
      _: unknown,
      args: {
        name: string
        startDate: Date
        endDate?: Date
        description?: string
        totalMatches?: number
        totalTeams?: number
        isActive?: boolean
      }
    ) => {
      // If setting this season as active, deactivate others
      if (args.isActive) {
        await prisma.season.updateMany({
          where: { isActive: true },
          data: { isActive: false },
        })
      }

      const season = await prisma.season.create({
        data: {
          name: args.name,
          startDate: args.startDate,
          endDate: args.endDate,
          description: args.description,
          totalMatches: args.totalMatches || 12,
          totalTeams: args.totalTeams || 8,
          isActive: args.isActive ?? true,
        },
      })

      await prisma.activity.create({
        data: {
          type: 'SEASON_STARTED',
          title: `New season created: ${season.name}`,
          description: args.isActive ? 'This is now the active season' : undefined,
          entityType: 'season',
          entityId: season.id,
        },
      })

      return season
    },

    updateSeason: async (
      _: unknown,
      args: {
        id: string
        name?: string
        startDate?: Date
        endDate?: Date
        description?: string
        totalMatches?: number
        totalTeams?: number
        isActive?: boolean
        currentPosition?: number
      }
    ) => {
      const { id, ...data } = args

      // If setting this season as active, deactivate others
      if (data.isActive) {
        await prisma.season.updateMany({
          where: { isActive: true, id: { not: id } },
          data: { isActive: false },
        })
      }

      const updateData: Record<string, unknown> = {}
      if (data.name !== undefined) updateData.name = data.name
      if (data.startDate !== undefined) updateData.startDate = data.startDate
      if (data.endDate !== undefined) updateData.endDate = data.endDate
      if (data.description !== undefined) updateData.description = data.description
      if (data.totalMatches !== undefined) updateData.totalMatches = data.totalMatches
      if (data.totalTeams !== undefined) updateData.totalTeams = data.totalTeams
      if (data.isActive !== undefined) updateData.isActive = data.isActive
      if (data.currentPosition !== undefined) updateData.currentPosition = data.currentPosition

      return prisma.season.update({
        where: { id },
        data: updateData,
      })
    },

    deleteSeason: async (_: unknown, { id }: { id: string }) => {
      await prisma.season.delete({ where: { id } })
      return true
    },

    deleteMatch: async (_: unknown, { id }: { id: string }) => {
      await prisma.match.delete({ where: { id } })
      return true
    },

    updateMatch: async (
      _: unknown,
      args: {
        id: string
        matchDate?: Date
        importance?: string
        captainNotes?: string
        status?: string
      }
    ) => {
      const { id, ...data } = args
      const updateData: Record<string, unknown> = {}
      if (data.matchDate !== undefined) updateData.matchDate = data.matchDate
      if (data.importance !== undefined) updateData.importance = data.importance
      if (data.captainNotes !== undefined) updateData.captainNotes = data.captainNotes
      if (data.status !== undefined) updateData.status = data.status

      return prisma.match.update({
        where: { id },
        data: updateData,
        include: {
          opponent: true,
          venue: true,
        },
      })
    },

    createMedia: async (
      _: unknown,
      { input }: { input: { type: string; url: string; thumbnailUrl?: string; title?: string; description?: string; duration?: number; matchId?: string } }
    ) => {
      const media = await prisma.media.create({
        data: {
          type: input.type as 'PHOTO' | 'VIDEO' | 'DOCUMENT',
          url: input.url,
          thumbnailUrl: input.thumbnailUrl,
          title: input.title,
          description: input.description,
          duration: input.duration,
          matchId: input.matchId,
        },
        include: {
          tags: true,
        },
      })

      await prisma.activity.create({
        data: {
          type: 'MEDIA_UPLOADED',
          title: input.title ? `Media uploaded: ${input.title}` : 'New media uploaded',
          entityType: 'media',
          entityId: media.id,
        },
      })

      return media
    },

    deleteMedia: async (_: unknown, { id }: { id: string }) => {
      await prisma.media.delete({ where: { id } })
      return true
    },

    // Rating Mutations (Admin only)
    updatePlayerRatingExclusion: async (
      _: unknown,
      { playerId, exclude, reason }: { playerId: string; exclude: boolean; reason?: string }
    ) => {
      const player = await prisma.player.update({
        where: { id: playerId },
        data: {
          excludeFromAutoRating: exclude,
          ratingExclusionReason: exclude ? reason : null,
        },
      })

      await prisma.activity.create({
        data: {
          type: 'PLAYER_UPDATED',
          title: exclude 
            ? `${player.name} excluded from auto rating updates`
            : `${player.name} included in auto rating updates`,
          description: reason || undefined,
          entityType: 'player',
          entityId: player.id,
        },
      })

      return player
    },

    applyRatingChanges: async (
      _: unknown,
      { seasonId, excludePlayerIds, reason }: { seasonId?: string; excludePlayerIds?: string[]; reason?: string }
    ) => {
      // Calculate all rating changes
      const results = await calculateAllPlayerRatingChanges(seasonId, excludePlayerIds || [])
      
      const allChanges: Array<{
        playerId: string
        playerName: string
        skillType: 'BATTING' | 'BOWLING' | 'FIELDING' | 'POWER_HITTING' | 'RUNNING_BETWEEN_WICKETS' | 'PRESSURE_HANDLING'
        previousRating: number
        newRating: number
        changeAmount: number
        performanceScore: number
        reason: string
      }> = []
      
      let updated = 0
      let skipped = 0
      
      for (const result of results) {
        if (result.excluded || result.changes.length === 0) {
          skipped++
          continue
        }
        
        // Apply changes for this player
        const changesWithReason = result.changes.map(c => ({
          ...c,
          reason: reason || 'Bulk recalculation by admin'
        }))
        
        await applyRatingChanges(changesWithReason)
        allChanges.push(...changesWithReason)
        updated++
      }
      
      // Log activity
      if (updated > 0) {
        await prisma.activity.create({
          data: {
            type: 'RATING_UPDATED',
            title: `Player ratings recalculated`,
            description: `${updated} players updated, ${skipped} skipped`,
            entityType: 'system',
          },
        })
      }
      
      return {
        updated,
        skipped,
        changes: allChanges,
      }
    },
  },
}

