import { ApolloServer } from '@apollo/server'
import { startServerAndCreateNextHandler } from '@as-integrations/next'
import { typeDefs } from '@/lib/graphql/schema'
import { resolvers } from '@/lib/graphql/resolvers'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { NextRequest } from 'next/server'
import { getCurrentUser, AuthUser } from '@/lib/auth'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

// Context type for resolvers
export interface GraphQLContext {
  req: NextRequest
  user: AuthUser | null
  isAuthenticated: boolean
  isAdmin: boolean
}

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
})

const server = new ApolloServer({
  schema,
  introspection: process.env.NODE_ENV !== 'production', // Disable introspection in production
})

const handler = startServerAndCreateNextHandler<NextRequest>(server, {
  context: async (req): Promise<GraphQLContext> => {
    // Get auth token from cookies
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    
    let user: AuthUser | null = null
    if (token) {
      user = await getCurrentUser(token)
    }
    
    return {
      req,
      user,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'ADMIN',
    }
  },
})

export async function GET(request: NextRequest) {
  return handler(request)
}

export async function POST(request: NextRequest) {
  return handler(request)
}
