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
  Upload,
  FileText,
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
  matchesPerDay: number
  matchDuration: number
  breakBetween: number
  formatDocument: string
  aiParsedRules: object | null
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
    matchesPerDay: 4,
    matchDuration: 180,
    breakBetween: 30,
    formatDocument: '',
    aiParsedRules: null
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
    if (!formData.formatDocument) return
    
    setAiAnalyzing(true)
    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation AnalyzeTournamentFormat($documentUrl: String!) {
              analyzeTournamentFormat(documentUrl: $documentUrl) {
                formatType
                totalRounds
                pairingRules
                tiebreakerRules
                suggestions
              }
            }
          `,
          variables: { documentUrl: formData.formatDocument }
        })
      })
      
      const { data } = await response.json()
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
              startDate: formData.startDate,
              endDate: formData.endDate || null,
              formatType: formData.formatType,
              matchFormat: formData.matchFormat,
              overs: formData.overs,
              totalRounds: formData.totalRounds,
              matchesPerDay: formData.matchesPerDay,
              matchDuration: formData.matchDuration,
              breakBetween: formData.breakBetween,
              formatDocument: formData.formatDocument || null,
              formatRules: formData.aiParsedRules
            }
          }
        })
      })
      
      const { data, errors } = await response.json()
      if (errors) {
        console.error('GraphQL errors:', errors)
        return
      }
      if (data?.createTournament?.id) {
        router.push(`/tournament/${data.createTournament.id}`)
      }
    } catch (error) {
      console.error('Failed to create tournament:', error)
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
              Choose a format or upload a document for AI analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* AI Document Upload */}
            <div className="p-4 bg-cyan-50 rounded-lg border border-cyan-200">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-cyan-100 flex items-center justify-center flex-shrink-0">
                  <Zap className="h-5 w-5 text-cyan-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-cyan-800">AI Format Analysis</h4>
                  <p className="text-sm text-cyan-600 mb-3">
                    Paste a URL to your format document and AI will extract the rules
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={formData.formatDocument}
                      onChange={(e) => setFormData({ ...formData, formatDocument: e.target.value })}
                      className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      placeholder="https://docs.google.com/..."
                    />
                    <Button 
                      onClick={handleAnalyzeFormat}
                      disabled={!formData.formatDocument || aiAnalyzing}
                      className="gap-2"
                    >
                      {aiAnalyzing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      Analyze
                    </Button>
                  </div>
                  {aiSuggestions && (
                    <div className="mt-3 p-3 bg-white rounded border border-cyan-200">
                      <p className="text-sm text-cyan-700">{aiSuggestions}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

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
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Matches per Day</label>
                <input
                  type="number"
                  value={formData.matchesPerDay}
                  onChange={(e) => setFormData({ ...formData, matchesPerDay: parseInt(e.target.value) || 4 })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  min={1}
                  max={10}
                />
              </div>
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
                <label className="text-sm font-medium">Break Between (min)</label>
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
                  <span>{formData.startDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>{formData.matchFormat} ({formData.overs} overs)</span>
                </div>
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
