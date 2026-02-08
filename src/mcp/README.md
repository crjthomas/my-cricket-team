# Cricket Team MCP Server

This MCP (Model Context Protocol) server provides structured tools for AI assistants to interact with the cricket team management system.

## Available Tools

### Player Management

- **get_players** - Get list of all players with their stats and attributes
  - Filter by `role` (BATSMAN, BOWLER, ALL_ROUNDER, WICKETKEEPER)
  - Filter by `form` (EXCELLENT, GOOD, AVERAGE, POOR)

- **get_player_stats** - Get detailed statistics for a specific player
  - Input: `playerId` or `playerName`

- **compare_players** - Compare two or more players across various metrics
  - Input: `playerIds` (array of player IDs)

### Match Management

- **get_upcoming_matches** - Get list of upcoming matches
  - Input: `limit` (optional, default 5)

- **analyze_match** - Get analysis and insights for a specific match
  - Input: `matchId`

### Squad Selection (AI-Powered)

- **suggest_squad** - Get AI-powered squad suggestion for a match
  - Input: `matchId`, `mode` (WIN_FOCUSED, BALANCED, OPPORTUNITY_FOCUSED)
  - Returns: Selected XI with reasoning, win probability, fairness score

- **get_opportunity_debt** - Get players who need more playing opportunities
  - Input: `threshold` (0-1, default 0.6)

### Training & Development

- **get_training_plan** - Generate a personalized training plan for a player
  - Input: `playerId`, `focus` (BATTING, BOWLING, FIELDING, FITNESS, ALL_ROUND)
  - Input: `duration` (1_WEEK, 2_WEEKS, 1_MONTH)

## Available Resources

- **cricket://season/current** - Current season overview and standings
- **cricket://team/roster** - Complete team roster with all players
- **cricket://stats/leaderboard** - Season statistics leaderboard

## Running the Server

```bash
# Install dependencies
npm install @modelcontextprotocol/sdk

# Run the server
npx tsx src/mcp/server.ts
```

## Integration with AI Assistants

### Claude Desktop

Add to your Claude Desktop config:

```json
{
  "mcpServers": {
    "cricket-team": {
      "command": "npx",
      "args": ["tsx", "/path/to/src/mcp/server.ts"],
      "env": {
        "DATABASE_URL": "your-database-url"
      }
    }
  }
}
```

### Cursor IDE

The MCP server can be used with Cursor's built-in AI features for enhanced cricket team management assistance.

## Example Interactions

### Get Squad Recommendation

```
Tool: suggest_squad
Input: { "matchId": "1", "mode": "BALANCED" }
Output: {
  "players": [...],
  "reasoning": "Squad selected in balanced mode...",
  "winProbability": 65,
  "fairnessScore": 78
}
```

### Find Players Needing Games

```
Tool: get_opportunity_debt
Input: { "threshold": 0.6 }
Output: {
  "playersNeedingGames": [
    { "name": "Karthik Nair", "matchesPlayed": 2, "matchesAvailable": 6, "ratio": "33.3%" }
  ],
  "recommendation": "Consider giving more opportunities to: Karthik Nair"
}
```

### Generate Training Plan

```
Tool: get_training_plan
Input: { "playerId": "5", "focus": "BATTING", "duration": "2_WEEKS" }
Output: {
  "player": "Karthik Nair",
  "drills": [
    { "name": "Net practice", "frequency": "3x/week", "duration": "45 mins" },
    ...
  ],
  "goals": ["Improve strike rate by 10%"]
}
```

