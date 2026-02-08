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
    captainChoice: number
    isWicketkeeper: boolean
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
              captainChoice: data.captainChoice,
              isWicketkeeper: data.isWicketkeeper,
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
