/**
 * Tournament Schedule Generator
 * Rules-based schedule generation without AI dependency
 */

export interface TeamSeed {
  id: string
  name: string
  seedRank: number
}

export interface GroupConfig {
  groupName: string
  teams: TeamSeed[]
}

export interface ScheduleConfig {
  totalTeams: number
  teamsPerGroup: number
  gamesPerTeam: number
  venues: number
  saturdayGamesPerVenue: number
  sundayGamesPerVenue: number
  avoidDoubleHeaders: boolean
  startDate: Date
  matchDurationMinutes: number
}

export interface GeneratedFixture {
  homeTeam: TeamSeed
  awayTeam: TeamSeed
  groupName: string
  roundNumber: number
  isCrossGroup: boolean
  scheduledDate?: Date
  scheduledTime?: string
  venue?: string
  slotNumber?: number
}

export interface ScheduleResult {
  groups: GroupConfig[]
  fixtures: GeneratedFixture[]
  schedule: ScheduledMatch[]
  summary: {
    totalGroups: number
    totalFixtures: number
    totalWeeks: number
    gamesPerWeekend: number
  }
  warnings: string[]
}

export interface ScheduledMatch extends GeneratedFixture {
  scheduledDate: Date
  scheduledTime: string
  venue: string
  dayOfWeek: 'Saturday' | 'Sunday'
  slotNumber: number
}

export interface VenueSlot {
  venue: string
  date: Date
  dayOfWeek: 'Saturday' | 'Sunday'
  slotNumber: number
  time: string
  isAssigned: boolean
}

/**
 * Create balanced groups from seeded teams using snake draft
 * Seeds are distributed to ensure competitive balance
 */
export function createGroupsFromSeeds(
  teams: TeamSeed[],
  preferredGroupSize: number = 5
): GroupConfig[] {
  const totalTeams = teams.length
  
  // Sort by seed rank
  const sortedTeams = [...teams].sort((a, b) => a.seedRank - b.seedRank)
  
  // Calculate number of groups
  // For 21 teams with preferred size 5: 4 groups (3 of 5, 1 of 6)
  const numGroups = Math.ceil(totalTeams / preferredGroupSize)
  
  // Initialize groups
  const groups: GroupConfig[] = []
  const groupNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  
  for (let i = 0; i < numGroups; i++) {
    groups.push({
      groupName: groupNames[i] || `Group ${i + 1}`,
      teams: []
    })
  }
  
  // Snake draft distribution for balanced groups
  // Round 1: 1,2,3,4 -> Groups A,B,C,D
  // Round 2: 5,6,7,8 -> Groups D,C,B,A (reverse)
  // Round 3: 9,10,11,12 -> Groups A,B,C,D
  // etc.
  let direction = 1
  let groupIndex = 0
  
  for (const team of sortedTeams) {
    groups[groupIndex].teams.push(team)
    
    // Move to next group
    groupIndex += direction
    
    // Reverse direction at boundaries
    if (groupIndex >= numGroups) {
      groupIndex = numGroups - 1
      direction = -1
    } else if (groupIndex < 0) {
      groupIndex = 0
      direction = 1
    }
  }
  
  return groups
}

/**
 * Generate round-robin fixtures within a group
 */
function generateGroupFixtures(group: GroupConfig): GeneratedFixture[] {
  const fixtures: GeneratedFixture[] = []
  const teams = group.teams
  const n = teams.length
  
  // Standard round-robin: each team plays every other team once
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      // Alternate home/away based on seed
      const homeFirst = teams[i].seedRank < teams[j].seedRank
      fixtures.push({
        homeTeam: homeFirst ? teams[i] : teams[j],
        awayTeam: homeFirst ? teams[j] : teams[i],
        groupName: group.groupName,
        roundNumber: 0, // Will be assigned during scheduling
        isCrossGroup: false
      })
    }
  }
  
  return fixtures
}

/**
 * Generate cross-group fixtures to ensure all teams play required number of games
 */
function generateCrossGroupFixtures(
  groups: GroupConfig[],
  gamesPerTeam: number
): GeneratedFixture[] {
  const crossFixtures: GeneratedFixture[] = []
  
  // Calculate games needed per team
  const teamGamesNeeded: Map<string, number> = new Map()
  
  for (const group of groups) {
    const gamesInGroup = group.teams.length - 1 // Round robin within group
    const extraGamesNeeded = gamesPerTeam - gamesInGroup
    
    for (const team of group.teams) {
      if (extraGamesNeeded > 0) {
        teamGamesNeeded.set(team.id, extraGamesNeeded)
      }
    }
  }
  
  // Find teams that need extra games and pair them across groups
  const teamsNeedingGames = Array.from(teamGamesNeeded.entries())
    .filter(([_, needed]) => needed > 0)
    .map(([teamId, needed]) => {
      for (const group of groups) {
        const team = group.teams.find(t => t.id === teamId)
        if (team) return { team, groupName: group.groupName, gamesNeeded: needed }
      }
      return null
    })
    .filter(Boolean) as Array<{ team: TeamSeed; groupName: string; gamesNeeded: number }>
  
  // Pair teams from different groups with similar seeds
  const paired = new Set<string>()
  
  for (const teamInfo of teamsNeedingGames) {
    if (teamInfo.gamesNeeded <= 0) continue
    
    // Find opponent from different group with similar seed
    for (const oppInfo of teamsNeedingGames) {
      if (oppInfo.groupName === teamInfo.groupName) continue
      if (oppInfo.gamesNeeded <= 0) continue
      
      const pairKey = [teamInfo.team.id, oppInfo.team.id].sort().join('-')
      if (paired.has(pairKey)) continue
      
      // Create cross-group fixture
      crossFixtures.push({
        homeTeam: teamInfo.team.seedRank < oppInfo.team.seedRank ? teamInfo.team : oppInfo.team,
        awayTeam: teamInfo.team.seedRank < oppInfo.team.seedRank ? oppInfo.team : teamInfo.team,
        groupName: `${teamInfo.groupName} vs ${oppInfo.groupName}`,
        roundNumber: 0,
        isCrossGroup: true
      })
      
      paired.add(pairKey)
      teamInfo.gamesNeeded--
      oppInfo.gamesNeeded--
      
      if (teamInfo.gamesNeeded <= 0) break
    }
  }
  
  return crossFixtures
}

/**
 * Generate venue slots for scheduling
 */
function generateVenueSlots(
  config: ScheduleConfig,
  numWeeks: number
): VenueSlot[] {
  const slots: VenueSlot[] = []
  const currentDate = new Date(config.startDate)
  
  // Find first Saturday
  while (currentDate.getDay() !== 6) {
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  for (let week = 0; week < numWeeks; week++) {
    const saturday = new Date(currentDate)
    saturday.setDate(saturday.getDate() + (week * 7))
    
    const sunday = new Date(saturday)
    sunday.setDate(sunday.getDate() + 1)
    
    // Saturday slots
    for (let v = 1; v <= config.venues; v++) {
      for (let s = 1; s <= config.saturdayGamesPerVenue; s++) {
        const time = s === 1 ? '09:00' : '14:00'
        slots.push({
          venue: `Venue ${v}`,
          date: new Date(saturday),
          dayOfWeek: 'Saturday',
          slotNumber: s,
          time,
          isAssigned: false
        })
      }
    }
    
    // Sunday slots (morning only)
    for (let v = 1; v <= config.venues; v++) {
      for (let s = 1; s <= config.sundayGamesPerVenue; s++) {
        slots.push({
          venue: `Venue ${v}`,
          date: new Date(sunday),
          dayOfWeek: 'Sunday',
          slotNumber: 1,
          time: '09:00',
          isAssigned: false
        })
      }
    }
  }
  
  return slots
}

/**
 * Schedule fixtures to venue slots avoiding double headers
 */
function scheduleFixtures(
  fixtures: GeneratedFixture[],
  slots: VenueSlot[],
  avoidDoubleHeaders: boolean
): { scheduled: ScheduledMatch[]; unscheduled: GeneratedFixture[]; warnings: string[] } {
  const scheduled: ScheduledMatch[] = []
  const unscheduled: GeneratedFixture[] = []
  const warnings: string[] = []
  
  // Track team assignments per day to avoid double headers
  const teamDayAssignments: Map<string, Set<string>> = new Map()
  
  const getDateKey = (date: Date) => date.toISOString().split('T')[0]
  
  // Sort fixtures: prioritize intra-group, then by team seeds
  const sortedFixtures = [...fixtures].sort((a, b) => {
    if (a.isCrossGroup !== b.isCrossGroup) return a.isCrossGroup ? 1 : -1
    return (a.homeTeam.seedRank + a.awayTeam.seedRank) - (b.homeTeam.seedRank + b.awayTeam.seedRank)
  })
  
  let roundNumber = 1
  let fixturesInRound = 0
  const fixturesPerRound = Math.min(slots.filter(s => !s.isAssigned).length / 2, 12) // Approx games per weekend
  
  for (const fixture of sortedFixtures) {
    let assigned = false
    
    for (const slot of slots) {
      if (slot.isAssigned) continue
      
      const dateKey = getDateKey(slot.date)
      
      // Check for double headers
      if (avoidDoubleHeaders) {
        const dayAssignments = teamDayAssignments.get(dateKey) || new Set()
        
        if (dayAssignments.has(fixture.homeTeam.id) || dayAssignments.has(fixture.awayTeam.id)) {
          continue // Skip this slot, team already plays on this day
        }
      }
      
      // Assign fixture to slot
      slot.isAssigned = true
      
      const dayAssignments = teamDayAssignments.get(dateKey) || new Set()
      dayAssignments.add(fixture.homeTeam.id)
      dayAssignments.add(fixture.awayTeam.id)
      teamDayAssignments.set(dateKey, dayAssignments)
      
      scheduled.push({
        ...fixture,
        roundNumber,
        scheduledDate: slot.date,
        scheduledTime: slot.time,
        venue: slot.venue,
        dayOfWeek: slot.dayOfWeek,
        slotNumber: slot.slotNumber
      })
      
      fixturesInRound++
      if (fixturesInRound >= fixturesPerRound) {
        roundNumber++
        fixturesInRound = 0
      }
      
      assigned = true
      break
    }
    
    if (!assigned) {
      unscheduled.push(fixture)
    }
  }
  
  if (unscheduled.length > 0) {
    warnings.push(`${unscheduled.length} fixtures could not be scheduled. Consider adding more weekends or relaxing double-header restrictions.`)
  }
  
  return { scheduled, unscheduled, warnings }
}

/**
 * Main function: Generate complete tournament schedule
 */
export function generateTournamentSchedule(
  teams: TeamSeed[],
  config: Partial<ScheduleConfig> = {}
): ScheduleResult {
  const warnings: string[] = []
  
  // Default configuration
  const fullConfig: ScheduleConfig = {
    totalTeams: teams.length,
    teamsPerGroup: config.teamsPerGroup || 5,
    gamesPerTeam: config.gamesPerTeam || 5,
    venues: config.venues || 6,
    saturdayGamesPerVenue: config.saturdayGamesPerVenue || 2,
    sundayGamesPerVenue: config.sundayGamesPerVenue || 1,
    avoidDoubleHeaders: config.avoidDoubleHeaders ?? true,
    startDate: config.startDate || new Date(),
    matchDurationMinutes: config.matchDurationMinutes || 180
  }
  
  // Step 1: Create groups from seeded teams
  const groups = createGroupsFromSeeds(teams, fullConfig.teamsPerGroup)
  
  // Log group sizes
  const groupSizes = groups.map(g => `Group ${g.groupName}: ${g.teams.length} teams`)
  warnings.push(`Created ${groups.length} groups: ${groupSizes.join(', ')}`)
  
  // Step 2: Generate intra-group fixtures (round robin)
  let allFixtures: GeneratedFixture[] = []
  
  for (const group of groups) {
    const groupFixtures = generateGroupFixtures(group)
    allFixtures = allFixtures.concat(groupFixtures)
  }
  
  // Step 3: Generate cross-group fixtures for teams that need more games
  const crossGroupFixtures = generateCrossGroupFixtures(groups, fullConfig.gamesPerTeam)
  allFixtures = allFixtures.concat(crossGroupFixtures)
  
  // Step 4: Calculate weeks needed
  const gamesPerWeekend = (fullConfig.venues * fullConfig.saturdayGamesPerVenue) + 
                          (fullConfig.venues * fullConfig.sundayGamesPerVenue)
  const weeksNeeded = Math.ceil(allFixtures.length / gamesPerWeekend) + 1 // Extra buffer
  
  // Step 5: Generate venue slots
  const venueSlots = generateVenueSlots(fullConfig, weeksNeeded)
  
  // Step 6: Schedule fixtures
  const { scheduled, unscheduled, warnings: scheduleWarnings } = scheduleFixtures(
    allFixtures,
    venueSlots,
    fullConfig.avoidDoubleHeaders
  )
  
  warnings.push(...scheduleWarnings)
  
  // Verify games per team
  const teamGameCount: Map<string, number> = new Map()
  for (const match of scheduled) {
    teamGameCount.set(match.homeTeam.id, (teamGameCount.get(match.homeTeam.id) || 0) + 1)
    teamGameCount.set(match.awayTeam.id, (teamGameCount.get(match.awayTeam.id) || 0) + 1)
  }
  
  for (const team of teams) {
    const games = teamGameCount.get(team.id) || 0
    if (games !== fullConfig.gamesPerTeam) {
      warnings.push(`${team.name} has ${games} games (expected ${fullConfig.gamesPerTeam})`)
    }
  }
  
  // Calculate actual weeks used
  const uniqueWeeks = new Set(scheduled.map(m => {
    const d = new Date(m.scheduledDate)
    return `${d.getFullYear()}-W${Math.ceil(d.getDate() / 7)}`
  }))
  
  return {
    groups,
    fixtures: allFixtures,
    schedule: scheduled,
    summary: {
      totalGroups: groups.length,
      totalFixtures: allFixtures.length,
      totalWeeks: uniqueWeeks.size,
      gamesPerWeekend
    },
    warnings
  }
}

/**
 * Format schedule for display
 */
export function formatScheduleForDisplay(result: ScheduleResult): string {
  let output = '# Tournament Schedule\n\n'
  
  // Groups
  output += '## Groups\n\n'
  for (const group of result.groups) {
    output += `### Group ${group.groupName}\n`
    for (const team of group.teams) {
      output += `- ${team.seedRank}. ${team.name}\n`
    }
    output += '\n'
  }
  
  // Schedule by date
  output += '## Match Schedule\n\n'
  
  const matchesByDate = new Map<string, ScheduledMatch[]>()
  for (const match of result.schedule) {
    const dateStr = match.scheduledDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
    const existing = matchesByDate.get(dateStr) || []
    existing.push(match)
    matchesByDate.set(dateStr, existing)
  }
  
  for (const [date, matches] of Array.from(matchesByDate.entries())) {
    output += `### ${date}\n`
    for (const match of matches.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))) {
      output += `- ${match.scheduledTime} @ ${match.venue}: ${match.homeTeam.name} vs ${match.awayTeam.name}`
      if (match.isCrossGroup) output += ' (Cross-group)'
      output += '\n'
    }
    output += '\n'
  }
  
  // Summary
  output += '## Summary\n'
  output += `- Total Groups: ${result.summary.totalGroups}\n`
  output += `- Total Fixtures: ${result.summary.totalFixtures}\n`
  output += `- Total Weeks: ${result.summary.totalWeeks}\n`
  output += `- Games per Weekend: ${result.summary.gamesPerWeekend}\n`
  
  if (result.warnings.length > 0) {
    output += '\n## Notes\n'
    for (const warning of result.warnings) {
      output += `- ${warning}\n`
    }
  }
  
  return output
}
