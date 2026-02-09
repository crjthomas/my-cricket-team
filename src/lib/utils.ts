import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatShortDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function getRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatShortDate(d)
}

export function calculateBattingAverage(runs: number, innings: number, notOuts: number): string {
  const dismissals = innings - notOuts
  if (dismissals === 0) return runs > 0 ? '∞' : '-'
  return (runs / dismissals).toFixed(2)
}

export function calculateStrikeRate(runs: number, balls: number): string {
  if (balls === 0) return '-'
  return ((runs / balls) * 100).toFixed(2)
}

export function calculateBowlingAverage(runs: number, wickets: number): string {
  if (wickets === 0) return '-'
  return (runs / wickets).toFixed(2)
}

export function calculateEconomyRate(runs: number, overs: number): string {
  if (overs === 0) return '-'
  return (runs / overs).toFixed(2)
}

export function getRoleColor(role: string): string {
  switch (role) {
    case 'BATSMAN':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case 'BOWLER':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    case 'ALL_ROUNDER':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    case 'BATTING_ALL_ROUNDER':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
    case 'BOWLING_ALL_ROUNDER':
      return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
    case 'WICKETKEEPER':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }
}

export function formatRoleName(role: string): string {
  return role.replace(/_/g, ' ')
}

export function getFormColor(form: string): string {
  switch (form) {
    case 'EXCELLENT':
      return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300'
    case 'GOOD':
      return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300'
    case 'AVERAGE':
      return 'text-amber-600 bg-amber-100 dark:bg-amber-900 dark:text-amber-300'
    case 'POOR':
      return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300'
    case 'UNKNOWN':
      return '' // Return empty to hide badge
    default:
      return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-300'
  }
}

export function shouldShowFormBadge(form: string): boolean {
  return form !== 'UNKNOWN' && form !== ''
}

export function getAvailabilityColor(status: string): string {
  switch (status) {
    case 'AVAILABLE':
      return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300'
    case 'UNAVAILABLE':
      return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300'
    case 'MAYBE':
      return 'text-amber-600 bg-amber-100 dark:bg-amber-900 dark:text-amber-300'
    case 'PENDING':
      return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-300'
    default:
      return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-300'
  }
}

export function getMatchResultColor(result: string): string {
  switch (result) {
    case 'WON':
      return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300'
    case 'LOST':
      return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300'
    case 'DRAW':
    case 'NO_RESULT':
      return 'text-amber-600 bg-amber-100 dark:bg-amber-900 dark:text-amber-300'
    default:
      return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-300'
  }
}

export function getImportanceColor(importance: string): string {
  switch (importance) {
    case 'MUST_WIN':
      return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300'
    case 'IMPORTANT':
      return 'text-amber-600 bg-amber-100 dark:bg-amber-900 dark:text-amber-300'
    case 'REGULAR':
      return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300'
    case 'LOW_STAKES':
      return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-300'
    default:
      return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-300'
  }
}

