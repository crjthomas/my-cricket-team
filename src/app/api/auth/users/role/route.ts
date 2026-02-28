import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, isAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

export const dynamic = 'force-dynamic'

// Update user role (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const currentUser = await getCurrentUser(token)
    if (!currentUser || !isAdmin(currentUser)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { userId, role } = await request.json()

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'User ID and role are required' },
        { status: 400 }
      )
    }

    // Prevent self-demotion
    if (userId === currentUser.id) {
      return NextResponse.json(
        { error: 'Cannot change your own role' },
        { status: 400 }
      )
    }

    let newRole: UserRole
    if (role === 'ADMIN') {
      newRole = UserRole.ADMIN
    } else if (role === 'MEDIA_MANAGER') {
      newRole = UserRole.MEDIA_MANAGER
    } else {
      newRole = UserRole.USER
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    })

    const roleDisplayName = newRole === UserRole.ADMIN ? 'Admin' : newRole === UserRole.MEDIA_MANAGER ? 'Media Manager' : 'Viewer'

    // Log role change activity
    await prisma.activity.create({
      data: {
        type: 'USER_ROLE_CHANGED',
        title: `${updatedUser.username}'s role changed to ${roleDisplayName}`,
        actorName: currentUser.username,
        entityType: 'user',
        entityId: userId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Update role error:', error)
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 })
  }
}
