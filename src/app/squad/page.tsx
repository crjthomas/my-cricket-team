'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  Sparkles, 
  Check, 
  X, 
  HelpCircle,
  ChevronRight,
  Users,
  Target,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  ArrowLeftRight,
  Save,
  RefreshCw
} from 'lucide-react'
import { cn, getRoleColor, getFormColor } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

// Mock data
const matchContext = {
  opponent: {
    name: 'Thunder Hawks',
    strength: 8,
    battingStrength: 7,
    bowlingStrength: 9,
    keyPlayers: ['Marcus Johnson (Fast bowler)', 'David Chen (Batsman)'],
  },
  venue: {
    name: 'Riverside Ground',
    pitchType: 'BALANCED',
    boundarySize: 'MEDIUM',
  },
  weather: 'OVERCAST',
  importance: 'MUST_WIN',
  matchDate: 'Feb 8, 2026',
  leaguePosition: 3,
  matchesRemaining: 5,
}

const availablePlayers = [
  { id: '1', name: 'Raj Kumar', jerseyNumber: 7, role: 'BATSMAN', battingSkill: 9, bowlingSkill: 4, form: 'EXCELLENT', matchesPlayed: 6, matchesAvailable: 6, captainChoice: 1, isCaptain: true },
  { id: '2', name: 'Amit Singh', jerseyNumber: 11, role: 'ALL_ROUNDER', battingSkill: 7, bowlingSkill: 8, form: 'GOOD', matchesPlayed: 5, matchesAvailable: 6, captainChoice: 1 },
  { id: '3', name: 'Vikram Patel', jerseyNumber: 45, role: 'BOWLER', battingSkill: 3, bowlingSkill: 9, form: 'EXCELLENT', matchesPlayed: 6, matchesAvailable: 6, captainChoice: 1 },
  { id: '4', name: 'Suresh Menon', jerseyNumber: 1, role: 'WICKETKEEPER', battingSkill: 7, bowlingSkill: 1, form: 'GOOD', matchesPlayed: 6, matchesAvailable: 6, captainChoice: 1, isWicketkeeper: true },
  { id: '5', name: 'Karthik Nair', jerseyNumber: 23, role: 'BATSMAN', battingSkill: 8, bowlingSkill: 3, form: 'AVERAGE', matchesPlayed: 2, matchesAvailable: 6, captainChoice: 2 },
  { id: '6', name: 'Dinesh Kumar', jerseyNumber: 99, role: 'ALL_ROUNDER', battingSkill: 6, bowlingSkill: 7, form: 'GOOD', matchesPlayed: 4, matchesAvailable: 5, captainChoice: 1 },
  { id: '7', name: 'Pradeep Iyer', jerseyNumber: 18, role: 'BATSMAN', battingSkill: 8, bowlingSkill: 4, form: 'EXCELLENT', matchesPlayed: 5, matchesAvailable: 6, captainChoice: 1 },
  { id: '8', name: 'Rahul Menon', jerseyNumber: 33, role: 'BOWLER', battingSkill: 4, bowlingSkill: 8, form: 'GOOD', matchesPlayed: 4, matchesAvailable: 6, captainChoice: 2 },
  { id: '9', name: 'Anand Pillai', jerseyNumber: 77, role: 'BOWLER', battingSkill: 3, bowlingSkill: 8, form: 'AVERAGE', matchesPlayed: 3, matchesAvailable: 5, captainChoice: 2 },
  { id: '10', name: 'Mohit Verma', jerseyNumber: 55, role: 'BOWLER', battingSkill: 3, bowlingSkill: 7, form: 'AVERAGE', matchesPlayed: 3, matchesAvailable: 6, captainChoice: 2 },
  { id: '11', name: 'Sanjay Rao', jerseyNumber: 21, role: 'BOWLER', battingSkill: 4, bowlingSkill: 7, form: 'GOOD', matchesPlayed: 5, matchesAvailable: 6, captainChoice: 1 },
  { id: '12', name: 'Arjun Das', jerseyNumber: 8, role: 'BOWLER', battingSkill: 2, bowlingSkill: 8, form: 'EXCELLENT', matchesPlayed: 4, matchesAvailable: 4, captainChoice: 2 },
  { id: '13', name: 'Ravi Sharma', jerseyNumber: 47, role: 'BATSMAN', battingSkill: 7, bowlingSkill: 1, form: 'GOOD', matchesPlayed: 5, matchesAvailable: 6, captainChoice: 1 },
  { id: '14', name: 'Amit Shah', jerseyNumber: 14, role: 'BATSMAN', battingSkill: 8, bowlingSkill: 1, form: 'GOOD', matchesPlayed: 4, matchesAvailable: 6, captainChoice: 1 },
]

type SelectionMode = 'WIN_FOCUSED' | 'BALANCED' | 'OPPORTUNITY_FOCUSED'

interface SelectedPlayer {
  id: string
  name: string
  jerseyNumber: number
  role: string
  battingOrder: number
  roleInMatch: string
  selectionReason: string
  form: string
  matchesPlayed: number
  matchesAvailable: number
}

// AI-generated squad recommendation (simulated)
const aiRecommendation = {
  selectedPlayers: [
    { id: '7', battingOrder: 1, roleInMatch: 'Opening batsman', selectionReason: 'Excellent form, 198 runs this season' },
    { id: '14', battingOrder: 2, roleInMatch: 'Opening batsman', selectionReason: 'Left-hand variety, good against pace' },
    { id: '1', battingOrder: 3, roleInMatch: 'Top order anchor (C)', selectionReason: 'Captain, team leader, excellent form' },
    { id: '5', battingOrder: 4, roleInMatch: 'Middle order', selectionReason: 'Needs games (2/6), experienced player' },
    { id: '4', battingOrder: 5, roleInMatch: 'Wicketkeeper-batsman', selectionReason: 'Only keeper available, solid bat' },
    { id: '2', battingOrder: 6, roleInMatch: 'All-rounder', selectionReason: 'Bowling option + batting depth' },
    { id: '13', battingOrder: 7, roleInMatch: 'Finisher', selectionReason: 'Power hitter, 9 sixes this season' },
    { id: '6', battingOrder: 8, roleInMatch: 'All-rounder', selectionReason: 'Seam option + useful bat' },
    { id: '3', battingOrder: 9, roleInMatch: 'Pace spearhead', selectionReason: 'Best bowler, 12 wickets' },
    { id: '12', battingOrder: 10, roleInMatch: 'Swing bowler', selectionReason: 'Overcast conditions favor swing' },
    { id: '9', battingOrder: 11, roleInMatch: 'Spin option', selectionReason: 'Left-arm spinner adds variety' },
  ],
  reasoning: `This squad is optimized for the must-win match against Thunder Hawks. Given the overcast conditions at Riverside Ground, we've selected 3 pace options who can exploit swing. 

Karthik Nair has been included despite average form because he's only played 2 of 6 available matches this season - this is a balanced opportunity while keeping the team competitive. His experience against pace bowling will be valuable against Thunder Hawks' fast bowling attack.

The batting order provides left-right combinations to disrupt the bowlers' rhythm. Anand Pillai's left-arm spin could be crucial as Thunder Hawks historically struggle against variety.`,
  teamBalance: {
    batsmen: 5,
    bowlers: 4,
    allRounders: 2,
    wicketkeepers: 1,
    paceOptions: 4,
    spinOptions: 2,
  },
  winProbability: 62,
  fairnessScore: 78,
  warnings: ['Mohit Verma missed out - could be considered for spin-friendly conditions'],
  insights: [
    'Thunder Hawks struggle against left-arm spin - Anand Pillai is key',
    'Overcast conditions favor pace bowling - 4 seamers selected',
    'Karthik Nair needs games - good opportunity with lower pressure batting position',
  ],
}

export default function SquadSelectorPage() {
  const [step, setStep] = useState<'availability' | 'context' | 'selection' | 'review'>('selection')
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('BALANCED')
  const [isGenerating, setIsGenerating] = useState(false)
  const [showAiRecommendation, setShowAiRecommendation] = useState(true)
  const [selectedSquad, setSelectedSquad] = useState<SelectedPlayer[]>(() => 
    aiRecommendation.selectedPlayers.map(sp => {
      const player = availablePlayers.find(p => p.id === sp.id)!
      return {
        ...player,
        battingOrder: sp.battingOrder,
        roleInMatch: sp.roleInMatch,
        selectionReason: sp.selectionReason,
      }
    })
  )

  const handleGenerateSquad = () => {
    setIsGenerating(true)
    // Simulate AI generation
    setTimeout(() => {
      setIsGenerating(false)
      setShowAiRecommendation(true)
    }, 2000)
  }

  const getOpportunityStatus = (played: number, available: number) => {
    const ratio = played / available
    if (ratio < 0.4) return { status: 'NEEDS_GAMES', color: 'text-red-500' }
    if (ratio < 0.6) return { status: 'BELOW_TARGET', color: 'text-amber-500' }
    return { status: 'ON_TRACK', color: 'text-green-500' }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-pitch-500" />
            AI Squad Selector
          </h1>
          <p className="text-muted-foreground mt-1">
            Let AI help you pick the best XI for your next match
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleGenerateSquad} disabled={isGenerating}>
            <RefreshCw className={cn("h-4 w-4 mr-2", isGenerating && "animate-spin")} />
            Regenerate
          </Button>
          <Button className="gap-2">
            <Save className="h-4 w-4" />
            Save Squad
          </Button>
        </div>
      </div>

      {/* Match Context Banner */}
      <Card className="border-leather-200 dark:border-leather-800 bg-gradient-to-r from-leather-50 to-transparent dark:from-leather-950/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-midnight-700 to-midnight-900 text-white font-bold text-lg">
                TH
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Next Match</p>
                <p className="font-semibold text-lg">vs {matchContext.opponent.name}</p>
                <p className="text-sm text-muted-foreground">
                  {matchContext.matchDate} • {matchContext.venue.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <Badge variant="error">{matchContext.importance.replace('_', ' ')}</Badge>
                <p className="text-xs text-muted-foreground mt-1">Match Importance</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{matchContext.opponent.strength}/10</p>
                <p className="text-xs text-muted-foreground">Opponent Strength</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{matchContext.weather.replace('_', ' ')}</p>
                <p className="text-xs text-muted-foreground">Weather</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{availablePlayers.length}</p>
                <p className="text-xs text-muted-foreground">Available</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selection Mode */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { 
            mode: 'WIN_FOCUSED' as const, 
            title: 'Win Focused', 
            description: 'Pick the strongest XI to maximize winning chances',
            icon: Target,
            color: 'leather'
          },
          { 
            mode: 'BALANCED' as const, 
            title: 'Balanced', 
            description: 'Balance competitiveness with fair opportunities',
            icon: Users,
            color: 'pitch'
          },
          { 
            mode: 'OPPORTUNITY_FOCUSED' as const, 
            title: 'Give Chances', 
            description: 'Prioritize players who need more game time',
            icon: TrendingUp,
            color: 'blue'
          },
        ].map((option) => (
          <Card 
            key={option.mode}
            className={cn(
              'cursor-pointer transition-all duration-200',
              selectionMode === option.mode 
                ? `border-${option.color}-500 bg-${option.color}-50 dark:bg-${option.color}-950/30 shadow-lg` 
                : 'hover:border-muted-foreground/30'
            )}
            onClick={() => setSelectionMode(option.mode)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'p-2 rounded-lg',
                  selectionMode === option.mode 
                    ? `bg-${option.color}-100 dark:bg-${option.color}-900` 
                    : 'bg-muted'
                )}>
                  <option.icon className={cn(
                    'h-5 w-5',
                    selectionMode === option.mode 
                      ? `text-${option.color}-600` 
                      : 'text-muted-foreground'
                  )} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{option.title}</p>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
                {selectionMode === option.mode && (
                  <Check className="h-5 w-5 text-pitch-500" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Selected XI */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Selected XI</CardTitle>
                <CardDescription>AI-recommended squad with reasoning</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-pitch-600">{aiRecommendation.winProbability}%</p>
                  <p className="text-xs text-muted-foreground">Win Probability</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{aiRecommendation.fairnessScore}/100</p>
                  <p className="text-xs text-muted-foreground">Fairness Score</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <AnimatePresence>
                {selectedSquad.map((player, index) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-pitch-400 to-pitch-600 text-white font-bold text-sm">
                      {player.battingOrder}
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-muted text-sm font-medium">
                        {player.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{player.name}</p>
                        <Badge className={cn('text-[10px]', getRoleColor(player.role))}>
                          {player.role.replace('_', ' ')}
                        </Badge>
                        <Badge className={cn('text-[10px]', getFormColor(player.form))}>
                          {player.form}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {player.roleInMatch} • {player.selectionReason}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        {player.matchesPlayed}/{player.matchesAvailable}
                      </p>
                      <p className={cn('text-xs', getOpportunityStatus(player.matchesPlayed, player.matchesAvailable).color)}>
                        {Math.round(player.matchesPlayed / player.matchesAvailable * 100)}% played
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowLeftRight className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Team Balance */}
            <div className="mt-6 p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium mb-3">Team Balance</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{aiRecommendation.teamBalance.batsmen}</p>
                  <p className="text-xs text-muted-foreground">Batsmen</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{aiRecommendation.teamBalance.bowlers}</p>
                  <p className="text-xs text-muted-foreground">Bowlers</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{aiRecommendation.teamBalance.allRounders}</p>
                  <p className="text-xs text-muted-foreground">All-rounders</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{aiRecommendation.teamBalance.paceOptions}</p>
                  <p className="text-xs text-muted-foreground">Pace Options</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{aiRecommendation.teamBalance.spinOptions}</p>
                  <p className="text-xs text-muted-foreground">Spin Options</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{aiRecommendation.teamBalance.wicketkeepers}</p>
                  <p className="text-xs text-muted-foreground">Wicketkeeper</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Reasoning & Insights */}
        <div className="space-y-4">
          {/* AI Reasoning */}
          <Card className="border-pitch-200 dark:border-pitch-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-pitch-500" />
                AI Reasoning
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {aiRecommendation.reasoning}
              </p>
            </CardContent>
          </Card>

          {/* Insights */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-stumps-500" />
                Key Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {aiRecommendation.insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-pitch-500 mt-1.5 flex-shrink-0" />
                  <p className="text-sm">{insight}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Warnings */}
          {aiRecommendation.warnings.length > 0 && (
            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Consider
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {aiRecommendation.warnings.map((warning, index) => (
                  <p key={index} className="text-sm text-amber-700 dark:text-amber-300">
                    {warning}
                  </p>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Bench */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Available (Not Selected)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {availablePlayers
                  .filter(p => !selectedSquad.find(s => s.id === p.id))
                  .map((player) => (
                    <div 
                      key={player.id}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-muted text-xs">
                          {player.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{player.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {player.role.replace('_', ' ')} • {player.matchesPlayed}/{player.matchesAvailable} played
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" className="text-xs">
                        Swap
                      </Button>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

