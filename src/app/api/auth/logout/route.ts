import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, logoutUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value

    if (token) {
      const payload = verifyToken(token)
      if (payload) {
        await logoutUser(payload.sessionId)
      }
    }

    const response = NextResponse.json({ success: true })
    response.cookies.delete('auth-token')

    return response
  } catch (error) {
    console.error('Logout error:', error)
    const response = NextResponse.json({ success: true })
    response.cookies.delete('auth-token')
    return response
  }
}
