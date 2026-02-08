import { PrismaClient } from '@prisma/client'

// Check if we're in build mode (no DATABASE_URL or VERCEL_ENV=development during build)
const isBuildTime = !process.env.DATABASE_URL || process.env.NEXT_PHASE === 'phase-production-build'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Create a mock client for build time
const mockPrismaClient = new Proxy({} as PrismaClient, {
  get() {
    return () => Promise.resolve(null)
  }
})

function getPrismaClient(): PrismaClient {
  // During build, return mock to avoid connection errors
  if (isBuildTime) {
    return mockPrismaClient
  }
  
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })
  }
  return globalForPrisma.prisma
}

export const prisma = getPrismaClient()

export default prisma

