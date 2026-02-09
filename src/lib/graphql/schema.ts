import gql from 'graphql-tag'

export const typeDefs = gql`
  scalar DateTime

  # ============================================
  # ENUMS
  # ============================================

  enum PlayerRole {
    BATSMAN
    BOWLER
    ALL_ROUNDER
    BATTING_ALL_ROUNDER
    BOWLING_ALL_ROUNDER
    WICKETKEEPER
  }

  enum BattingStyle {
    RIGHT_HAND
    LEFT_HAND
  }

  enum BowlingStyle {
    FAST
    MEDIUM_FAST
    MEDIUM
    SPIN_OFF
    SPIN_LEG
    SPIN_LEFT_ARM
    NONE
  }

  enum BattingPosition {
    OPENER
    TOP_ORDER
    MIDDLE_ORDER
    LOWER_ORDER
    FINISHER
  }

  enum PlayerForm {
    EXCELLENT
    GOOD
    AVERAGE
    POOR
  }

  enum InjuryStatus {
    FIT
    MINOR_NIGGLE
    RECOVERING
    INJURED
  }

  enum AvailabilityStatus {
    AVAILABLE
    UNAVAILABLE
    MAYBE
    PENDING
  }

  enum MatchStatus {
    UPCOMING
    IN_PROGRESS
    COMPLETED
    CANCELLED
    POSTPONED
  }

  enum MatchImportance {
    MUST_WIN
    IMPORTANT
    REGULAR
    LOW_STAKES
  }

  enum SelectionMode {
    WIN_FOCUSED
    BALANCED
    OPPORTUNITY_FOCUSED
  }

  # ============================================
  # TYPES
  # ============================================

  type Player {
    id: ID!
    name: String!
    email: String
    phone: String
    profileImage: String
    jerseyNumber: Int
    primaryRole: PlayerRole!
    battingStyle: BattingStyle!
    bowlingStyle: BowlingStyle!
    battingPosition: BattingPosition!
    
    # Skill Ratings (1-10)
    battingSkill: Int!
    bowlingSkill: Int!
    fieldingSkill: Int!
    experienceLevel: Int!
    powerHitting: Int!
    runningBetweenWickets: Int!
    pressureHandling: Int!
    
    # Physical & Fitness
    fitnessLevel: Int!
    currentInjuryStatus: InjuryStatus!
    
    # Detailed Skills
    preferredFieldingPositions: [String!]!
    bowlingVariations: [String!]!
    
    # Availability & Commitment
    reliabilityScore: Int!
    trainingAttendance: Int
    
    # Career History
    previousTeams: [String!]!
    injuryHistory: [String!]!
    
    # Experience Background
    isRookie: Boolean!
    tennisBallBackground: Boolean!
    yearsPlaying: Int
    
    # League Format Availability
    availableForT20: Boolean!
    availableForT30: Boolean!
    leaguePreferenceNotes: String
    
    # Team Status
    captainChoice: Int!
    isActive: Boolean!
    isCaptain: Boolean!
    isViceCaptain: Boolean!
    isWicketkeeper: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
    
    # AI Rating Management
    excludeFromAutoRating: Boolean!
    ratingExclusionReason: String
    lastRatingUpdate: DateTime
    
    # Relations
    seasonStats: [SeasonStats!]!
    currentSeasonStats: SeasonStats
    availabilities: [PlayerAvailability!]!
    ratingHistory: [RatingHistory!]!
    
    # Computed
    opportunityRatio: Float
    overallSkill: Float
  }

  type SeasonStats {
    id: ID!
    seasonId: String!
    matchesAvailable: Int!
    matchesPlayed: Int!
    matchesSelected: Int!
    
    # Batting
    innings: Int!
    runsScored: Int!
    ballsFaced: Int!
    fours: Int!
    sixes: Int!
    notOuts: Int!
    highestScore: Int!
    fifties: Int!
    hundreds: Int!
    ducks: Int!
    
    # Bowling
    oversBowled: Float!
    runsConceded: Int!
    wicketsTaken: Int!
    maidens: Int!
    bestBowling: String
    fourWickets: Int!
    fiveWickets: Int!
    
    # Fielding
    catches: Int!
    runOuts: Int!
    stumpings: Int!
    
    currentForm: PlayerForm!
    
    # Computed
    battingAverage: Float
    strikeRate: Float
    bowlingAverage: Float
    economyRate: Float
  }

  type Season {
    id: ID!
    name: String!
    startDate: DateTime!
    endDate: DateTime
    isActive: Boolean!
    description: String
    totalMatches: Int!
    matchesPlayed: Int!
    wins: Int!
    losses: Int!
    draws: Int!
    noResults: Int!
    currentPosition: Int
    totalTeams: Int
    
    matches: [Match!]!
  }

  type Match {
    id: ID!
    matchDate: DateTime!
    matchNumber: Int
    matchType: String!
    status: MatchStatus!
    importance: MatchImportance!
    weather: String
    leaguePosition: Int
    matchesRemaining: Int
    result: String
    ourScore: String
    opponentScore: String
    marginOfVictory: String
    manOfMatch: String
    captainNotes: String
    matchReport: String
    createdAt: DateTime!
    
    # Relations
    opponent: Opponent!
    venue: Venue!
    season: Season!
    squad: Squad
    availabilities: [PlayerAvailability!]!
    performances: [MatchPerformance!]!
    
    # Computed
    availablePlayers: [Player!]!
    availableCount: Int!
  }

  type Opponent {
    id: ID!
    name: String!
    shortName: String
    logo: String
    homeGround: String
    overallStrength: Int!
    battingStrength: Int!
    bowlingStrength: Int!
    fieldingStrength: Int!
    keyPlayers: [String!]!
    notes: String
    playingStyle: String
    matchesPlayed: Int!
    matchesWon: Int!
    matchesLost: Int!
    matchesDrawn: Int!
    
    # Computed
    winRateAgainst: Float
  }

  type Venue {
    id: ID!
    name: String!
    address: String
    city: String
    googleMapsUrl: String
    pitchType: String!
    boundarySize: String!
    outfieldSpeed: String!
    typicalConditions: String
    averageFirstInningsScore: Int
  }

  type PlayerAvailability {
    id: ID!
    playerId: String!
    matchId: String!
    status: AvailabilityStatus!
    note: String
    respondedAt: DateTime
    
    player: Player!
    match: Match!
  }

  type Squad {
    id: ID!
    matchId: String!
    isAiGenerated: Boolean!
    selectionMode: SelectionMode!
    aiReasoning: String
    winProbability: Float
    fairnessScore: Float
    wasModified: Boolean!
    modificationReason: String
    createdAt: DateTime!
    
    players: [SquadPlayer!]!
    match: Match!
  }

  type SquadPlayer {
    id: ID!
    squadId: String!
    playerId: String!
    battingOrder: Int
    isPlaying: Boolean!
    roleInMatch: String
    selectionReason: String
    
    player: Player!
  }

  type MatchPerformance {
    id: ID!
    playerId: String!
    matchId: String!
    
    # Batting
    didBat: Boolean!
    battingOrder: Int
    runsScored: Int!
    ballsFaced: Int!
    fours: Int!
    sixes: Int!
    isNotOut: Boolean!
    howOut: String
    dismissedBy: String
    
    # Bowling
    didBowl: Boolean!
    oversBowled: Float!
    runsConceded: Int!
    wicketsTaken: Int!
    maidens: Int!
    wides: Int!
    noBalls: Int!
    
    # Fielding
    catches: Int!
    runOuts: Int!
    stumpings: Int!
    droppedCatches: Int!
    
    isManOfMatch: Boolean!
    captainRating: Int
    notes: String
    
    player: Player!
    match: Match!
  }

  type Activity {
    id: ID!
    type: String!
    title: String!
    description: String
    actorName: String
    entityType: String
    entityId: String
    createdAt: DateTime!
  }
  
  type Media {
    id: ID!
    type: String!
    url: String!
    thumbnailUrl: String
    title: String
    description: String
    duration: Int
    createdAt: DateTime!
    match: Match
    tags: [MediaTag!]!
  }
  
  type MediaTag {
    id: ID!
    tag: String!
  }

  # ============================================
  # RATING TYPES
  # ============================================

  enum RatingSkillType {
    BATTING
    BOWLING
    FIELDING
    POWER_HITTING
    RUNNING_BETWEEN_WICKETS
    PRESSURE_HANDLING
  }

  type RatingHistory {
    id: ID!
    playerId: String!
    matchId: String
    skillType: RatingSkillType!
    previousRating: Int!
    newRating: Int!
    changeAmount: Int!
    performanceScore: Float
    reason: String
    createdAt: DateTime!
  }

  type RatingChange {
    playerId: String!
    playerName: String!
    skillType: RatingSkillType!
    previousRating: Int!
    newRating: Int!
    changeAmount: Int!
    performanceScore: Float!
    reason: String!
  }

  type PlayerRatingPreview {
    playerId: String!
    playerName: String!
    primaryRole: String!
    currentRatings: PlayerRatings!
    proposedChanges: [RatingChange!]!
    excluded: Boolean!
    exclusionReason: String
  }

  type PlayerRatings {
    battingSkill: Int!
    bowlingSkill: Int!
    fieldingSkill: Int!
    powerHitting: Int!
    runningBetweenWickets: Int!
    pressureHandling: Int!
  }

  type RatingRecalculationResult {
    updated: Int!
    skipped: Int!
    changes: [RatingChange!]!
  }

  # ============================================
  # AI TYPES
  # ============================================

  type SquadRecommendation {
    selectedPlayers: [SquadPlayerRecommendation!]!
    reasoning: String!
    teamBalance: TeamBalance!
    winProbability: Float!
    fairnessScore: Float!
    alternativeSquads: [AlternativeSquad!]
    warnings: [String!]!
    insights: [String!]!
  }

  type SquadPlayerRecommendation {
    player: Player!
    battingOrder: Int!
    roleInMatch: String!
    selectionReason: String!
  }

  type TeamBalance {
    batsmen: Int!
    bowlers: Int!
    allRounders: Int!
    wicketkeepers: Int!
    paceOptions: Int!
    spinOptions: Int!
    leftHandBatsmen: Int!
    rightHandBatsmen: Int!
  }

  type AlternativeSquad {
    players: [Player!]!
    reasoning: String!
    winProbability: Float!
    fairnessScore: Float!
  }

  type OpportunityTracker {
    players: [PlayerOpportunity!]!
    targetRatio: Float!
    playersNeedingGames: [Player!]!
    recommendation: String!
  }

  type PlayerOpportunity {
    player: Player!
    matchesAvailable: Int!
    matchesPlayed: Int!
    ratio: Float!
    status: String!
    gamesNeeded: Int!
  }

  type DashboardStats {
    season: Season!
    topScorer: Player
    topWicketTaker: Player
    topFielder: Player
    recentMatches: [Match!]!
    upcomingMatches: [Match!]!
    recentActivities: [Activity!]!
    teamStrengths: TeamStrengths!
  }

  type TeamStrengths {
    batting: Float!
    bowling: Float!
    fielding: Float!
    experience: Float!
    overall: Float!
  }

  # ============================================
  # INPUTS
  # ============================================

  input PlayerInput {
    name: String!
    email: String
    phone: String
    jerseyNumber: Int
    primaryRole: PlayerRole!
    battingStyle: BattingStyle!
    bowlingStyle: BowlingStyle!
    battingPosition: BattingPosition!
    battingSkill: Int
    bowlingSkill: Int
    fieldingSkill: Int
    experienceLevel: Int
    powerHitting: Int
    runningBetweenWickets: Int
    pressureHandling: Int
    fitnessLevel: Int
    currentInjuryStatus: InjuryStatus
    preferredFieldingPositions: [String!]
    bowlingVariations: [String!]
    reliabilityScore: Int
    trainingAttendance: Int
    previousTeams: [String!]
    injuryHistory: [String!]
    isRookie: Boolean
    tennisBallBackground: Boolean
    yearsPlaying: Int
    availableForT20: Boolean
    availableForT30: Boolean
    leaguePreferenceNotes: String
    captainChoice: Int
    isWicketkeeper: Boolean
  }

  input UpdatePlayerInput {
    name: String
    email: String
    phone: String
    jerseyNumber: Int
    primaryRole: PlayerRole
    battingStyle: BattingStyle
    bowlingStyle: BowlingStyle
    battingPosition: BattingPosition
    battingSkill: Int
    bowlingSkill: Int
    fieldingSkill: Int
    experienceLevel: Int
    powerHitting: Int
    runningBetweenWickets: Int
    pressureHandling: Int
    fitnessLevel: Int
    currentInjuryStatus: InjuryStatus
    preferredFieldingPositions: [String!]
    bowlingVariations: [String!]
    reliabilityScore: Int
    trainingAttendance: Int
    previousTeams: [String!]
    injuryHistory: [String!]
    isRookie: Boolean
    tennisBallBackground: Boolean
    yearsPlaying: Int
    availableForT20: Boolean
    availableForT30: Boolean
    leaguePreferenceNotes: String
    captainChoice: Int
    isActive: Boolean
    isWicketkeeper: Boolean
  }

  input AvailabilityInput {
    playerId: String!
    status: AvailabilityStatus!
    note: String
  }

  input MatchContextInput {
    opponentStrength: String!
    pitchType: String!
    weather: String
    matchImportance: String!
    currentPosition: Int
    matchesRemaining: Int
  }

  input SquadSelectionInput {
    matchId: String!
    mode: SelectionMode!
    context: MatchContextInput
  }

  input SaveSquadInput {
    matchId: String!
    playerIds: [String!]!
    battingOrder: [String!]!
    modificationReason: String
  }
  
  input MediaInput {
    type: String!
    url: String!
    thumbnailUrl: String
    title: String
    description: String
    duration: Int
    matchId: String
  }

  # ============================================
  # QUERIES
  # ============================================

  type Query {
    # Players
    players(activeOnly: Boolean): [Player!]!
    player(id: ID!): Player
    playersWithStats(seasonId: String): [Player!]!
    
    # Seasons
    seasons: [Season!]!
    activeSeason: Season
    season(id: ID!): Season
    
    # Matches
    matches(seasonId: String, status: MatchStatus): [Match!]!
    match(id: ID!): Match
    upcomingMatches(limit: Int): [Match!]!
    recentMatches(limit: Int): [Match!]!
    
    # Opponents & Venues
    opponents: [Opponent!]!
    opponent(id: ID!): Opponent
    venues: [Venue!]!
    venue(id: ID!): Venue
    
    # Squad
    squad(matchId: String!): Squad
    
    # Media
    media: [Media!]!
    
    # Dashboard
    dashboardStats: DashboardStats!
    opportunityTracker(seasonId: String): OpportunityTracker!
    activities(limit: Int): [Activity!]!
    
    # AI
    aiSquadRecommendation(input: SquadSelectionInput!): SquadRecommendation!
    
    # Ratings (Admin only)
    ratingPreview(seasonId: String, excludePlayerIds: [String!]): [PlayerRatingPreview!]!
    playerRatingHistory(playerId: String!, limit: Int): [RatingHistory!]!
  }

  # ============================================
  # MUTATIONS
  # ============================================

  type Mutation {
    # Players
    createPlayer(input: PlayerInput!): Player!
    updatePlayer(id: ID!, input: UpdatePlayerInput!): Player!
    deletePlayer(id: ID!): Boolean!
    
    # Availability
    updateAvailability(matchId: String!, availabilities: [AvailabilityInput!]!): [PlayerAvailability!]!
    
    # Squad
    saveSquad(input: SaveSquadInput!): Squad!
    generateAiSquad(input: SquadSelectionInput!): Squad!
    
    # Matches
    createMatch(
      matchDate: DateTime!
      opponentId: String!
      venueId: String!
      seasonId: String!
      importance: MatchImportance
      captainNotes: String
    ): Match!
    updateMatchResult(
      id: ID!
      result: String!
      ourScore: String
      opponentScore: String
      marginOfVictory: String
      manOfMatch: String
      matchReport: String
    ): Match!
    
    # Opponents
    createOpponent(
      name: String!
      shortName: String
      overallStrength: Int
      battingStrength: Int
      bowlingStrength: Int
      keyPlayers: [String!]
      notes: String
    ): Opponent!
    
    # Venues
    createVenue(
      name: String!
      address: String
      city: String
      pitchType: String
      boundarySize: String
      outfieldSpeed: String
      typicalConditions: String
    ): Venue!
    deleteVenue(id: ID!): Boolean!
    
    # Opponents
    deleteOpponent(id: ID!): Boolean!
    updateOpponent(
      id: ID!
      name: String
      shortName: String
      overallStrength: Int
      battingStrength: Int
      bowlingStrength: Int
      keyPlayers: [String!]
      notes: String
    ): Opponent!
    
    # Venues
    updateVenue(
      id: ID!
      name: String
      address: String
      city: String
      pitchType: String
      boundarySize: String
      outfieldSpeed: String
      typicalConditions: String
    ): Venue!
    
    # Seasons
    createSeason(
      name: String!
      startDate: DateTime!
      endDate: DateTime
      description: String
      totalMatches: Int
      totalTeams: Int
      isActive: Boolean
    ): Season!
    updateSeason(
      id: ID!
      name: String
      startDate: DateTime
      endDate: DateTime
      description: String
      totalMatches: Int
      totalTeams: Int
      isActive: Boolean
      currentPosition: Int
    ): Season!
    deleteSeason(id: ID!): Boolean!
    
    # Matches
    deleteMatch(id: ID!): Boolean!
    updateMatch(
      id: ID!
      matchDate: DateTime
      importance: MatchImportance
      captainNotes: String
      status: MatchStatus
    ): Match!
    
    # Media
    createMedia(input: MediaInput!): Media!
    deleteMedia(id: ID!): Boolean!
    
    # Ratings (Admin only)
    updatePlayerRatingExclusion(
      playerId: String!
      exclude: Boolean!
      reason: String
    ): Player!
    
    applyRatingChanges(
      seasonId: String
      excludePlayerIds: [String!]
      reason: String
    ): RatingRecalculationResult!
  }
`

