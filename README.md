# 🏏 My Cricket Team

AI-powered cricket team management application with Gen AI and MCP capabilities for training, mentoring, and smart squad selection.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-5.0-2D3748?style=flat-square&logo=prisma)
![GraphQL](https://img.shields.io/badge/GraphQL-16-E10098?style=flat-square&logo=graphql)
![Claude AI](https://img.shields.io/badge/Claude-AI-orange?style=flat-square)

## ✨ Features

### 📋 Team Management
- **Player Profiles**: Comprehensive player data including skills, roles, batting/bowling styles
- **Season Statistics**: Track runs, wickets, catches, and form throughout the season
- **Opportunity Tracking**: Ensure fair playing time distribution across the squad

### 🎯 AI-Powered Squad Selection
- **Smart Recommendations**: AI analyzes available players, opponent strength, pitch conditions
- **Multiple Selection Modes**:
  - **Win Focused**: Best XI for maximum winning chances
  - **Balanced**: Balance competitiveness with fair opportunities
  - **Give Chances**: Prioritize players who need more game time
- **Explainable AI**: Every selection comes with detailed reasoning

### 🏆 Match Management
- **Fixture Scheduling**: Upcoming matches with opponent details
- **Match Context**: Capture importance, weather, pitch conditions
- **Result Tracking**: Record scores, performances, man of the match
- **Historical Analysis**: Track record against each opponent

### 📊 Statistics & Analytics
- **Leaderboards**: Top performers in batting, bowling, fielding
- **Team Strengths**: Visual breakdown of team capabilities
- **Season Progress**: Track wins, losses, league position

### 📸 Media Gallery
- **Photo & Video Management**: Upload and organize match media
- **Tagging System**: Tag players and events
- **AI Captions** (Coming Soon): Auto-generate descriptions

### 🤖 MCP Integration
Model Context Protocol server for AI assistant integration:
- Query player data and statistics
- Get AI squad recommendations
- Generate personalized training plans
- Analyze match situations

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Anthropic API key (for AI features)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/my-cricket-team.git
cd my-cricket-team
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your database URL and API keys
```

4. **Set up the database**
```bash
npm run db:generate
npm run db:push
npm run db:seed
```

5. **Start the development server**
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 🏗️ Project Structure

```
my-cricket-team/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Seed data
├── src/
│   ├── app/               # Next.js App Router pages
│   │   ├── page.tsx       # Dashboard
│   │   ├── players/       # Player management
│   │   ├── matches/       # Match management
│   │   ├── squad/         # AI Squad Selector
│   │   ├── stats/         # Statistics
│   │   ├── opponents/     # Opponent analysis
│   │   ├── venues/        # Venue information
│   │   ├── media/         # Media gallery
│   │   ├── season/        # Season overview
│   │   └── settings/      # App settings
│   ├── components/
│   │   ├── layout/        # Sidebar, Header
│   │   └── ui/            # Reusable UI components
│   ├── lib/
│   │   ├── prisma.ts      # Database client
│   │   ├── utils.ts       # Utility functions
│   │   ├── graphql/       # GraphQL schema & resolvers
│   │   └── ai/            # AI squad selector
│   └── mcp/
│       ├── server.ts      # MCP server
│       └── README.md      # MCP documentation
├── package.json
└── README.md
```

## 🔌 API

### GraphQL Endpoint
```
POST /api/graphql
```

Example query:
```graphql
query {
  players(activeOnly: true) {
    id
    name
    primaryRole
    currentSeasonStats {
      runsScored
      wicketsTaken
      currentForm
    }
  }
}
```

### MCP Server

Run the MCP server:
```bash
npm run mcp:dev
```

Available tools:
- `get_players` - Query player data
- `suggest_squad` - AI squad recommendations
- `get_opportunity_debt` - Fair play tracking
- `get_training_plan` - Personalized training
- `analyze_match` - Match insights

## 🎨 Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI, Framer Motion
- **Backend**: Next.js API Routes, GraphQL (Apollo Server)
- **Database**: PostgreSQL with Prisma ORM
- **AI**: Anthropic Claude API
- **MCP**: Model Context Protocol SDK

## 🔧 Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude |
| `NEXT_PUBLIC_APP_URL` | Application URL |

### Database Commands

```bash
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema to database
npm run db:migrate    # Run migrations
npm run db:seed       # Seed sample data
npm run db:studio     # Open Prisma Studio
```

## 📱 Screenshots

### Dashboard
Modern dashboard with team overview, upcoming matches, and AI insights.

### AI Squad Selector
Intelligent squad selection with multiple modes and detailed reasoning.

### Player Profiles
Comprehensive player cards with skills, stats, and opportunity tracking.

### Statistics
Leaderboards and performance analytics across the season.

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a PR.

## 📄 License

This project is licensed under the MIT License.

---

Built with ❤️ for cricket lovers. May your team always win! 🏏
