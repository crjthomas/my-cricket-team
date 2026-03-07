'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { usePermissions } from '@/lib/auth-context'
import { 
  ArrowLeft,
  ArrowRight,
  CalendarClock, 
  Trophy,
  Loader2,
  Calendar,
  Sparkles,
  CheckCircle2,
  Users,
  MapPin,
  Clock,
  Zap
} from 'lucide-react'
import { cn } from '@/lib/utils'

type TournamentFormat = 'SWISS' | 'KNOCKOUT' | 'ROUND_ROBIN' | 'GROUP_STAGE_KNOCKOUT' | 'DOUBLE_ELIMINATION' | 'CUSTOM'
type MatchFormat = 'T20' | 'T30' | 'T10' | 'ODI' | 'OTHER'

interface TournamentFormData {
  name: string
  description: string
  startDate: string
  endDate: string
  formatType: TournamentFormat
  matchFormat: MatchFormat
  overs: number
  totalRounds: number | null
  numberOfVenues: number
  slotsPerVenue: number
  matchesPerDay: number
  matchDuration: number
  breakBetween: number
  formatDocument: string
  customRulesText: string
  aiParsedRules: object | null
  weekendsOnly: boolean
  saturdayVenues: number
  saturdaySlots: number
  sundayVenues: number
  sundaySlots: number
  sundayMorningOnly: boolean
}

export default function CreateTournamentPage() {
  const router = useRouter()
  const { canManageTournaments } = usePermissions()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [aiAnalyzing, setAiAnalyzing] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<TournamentFormData>({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    formatType: 'SWISS',
    matchFormat: 'T20',
    overs: 20,
    totalRounds: null,
    numberOfVenues: 6,
    slotsPerVenue: 2,   // Morning and afternoon
    matchesPerDay: 12,  // 6 venues x 2 slots
    matchDuration: 180,
    breakBetween: 30,
    formatDocument: '',
    customRulesText: '',
    aiParsedRules: null,
    weekendsOnly: true,          // Matches on Sat/Sun only
    saturdayVenues: 6,           // Full venues on Saturday
    saturdaySlots: 2,            // Morning + Afternoon
    sundayVenues: 2,             // Fewer venues on Sunday (others used by different tournaments)
    sundaySlots: 1,              // Morning only on Sunday
    sundayMorningOnly: true      // Sunday restricted to morning
  })

  const formatOptions: { value: TournamentFormat; label: string; description: string }[] = [
    { value: 'SWISS', label: 'Swiss System', description: 'Teams with similar scores play each other. Fair and efficient for large tournaments.' },
    { value: 'KNOCKOUT', label: 'Knockout', description: 'Single elimination - lose once and you are out.' },
    { value: 'ROUND_ROBIN', label: 'Round Robin', description: 'Every team plays every other team once.' },
    { value: 'GROUP_STAGE_KNOCKOUT', label: 'Groups + Knockout', description: 'Group stage followed by knockout rounds.' },
    { value: 'DOUBLE_ELIMINATION', label: 'Double Elimination', description: 'Teams must lose twice to be eliminated.' },
    { value: 'CUSTOM', label: 'Custom Format', description: 'Define your own tournament rules.' },
  ]

  const handleAnalyzeFormat = async () => {
    const textToAnalyze = formData.customRulesText || formData.formatDocument
    if (!textToAnalyze) {
      alert('Please enter the tournament format rules text to analyze.')
      return
    }
    
    setAiAnalyzing(true)
    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation AnalyzeTournamentFormat($documentText: String!) {
              analyzeTournamentFormat(documentText: $documentText) {
                formatType
                totalRounds
                pairingRules
                tiebreakerRules
                specialRules
                suggestions
              }
            }
          `,
          variables: { documentText: textToAnalyze }
        })
      })
      
      const { data, errors } = await response.json()
      if (errors) {
        console.error('GraphQL errors:', errors)
        setAiSuggestions('AI analysis failed. Please try again.')
        return
      }
      if (data?.analyzeTournamentFormat) {
        const result = data.analyzeTournamentFormat
        setAiSuggestions(result.suggestions)
        if (result.formatType) {
          setFormData(prev => ({
            ...prev,
            formatType: result.formatType,
            totalRounds: result.totalRounds || prev.totalRounds,
            aiParsedRules: {
              pairingRules: result.pairingRules,
              tiebreakerRules: result.tiebreakerRules
            }
          }))
        }
      }
    } catch (error) {
      console.error('Failed to analyze format:', error)
    } finally {
      setAiAnalyzing(false)
    }
  }

  const handleCreate = async () => {
    setLoading(true)
    try {
      // Calculate matches per day based on weekend settings
      const effectiveMatchesPerDay = formData.weekendsOnly 
        ? formData.saturdayVenues * formData.saturdaySlots  // Use Saturday as the default
        : formData.matchesPerDay

      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation CreateTournament($input: CreateTournamentInput!) {
              createTournament(input: $input) {
                id
                name
              }
            }
          `,
          variables: {
            input: {
              name: formData.name,
              description: formData.description || null,
              startDate: new Date(formData.startDate).toISOString(),
              endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
              formatType: formData.formatType,
              matchFormat: formData.matchFormat,
              overs: formData.overs,
              totalRounds: formData.totalRounds,
              matchesPerDay: effectiveMatchesPerDay,
              slotsPerVenue: formData.slotsPerVenue,
              matchDuration: formData.matchDuration,
              breakBetween: formData.breakBetween,
              formatDocument: formData.formatDocument || null,
              formatRules: formData.aiParsedRules ? JSON.stringify(formData.aiParsedRules) : null,
              weekendsOnly: formData.weekendsOnly,
              saturdayVenues: formData.saturdayVenues,
              saturdaySlots: formData.saturdaySlots,
              sundayVenues: formData.sundayVenues,
              sundaySlots: formData.sundayMorningOnly ? 1 : formData.sundaySlots,
              sundayMorningOnly: formData.sundayMorningOnly
            }
          }
        })
      })
      
      const { data, errors } = await response.json()
      if (errors) {
        console.error('GraphQL errors:', errors)
        alert('Failed to create tournament. Please check all required fields.')
        return
      }
      if (data?.createTournament?.id) {
        router.push(`/tournament/${data.createTournament.id}`)
      }
    } catch (error) {
      console.error('Failed to create tournament:', error)
      alert('Failed to create tournament. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!canManageTournaments) {
    router.push('/tournament')
    return null
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/tournament')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Tournament</h1>
          <p className="text-muted-foreground">
            Set up a new tournament with AI-assisted scheduling
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div className={cn(
              "h-10 w-10 rounded-full flex items-center justify-center font-semibold",
              step >= s 
                ? "bg-cyan-500 text-white" 
                : "bg-gray-100 text-gray-400"
            )}>
              {step > s ? <CheckCircle2 className="h-5 w-5" /> : s}
            </div>
            <span className={cn(
              "ml-2 text-sm font-medium",
              step >= s ? "text-cyan-600" : "text-gray-400"
            )}>
              {s === 1 ? 'Basic Info' : s === 2 ? 'Format' : 'Schedule'}
            </span>
            {s < 3 && (
              <div className={cn(
                "mx-4 h-0.5 w-24",
                step > s ? "bg-cyan-500" : "bg-gray-200"
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-cyan-500" />
              Tournament Details
            </CardTitle>
            <CardDescription>
              Enter the basic information about your tournament
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tournament Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="e.g., Phoenix Cup 2026"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Brief description of the tournament..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date *</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Match Format *</label>
                <select
                  value={formData.matchFormat}
                  onChange={(e) => {
                    const format = e.target.value as MatchFormat
                    let overs = 20
                    if (format === 'T30') overs = 30
                    if (format === 'T10') overs = 10
                    if (format === 'ODI') overs = 50
                    setFormData({ ...formData, matchFormat: format, overs })
                  }}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="T20">T20 (20 overs)</option>
                  <option value="T30">T30 (30 overs)</option>
                  <option value="T10">T10 (10 overs)</option>
                  <option value="ODI">ODI (50 overs)</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Overs per Innings</label>
                <input
                  type="number"
                  value={formData.overs}
                  onChange={(e) => setFormData({ ...formData, overs: parseInt(e.target.value) || 20 })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  min={1}
                  max={50}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={() => setStep(2)}
                disabled={!formData.name || !formData.startDate}
                className="gap-2"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Tournament Format */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-cyan-500" />
              Tournament Format
            </CardTitle>
            <CardDescription>
              Choose a format or upload rules document for AI analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Format Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tournament Format *</label>
              <div className="grid grid-cols-2 gap-3">
                {formatOptions.map((format) => (
                  <div
                    key={format.value}
                    onClick={() => setFormData({ ...formData, formatType: format.value })}
                    className={cn(
                      "p-4 rounded-lg border-2 cursor-pointer transition-all",
                      formData.formatType === format.value
                        ? "border-cyan-500 bg-cyan-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{format.label}</span>
                      {formData.formatType === format.value && (
                        <CheckCircle2 className="h-5 w-5 text-cyan-500" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{format.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Swiss-specific options */}
            {formData.formatType === 'SWISS' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Number of Rounds</label>
                <input
                  type="number"
                  value={formData.totalRounds || ''}
                  onChange={(e) => setFormData({ ...formData, totalRounds: parseInt(e.target.value) || null })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Leave empty for AI to determine based on team count"
                  min={1}
                  max={20}
                />
                <p className="text-xs text-muted-foreground">
                  Typically log₂(teams) + 1 rounds for Swiss system
                </p>
              </div>
            )}

            {/* Format Rules Document - Available for all formats */}
            <div className={cn(
              "p-4 rounded-lg border",
              formData.formatType === 'CUSTOM' 
                ? "bg-purple-50 border-purple-200" 
                : "bg-cyan-50 border-cyan-200"
            )}>
              <div className="flex items-start gap-3">
                <div className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0",
                  formData.formatType === 'CUSTOM' ? "bg-purple-100" : "bg-cyan-100"
                )}>
                  <Zap className={cn(
                    "h-5 w-5",
                    formData.formatType === 'CUSTOM' ? "text-purple-600" : "text-cyan-600"
                  )} />
                </div>
                <div className="flex-1">
                  <h4 className={cn(
                    "font-medium",
                    formData.formatType === 'CUSTOM' ? "text-purple-800" : "text-cyan-800"
                  )}>
                    {formData.formatType === 'CUSTOM' 
                      ? 'Upload Custom Format Rules (Required)' 
                      : 'Format Rules Document (Optional)'}
                  </h4>
                  <p className={cn(
                    "text-sm mb-3",
                    formData.formatType === 'CUSTOM' ? "text-purple-600" : "text-cyan-600"
                  )}>
                    {formData.formatType === 'CUSTOM'
                      ? 'Upload your tournament rules document and AI will extract the scheduling rules'
                      : 'Upload additional rules or modifications to the standard format'}
                  </p>
                  
                  {/* Rules Text Input */}
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className={cn(
                        "text-sm font-medium",
                        formData.formatType === 'CUSTOM' ? "text-purple-700" : "text-cyan-700"
                      )}>
                        Paste the tournament format rules:
                      </label>
                      <textarea
                        value={formData.customRulesText || ''}
                        onChange={(e) => setFormData({ ...formData, customRulesText: e.target.value })}
                        className={cn(
                          "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 bg-white",
                          formData.formatType === 'CUSTOM' 
                            ? "focus:ring-purple-500" 
                            : "focus:ring-cyan-500"
                        )}
                        placeholder="Paste or type the tournament format rules here...&#10;&#10;Example:&#10;- Swiss system with 5 rounds&#10;- Teams are paired based on points (higher plays higher)&#10;- Tiebreaker 1: Buchholz score (sum of opponents' points)&#10;- Tiebreaker 2: Net Run Rate&#10;- Top 4 teams qualify for knockouts&#10;- No team plays same opponent twice"
                        rows={6}
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleAnalyzeFormat}
                        disabled={!formData.customRulesText || aiAnalyzing}
                        className="gap-2"
                        variant={formData.formatType === 'CUSTOM' ? 'default' : 'outline'}
                      >
                        {aiAnalyzing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                        Analyze with AI
                      </Button>
                    </div>
                  </div>
                  
                  {aiSuggestions && (
                    <div className="mt-3 p-3 bg-white rounded border border-cyan-200">
                      <p className="text-sm text-cyan-700 font-medium mb-1">AI Analysis:</p>
                      <p className="text-sm text-cyan-700">{aiSuggestions}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button onClick={() => setStep(3)} className="gap-2">
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Schedule Configuration */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-cyan-500" />
              Schedule Configuration
            </CardTitle>
            <CardDescription>
              Configure how matches will be scheduled
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Playing Days */}
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h4 className="font-medium text-amber-800 mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Playing Days
              </h4>
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  id="weekendsOnly"
                  checked={formData.weekendsOnly}
                  onChange={(e) => setFormData({ ...formData, weekendsOnly: e.target.checked })}
                  className="rounded"
                />
                <label htmlFor="weekendsOnly" className="text-sm font-medium">
                  Weekend matches only (Saturdays & Sundays)
                </label>
              </div>
              
              {formData.weekendsOnly && (
                <div className="grid grid-cols-2 gap-4">
                  {/* Saturday Configuration */}
                  <div className="p-3 bg-white rounded-lg border border-amber-200">
                    <h5 className="font-medium text-amber-700 mb-2">Saturday</h5>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-600">Venues Available</label>
                        <input
                          type="number"
                          value={formData.saturdayVenues}
                          onChange={(e) => setFormData({ ...formData, saturdayVenues: parseInt(e.target.value) || 6 })}
                          className="w-full px-2 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          min={1}
                          max={20}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-600">Time Slots</label>
                        <select
                          value={formData.saturdaySlots}
                          onChange={(e) => setFormData({ ...formData, saturdaySlots: parseInt(e.target.value) || 2 })}
                          className="w-full px-2 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                          <option value={1}>Morning only</option>
                          <option value={2}>Morning + Afternoon</option>
                          <option value={3}>Morning + Afternoon + Evening</option>
                        </select>
                      </div>
                      <div className="text-xs text-amber-600 font-medium">
                        {formData.saturdayVenues * formData.saturdaySlots} matches/Saturday
                      </div>
                    </div>
                  </div>

                  {/* Sunday Configuration */}
                  <div className="p-3 bg-white rounded-lg border border-orange-200">
                    <h5 className="font-medium text-orange-700 mb-2 flex items-center justify-between">
                      Sunday
                      <Badge variant="outline" className="text-xs bg-orange-50">Shared venues</Badge>
                    </h5>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-600">Venues Available</label>
                        <input
                          type="number"
                          value={formData.sundayVenues}
                          onChange={(e) => setFormData({ ...formData, sundayVenues: parseInt(e.target.value) || 2 })}
                          className="w-full px-2 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          min={1}
                          max={20}
                        />
                        <p className="text-xs text-gray-500">Other venues may be used by different tournaments</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="sundayMorningOnly"
                          checked={formData.sundayMorningOnly}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            sundayMorningOnly: e.target.checked,
                            sundaySlots: e.target.checked ? 1 : formData.sundaySlots
                          })}
                          className="rounded"
                        />
                        <label htmlFor="sundayMorningOnly" className="text-xs font-medium">
                          Morning games only
                        </label>
                      </div>
                      {!formData.sundayMorningOnly && (
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-600">Time Slots</label>
                          <select
                            value={formData.sundaySlots}
                            onChange={(e) => setFormData({ ...formData, sundaySlots: parseInt(e.target.value) || 1 })}
                            className="w-full px-2 py-1.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          >
                            <option value={1}>Morning only</option>
                            <option value={2}>Morning + Afternoon</option>
                            <option value={3}>Morning + Afternoon + Evening</option>
                          </select>
                        </div>
                      )}
                      <div className="text-xs text-orange-600 font-medium">
                        {formData.sundayVenues * (formData.sundayMorningOnly ? 1 : formData.sundaySlots)} matches/Sunday
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {formData.weekendsOnly && (
                <div className="mt-3 p-2 bg-cyan-50 rounded border border-cyan-200">
                  <p className="text-sm text-cyan-800">
                    <span className="font-medium">Weekly capacity:</span>{' '}
                    {formData.saturdayVenues * formData.saturdaySlots + formData.sundayVenues * (formData.sundayMorningOnly ? 1 : formData.sundaySlots)} matches/weekend
                    <span className="text-cyan-600 ml-2">
                      (Sat: {formData.saturdayVenues * formData.saturdaySlots}, Sun: {formData.sundayVenues * (formData.sundayMorningOnly ? 1 : formData.sundaySlots)})
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* General Venue Configuration (for non-weekend or as defaults) */}
            {!formData.weekendsOnly && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Venue Configuration
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Number of Venues</label>
                    <input
                      type="number"
                      value={formData.numberOfVenues}
                      onChange={(e) => {
                        const venues = parseInt(e.target.value) || 6
                        setFormData({ 
                          ...formData, 
                          numberOfVenues: venues,
                          matchesPerDay: venues * formData.slotsPerVenue
                        })
                      }}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      min={1}
                      max={20}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Slots per Venue</label>
                    <select
                      value={formData.slotsPerVenue}
                      onChange={(e) => {
                        const slots = parseInt(e.target.value) || 2
                        setFormData({ 
                          ...formData, 
                          slotsPerVenue: slots,
                          matchesPerDay: formData.numberOfVenues * slots
                        })
                      }}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value={1}>1 (Single session)</option>
                      <option value={2}>2 (Morning + Afternoon)</option>
                      <option value={3}>3 (Morning + Afternoon + Evening)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Total Matches/Day</label>
                    <div className="px-3 py-2 bg-white border rounded-md text-lg font-semibold text-cyan-700">
                      {formData.matchesPerDay}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formData.numberOfVenues} venues × {formData.slotsPerVenue} slots
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Time Configuration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Match Duration (min)</label>
                <input
                  type="number"
                  value={formData.matchDuration}
                  onChange={(e) => setFormData({ ...formData, matchDuration: parseInt(e.target.value) || 180 })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  min={60}
                  max={480}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Break Between Slots (min)</label>
                <input
                  type="number"
                  value={formData.breakBetween}
                  onChange={(e) => setFormData({ ...formData, breakBetween: parseInt(e.target.value) || 30 })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  min={0}
                  max={120}
                />
              </div>
            </div>

            {/* Summary */}
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <h4 className="font-medium">Tournament Summary</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-gray-400" />
                  <span>{formData.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-gray-400" />
                  <span>{formatOptions.find(f => f.value === formData.formatType)?.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span>{formData.startDate}{formData.weekendsOnly ? ' (Weekends only)' : ''}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>{formData.matchFormat} ({formData.overs} overs)</span>
                </div>
                {formData.weekendsOnly && (
                  <>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>Sat: {formData.saturdayVenues} venues, {formData.saturdaySlots} slots</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>Sun: {formData.sundayVenues} venues, {formData.sundayMorningOnly ? 'morning only' : `${formData.sundaySlots} slots`}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <Button 
                onClick={handleCreate}
                disabled={loading || !formData.name || !formData.startDate}
                className="gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Create Tournament
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
