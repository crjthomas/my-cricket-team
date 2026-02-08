import { prisma } from './prisma'
import * as bcrypt from 'bcryptjs'
import * as jwt from 'jsonwebtoken'
import { UserRole } from '@prisma/client'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET || 'phoenix-cricket-secret-key-change-in-production'
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days

export interface AuthUser {
  id: string
  username: string
  role: UserRole
}

export interface SessionPayload {
  userId: string
  sessionId: string
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Create session token
export function createToken(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

// Verify token
export function verifyToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload
  } catch {
    return null
  }
}

// Login user
export async function loginUser(username: string, password: string): Promise<{ user: AuthUser; token: string } | null> {
  const user = await prisma.user.findUnique({
    where: { username },
  })

  if (!user || !user.isActive) {
    return null
  }

  const isValid = await verifyPassword(password, user.passwordHash)
  if (!isValid) {
    return null
  }

  // Create session
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      token: crypto.randomUUID(),
      expiresAt: new Date(Date.now() + SESSION_DURATION),
    },
  })

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  })

  const token = createToken({ userId: user.id, sessionId: session.id })

  return {
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
    },
    token,
  }
}

// Logout user
export async function logoutUser(sessionId: string): Promise<void> {
  await prisma.session.delete({
    where: { id: sessionId },
  }).catch(() => {})
}

// Get current user from token
export async function getCurrentUser(token: string): Promise<AuthUser | null> {
  const payload = verifyToken(token)
  if (!payload) {
    return null
  }

  const session = await prisma.session.findUnique({
    where: { id: payload.sessionId },
    include: { user: true },
  })

  if (!session || session.expiresAt < new Date() || !session.user.isActive) {
    return null
  }

  return {
    id: session.user.id,
    username: session.user.username,
    role: session.user.role,
  }
}

// Get user from cookies (for server components)
export async function getServerUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth-token')?.value
  
  if (!token) {
    return null
  }

  return getCurrentUser(token)
}

// Change password
export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!user) {
    return false
  }

  const isValid = await verifyPassword(currentPassword, user.passwordHash)
  if (!isValid) {
    return false
  }

  const newHash = await hashPassword(newPassword)
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newHash },
  })

  return true
}

// Create new user (admin only)
export async function createUser(username: string, password: string, role: UserRole = UserRole.USER): Promise<AuthUser | null> {
  const existing = await prisma.user.findUnique({
    where: { username },
  })

  if (existing) {
    return null
  }

  const passwordHash = await hashPassword(password)
  const user = await prisma.user.create({
    data: {
      username,
      passwordHash,
      role,
      isActive: true,
    },
  })

  return {
    id: user.id,
    username: user.username,
    role: user.role,
  }
}

// Check if user has admin role
export function isAdmin(user: AuthUser | null): boolean {
  return user?.role === UserRole.ADMIN
}

// Permission helpers
export const permissions = {
  // Admin-only features
  canManagePlayers: (user: AuthUser | null) => isAdmin(user),
  canManageMatches: (user: AuthUser | null) => isAdmin(user),
  canUseAISelector: (user: AuthUser | null) => isAdmin(user),
  canManageSettings: (user: AuthUser | null) => isAdmin(user),
  canManageUsers: (user: AuthUser | null) => isAdmin(user),
  canEditSquad: (user: AuthUser | null) => isAdmin(user),
  
  // User features (view-only)
  canViewPlayers: (user: AuthUser | null) => user !== null,
  canViewMatches: (user: AuthUser | null) => user !== null,
  canViewStats: (user: AuthUser | null) => user !== null,
  canViewGallery: (user: AuthUser | null) => user !== null,
  canViewTeamUpdates: (user: AuthUser | null) => user !== null,
}
