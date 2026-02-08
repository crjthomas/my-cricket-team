'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { PlayerForm } from '@/components/forms/player-form'
import { useAuth } from '@/lib/auth-context'

interface PlayerData {
  id: string
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
  isCaptain: boolean
  isViceCaptain: boolean
  isActive: boolean
}

export default function EditPlayerPage() {
  const params = useParams()
  const router = useRouter()
  const { isAdmin } = useAuth()
  const playerId = params.id as string
  
  const [player, setPlayer] = useState<PlayerData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchPlayer()
  }, [playerId])

  const fetchPlayer = async () => {
    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query GetPlayer($id: ID!) {
              player(id: $id) {
                id
                name
                jerseyNumber
                primaryRole
                battingStyle
                bowlingStyle
                battingPosition
                battingSkill
                bowlingSkill
                fieldingSkill
                experienceLevel
                captainChoice
                isWicketkeeper
                isCaptain
                isViceCaptain
                isActive
              }
            }
          `,
          variables: { id: playerId }
        }),
      })

      const { data } = await response.json()
      setPlayer(data?.player || null)
    } catch (error) {
      console.error('Failed to fetch player:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">Only admins can edit players.</p>
        <Button onClick={() => router.push('/players')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Players
        </Button>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!player) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <h1 className="text-2xl font-bold">Player Not Found</h1>
        <p className="text-muted-foreground">The player you're trying to edit doesn't exist.</p>
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
    isCaptain: boolean
    isViceCaptain: boolean
    isActive: boolean
  }) => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            mutation UpdatePlayer($id: ID!, $input: UpdatePlayerInput!) {
              updatePlayer(id: $id, input: $input) {
                id
                name
              }
            }
          `,
          variables: {
            id: playerId,
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
              isActive: data.isActive,
            }
          }
        }),
      })

      const result = await response.json()
      
      if (result.errors) {
        throw new Error(result.errors[0].message)
      }

      router.push(`/players/${playerId}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/players/${playerId}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Player</h1>
          <p className="text-muted-foreground">Update {player.name}'s profile</p>
        </div>
      </div>

      <PlayerForm 
        player={player}
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/players/${playerId}`)}
        isLoading={isSaving}
      />
    </div>
  )
}
