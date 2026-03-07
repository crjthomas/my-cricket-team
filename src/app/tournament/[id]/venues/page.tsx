'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { usePermissions } from '@/lib/auth-context'
import { 
  ArrowLeft,
  MapPin, 
  Loader2,
  Calendar,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Sun,
  Sunset,
  Moon,
  Ban
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Venue {
  id: string
  name: string
  address: string | null
  city: string | null
}

interface GroundSlot {
  id: string
  venueId: string
  venue: Venue
  date: string
  startTime: string
  endTime: string
  slotNumber: number | null
  isAvailable: boolean
  isBlocked: boolean
  blockReason: string | null
  isPrimary: boolean
}

interface Tournament {
  id: string
  name: string
  startDate: string
  endDate: string | null
}

export default function TournamentVenuesPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { canManageTournaments } = usePermissions()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [venues, setVenues] = useState<Venue[]>([])
  const [groundSlots, setGroundSlots] = useState<GroundSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [showAddSlot, setShowAddSlot] = useState(false)
  const [isAddingSlot, setIsAddingSlot] = useState(false)
  
  const [newSlot, setNewSlot] = useState({
    venueId: '',
    date: '',
    slotType: 'morning' as 'morning' | 'afternoon' | 'evening',
    isPrimary: true
  })

  const slotTimes = {
    morning: { start: '09:00', end: '12:30', label: 'Morning', icon: Sun },
    afternoon: { start: '13:30', end: '17:00', label: 'Afternoon', icon: Sunset },
    evening: { start: '18:00', end: '21:30', label: 'Evening', icon: Moon }
  }

  useEffect(() => {
    fetchData()
  }, [resolvedParams.id])

  const fetchData = async () => {
    try {
      const [tournamentRes, venuesRes, slotsRes] = await Promise.all([
        fetch('/api/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `query GetTournament($id: ID!) {
              tournament(id: $id) { id name startDate endDate }
            }`,
            variables: { id: resolvedParams.id }
          })
        }),
        fetch('/api/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `query { venues { id name address city } }`
          })
        }),
        fetch('/api/graphql', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `query GetSlots($tournamentId: ID!) {
              groundSlots(tournamentId: $tournamentId) {
                id venueId venue { id name address city }
                date startTime endTime slotNumber
                isAvailable isBlocked blockReason isPrimary
              }
            }`,
            variables: { tournamentId: resolvedParams.id }
          })
        })
      ])

      const [tournamentData, venuesData, slotsData] = await Promise.all([
        tournamentRes.json(),
        venuesRes.json(),
        slotsRes.json()
      ])

      if (tournamentData.data?.tournament) {
        setTournament(tournamentData.data.tournament)
        setSelectedDate(tournamentData.data.tournament.startDate.split('T')[0])
      }
      if (venuesData.data?.venues) {
        setVenues(venuesData.data.venues)
      }
      if (slotsData.data?.groundSlots) {
        setGroundSlots(slotsData.data.groundSlots)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const addSlot = async () => {
    if (!newSlot.venueId || !newSlot.date) return
    
    const times = slotTimes[newSlot.slotType]
    setIsAddingSlot(true)
    
    try {
      const response = await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `mutation CreateSlot($input: CreateGroundSlotInput!) {
            createGroundSlot(input: $input) { id }
          }`,
          variables: {
            input: {
              tournamentId: resolvedParams.id,
              venueId: newSlot.venueId,
              date: newSlot.date,
              startTime: times.start,
              endTime: times.end,
              slotNumber: newSlot.slotType === 'morning' ? 1 : newSlot.slotType === 'afternoon' ? 2 : 3,
              isPrimary: newSlot.isPrimary
            }
          }
        })
      })
      
      const { data } = await response.json()
      if (data?.createGroundSlot) {
        setShowAddSlot(false)
        setNewSlot({ venueId: '', date: selectedDate, slotType: 'morning', isPrimary: true })
        fetchData()
      }
    } catch (error) {
      console.error('Failed to add slot:', error)
    } finally {
      setIsAddingSlot(false)
    }
  }

  const toggleSlotAvailability = async (slotId: string, currentlyAvailable: boolean) => {
    try {
      await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `mutation UpdateSlot($id: ID!, $input: UpdateGroundSlotInput!) {
            updateGroundSlot(id: $id, input: $input) { id }
          }`,
          variables: {
            id: slotId,
            input: { isAvailable: !currentlyAvailable }
          }
        })
      })
      fetchData()
    } catch (error) {
      console.error('Failed to update slot:', error)
    }
  }

  const blockSlot = async (slotId: string, reason: string) => {
    try {
      await fetch('/api/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `mutation UpdateSlot($id: ID!, $input: UpdateGroundSlotInput!) {
            updateGroundSlot(id: $id, input: $input) { id }
          }`,
          variables: {
            id: slotId,
            input: { isBlocked: true, blockReason: reason, isAvailable: false }
          }
        })
      })
      fetchData()
    } catch (error) {
      console.error('Failed to block slot:', error)
    }
  }

  const generateDateRange = () => {
    if (!tournament) return []
    const dates: string[] = []
    const start = new Date(tournament.startDate)
    const end = tournament.endDate ? new Date(tournament.endDate) : new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000)
    
    const current = new Date(start)
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0])
      current.setDate(current.getDate() + 1)
    }
    return dates
  }

  const getSlotsForDateAndVenue = (date: string, venueId: string) => {
    return groundSlots.filter(
      s => s.date.split('T')[0] === date && s.venueId === venueId
    )
  }

  const getSlotIcon = (startTime: string) => {
    if (startTime < '12:00') return Sun
    if (startTime < '17:00') return Sunset
    return Moon
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Tournament Not Found</h2>
        <Button variant="outline" onClick={() => router.push('/tournament')}>
          Back to Tournaments
        </Button>
      </div>
    )
  }

  const dateRange = generateDateRange()

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/tournament/${resolvedParams.id}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <MapPin className="h-6 w-6 text-cyan-500" />
            Venue Availability
          </h1>
          <p className="text-muted-foreground">{tournament.name}</p>
        </div>
        {canManageTournaments && (
          <Button onClick={() => { setNewSlot({ ...newSlot, date: selectedDate }); setShowAddSlot(true) }} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Slot
          </Button>
        )}
      </div>

      {/* Date Selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Select Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {dateRange.slice(0, 14).map((date) => {
              const dateObj = new Date(date)
              const isSelected = date === selectedDate
              const slotsOnDate = groundSlots.filter(s => s.date.split('T')[0] === date)
              const availableSlots = slotsOnDate.filter(s => s.isAvailable && !s.isBlocked).length
              
              return (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={cn(
                    "flex flex-col items-center px-4 py-2 rounded-lg min-w-[80px] transition-colors",
                    isSelected 
                      ? "bg-cyan-500 text-white" 
                      : "bg-gray-100 hover:bg-gray-200"
                  )}
                >
                  <span className="text-xs font-medium">
                    {dateObj.toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  <span className="text-lg font-bold">
                    {dateObj.getDate()}
                  </span>
                  <span className="text-xs">
                    {dateObj.toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                  {slotsOnDate.length > 0 && (
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "mt-1 text-xs",
                        isSelected ? "border-white/50 text-white" : ""
                      )}
                    >
                      {availableSlots}/{slotsOnDate.length}
                    </Badge>
                  )}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Add Slot Modal */}
      {showAddSlot && (
        <Card className="border-cyan-200 bg-cyan-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Add Ground Slot</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowAddSlot(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Venue *</label>
                <select
                  value={newSlot.venueId}
                  onChange={(e) => setNewSlot({ ...newSlot, venueId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                >
                  <option value="">Select venue...</option>
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Date *</label>
                <input
                  type="date"
                  value={newSlot.date}
                  onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Time Slot *</label>
              <div className="grid grid-cols-3 gap-3">
                {(Object.keys(slotTimes) as Array<keyof typeof slotTimes>).map((type) => {
                  const slot = slotTimes[type]
                  const Icon = slot.icon
                  return (
                    <button
                      key={type}
                      onClick={() => setNewSlot({ ...newSlot, slotType: type })}
                      className={cn(
                        "p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1",
                        newSlot.slotType === type
                          ? "border-cyan-500 bg-cyan-100"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium text-sm">{slot.label}</span>
                      <span className="text-xs text-muted-foreground">{slot.start} - {slot.end}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPrimary"
                checked={newSlot.isPrimary}
                onChange={(e) => setNewSlot({ ...newSlot, isPrimary: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="isPrimary" className="text-sm">Primary venue (preferred for important matches)</label>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddSlot(false)}>Cancel</Button>
              <Button onClick={addSlot} disabled={isAddingSlot || !newSlot.venueId || !newSlot.date}>
                {isAddingSlot ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Slot'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Venues Grid */}
      <div className="grid gap-4">
        {venues.map((venue) => {
          const slotsForVenue = getSlotsForDateAndVenue(selectedDate, venue.id)
          
          return (
            <Card key={venue.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{venue.name}</CardTitle>
                      {venue.city && (
                        <CardDescription>{venue.city}</CardDescription>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline">
                    {slotsForVenue.filter(s => s.isAvailable && !s.isBlocked).length} / {slotsForVenue.length} available
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {slotsForVenue.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    No slots configured for this date
                    {canManageTournaments && (
                      <Button 
                        variant="link" 
                        size="sm" 
                        onClick={() => { 
                          setNewSlot({ ...newSlot, venueId: venue.id, date: selectedDate })
                          setShowAddSlot(true)
                        }}
                      >
                        Add slot
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex gap-3">
                    {slotsForVenue
                      .sort((a, b) => a.startTime.localeCompare(b.startTime))
                      .map((slot) => {
                        const Icon = getSlotIcon(slot.startTime)
                        return (
                          <div
                            key={slot.id}
                            className={cn(
                              "flex-1 p-3 rounded-lg border-2 transition-all",
                              slot.isBlocked 
                                ? "bg-red-50 border-red-200"
                                : slot.isAvailable
                                  ? "bg-green-50 border-green-200"
                                  : "bg-gray-100 border-gray-200"
                            )}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Icon className={cn(
                                  "h-4 w-4",
                                  slot.isBlocked ? "text-red-500" : slot.isAvailable ? "text-green-600" : "text-gray-400"
                                )} />
                                <span className="font-medium text-sm">
                                  {slot.startTime} - {slot.endTime}
                                </span>
                              </div>
                              {slot.isPrimary && (
                                <Badge variant="outline" className="text-xs">Primary</Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className={cn(
                                "text-xs font-medium",
                                slot.isBlocked ? "text-red-600" : slot.isAvailable ? "text-green-600" : "text-gray-500"
                              )}>
                                {slot.isBlocked ? 'Blocked' : slot.isAvailable ? 'Available' : 'Unavailable'}
                              </span>
                              
                              {canManageTournaments && !slot.isBlocked && (
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => toggleSlotAvailability(slot.id, slot.isAvailable)}
                                  >
                                    {slot.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs text-red-600"
                                    onClick={() => {
                                      const reason = prompt('Reason for blocking this slot:')
                                      if (reason) blockSlot(slot.id, reason)
                                    }}
                                  >
                                    <Ban className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                            </div>
                            
                            {slot.blockReason && (
                              <p className="text-xs text-red-600 mt-1">{slot.blockReason}</p>
                            )}
                          </div>
                        )
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}

        {venues.length === 0 && (
          <Card>
            <CardContent className="py-16 text-center">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Venues Available</h3>
              <p className="text-muted-foreground mb-4">
                Add venues in the main settings to configure ground slots.
              </p>
              <Button variant="outline" onClick={() => router.push('/venues')}>
                Manage Venues
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Legend */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-green-500" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-gray-400" />
              <span>Unavailable</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-red-500" />
              <span>Blocked</span>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <Sun className="h-4 w-4 text-amber-500" />
              <span>Morning</span>
              <Sunset className="h-4 w-4 text-orange-500 ml-2" />
              <span>Afternoon</span>
              <Moon className="h-4 w-4 text-indigo-500 ml-2" />
              <span>Evening</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
