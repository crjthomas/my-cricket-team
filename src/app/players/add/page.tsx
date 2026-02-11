'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { PlayerForm } from '@/components/forms/player-form'
import { useAuth } from '@/lib/auth-context'

export default function AddPlayerPage() {
  const router = useRouter()
  const { isAdmin } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">Only admins can add players.</p>
        <Button onClick={() => router.push('/players')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Players
        </Button>
      </div>
    )
  }

  const handleSubmit = async (data: {
    name: string
    jerseyNumber: number | null
    primaryRole: string
    battingStyle: string
    bowlingStyle: string
    battingPosition: string
    battingSkill: number
    bowlingSkill: number
    fieldingSkill: number
    experienceLevel: number
    powerHitting: number
    runningBetweenWickets: number
    pressureHandling: number
    fitnessLevel: number
    currentInjuryStatus: string
    preferredFieldingPositions: string[]
    bowlingVariations: string[]
    reliabilityScore: number
    trainingAttendance: number | null
    previousTeams: string[]
    injuryHistory: string[]
    isRookie: boolean
    tennisBallBackground: boolean
    yearsPlaying: number | null
    availableForT20: boolean
    availableForT30: boolean
    leaguePreferenceNotes: string
    captainChoice: number
    isWicketkeeper: boolean
    isCaptain: boolean
    isViceCaptain: boolean
    isActive: boolean
  }) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation CreatePlayer($input: PlayerInput!) {
              createPlayer(input: $input) {
                id
                name
              }
            }
          `,
          variables: {
            input: {
              name: data.name,
              jerseyNumber: data.jerseyNumber,
              primaryRole: data.primaryRole,
              battingStyle: data.battingStyle,
              bowlingStyle: data.bowlingStyle,
              battingPosition: data.battingPosition,
              battingSkill: data.battingSkill,
              bowlingSkill: data.bowlingSkill,
              fieldingSkill: data.fieldingSkill,
              experienceLevel: data.experienceLevel,
              powerHitting: data.powerHitting,
              runningBetweenWickets: data.runningBetweenWickets,
              pressureHandling: data.pressureHandling,
              fitnessLevel: data.fitnessLevel,
              currentInjuryStatus: data.currentInjuryStatus,
              preferredFieldingPositions: data.preferredFieldingPositions,
              bowlingVariations: data.bowlingVariations,
              reliabilityScore: data.reliabilityScore,
              trainingAttendance: data.trainingAttendance,
              previousTeams: data.previousTeams,
              injuryHistory: data.injuryHistory,
              isRookie: data.isRookie,
              tennisBallBackground: data.tennisBallBackground,
              yearsPlaying: data.yearsPlaying,
              availableForT20: data.availableForT20,
              availableForT30: data.availableForT30,
              leaguePreferenceNotes: data.leaguePreferenceNotes,
              captainChoice: data.captainChoice,
              isWicketkeeper: data.isWicketkeeper,
              isCaptain: data.isCaptain,
              isViceCaptain: data.isViceCaptain,
            }
          }
        }),
      })

      const result = await response.json()
      
      if (result.errors) {
        throw new Error(result.errors[0].message)
      }

      router.push('/players')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/players')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Player</h1>
          <p className="text-muted-foreground">Add a new player to your team</p>
        </div>
      </div>

      <PlayerForm 
        onSubmit={handleSubmit}
        onCancel={() => router.push('/players')}
        isLoading={isLoading}
      />
    </div>
  )
}
