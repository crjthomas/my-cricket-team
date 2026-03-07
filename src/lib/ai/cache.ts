/**
 * AI Response Cache
 * Caches AI responses to reduce API calls and costs
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

interface CacheOptions {
  ttlMinutes?: number  // Time to live in minutes
}

class AICache {
  private cache: Map<string, CacheEntry<unknown>> = new Map()
  private defaultTTL = 60 * 60 * 1000 // 1 hour in milliseconds

  private generateKey(prefix: string, params: Record<string, unknown>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key]
        return acc
      }, {} as Record<string, unknown>)
    
    return `${prefix}:${JSON.stringify(sortedParams)}`
  }

  get<T>(prefix: string, params: Record<string, unknown>): T | null {
    const key = this.generateKey(prefix, params)
    const entry = this.cache.get(key)

    if (!entry) return null

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  set<T>(
    prefix: string, 
    params: Record<string, unknown>, 
    data: T, 
    options?: CacheOptions
  ): void {
    const key = this.generateKey(prefix, params)
    const ttl = options?.ttlMinutes 
      ? options.ttlMinutes * 60 * 1000 
      : this.defaultTTL

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl
    })
  }

  invalidate(prefix: string): void {
    const keysToDelete: string[] = []
    this.cache.forEach((_, key) => {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key)
      }
    })
    keysToDelete.forEach(key => this.cache.delete(key))
  }

  clear(): void {
    this.cache.clear()
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

export const aiCache = new AICache()

export const CacheKeys = {
  SQUAD_RECOMMENDATION: 'squad',
  PLAYER_ANALYSIS: 'player_analysis',
  OPPONENT_SCOUTING: 'opponent_scout',
  MATCH_STRATEGY: 'match_strategy',
  NL_QUERY: 'nl_query'
} as const
