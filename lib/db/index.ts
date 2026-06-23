import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set')
}

// Singleton client (prevents too many connections in Next.js dev hot-reload)
const globalForDb = globalThis as unknown as { _pgClient?: ReturnType<typeof postgres> }

const queryClient =
  globalForDb._pgClient ??
  postgres(connectionString, {
    ssl: 'require',       // AWS RDS requires SSL
    max: 10,              // Max connection pool size
    idle_timeout: 30,     // Close idle connections after 30s
    connect_timeout: 10,  // Fail fast if RDS is unreachable
  })

if (process.env.NODE_ENV !== 'production') {
  globalForDb._pgClient = queryClient
}

export const db = drizzle(queryClient, { schema })
export type DB = typeof db
