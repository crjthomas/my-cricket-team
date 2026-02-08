import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Lazy initialization using getter to avoid issues during Vercel build
function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })
  }
  return globalForPrisma.prisma
}

// Export a proxy that lazily initializes Prisma
export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    const client = getPrismaClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (client as any)[prop]
  }
})

export default prisma

