import { ApolloServer } from '@apollo/server'
import { startServerAndCreateNextHandler } from '@as-integrations/next'
import { typeDefs } from '@/lib/graphql/schema'
import { resolvers } from '@/lib/graphql/resolvers'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { NextRequest } from 'next/server'

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
})

const server = new ApolloServer({
  schema,
  introspection: true,
})

const handler = startServerAndCreateNextHandler<NextRequest>(server, {
  context: async (req) => ({ req }),
})

export async function GET(request: NextRequest) {
  return handler(request)
}

export async function POST(request: NextRequest) {
  return handler(request)
}

