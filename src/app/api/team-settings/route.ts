import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerUser, isAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// GET team settings
export async function GET() {
  try {
    // Any authenticated user can view team settings
    const user = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get or create default settings
    let settings = await prisma.teamSettings.findUnique({
      where: { id: 'default' }
    })

    if (!settings) {
      settings = await prisma.teamSettings.create({
        data: { id: 'default' }
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Get team settings error:', error)
    return NextResponse.json({ error: 'Failed to get settings' }, { status: 500 })
  }
}

// PUT update team settings
export async function PUT(request: Request) {
  try {
    // Only admins can update team settings
    const user = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isAdmin(user)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { teamName, captainName, homeGround, matchReminders, availabilityRequests, squadAnnouncements, performanceUpdates } = body

    const settings = await prisma.teamSettings.upsert({
      where: { id: 'default' },
      update: {
        teamName: teamName || undefined,
        captainName: captainName !== undefined ? captainName : undefined,
        homeGround: homeGround !== undefined ? homeGround : undefined,
        matchReminders: matchReminders !== undefined ? matchReminders : undefined,
        availabilityRequests: availabilityRequests !== undefined ? availabilityRequests : undefined,
        squadAnnouncements: squadAnnouncements !== undefined ? squadAnnouncements : undefined,
        performanceUpdates: performanceUpdates !== undefined ? performanceUpdates : undefined,
      },
      create: {
        id: 'default',
        teamName: teamName || 'My Cricket Team',
        captainName,
        homeGround,
        matchReminders: matchReminders ?? true,
        availabilityRequests: availabilityRequests ?? true,
        squadAnnouncements: squadAnnouncements ?? true,
        performanceUpdates: performanceUpdates ?? false,
      }
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Update team settings error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
