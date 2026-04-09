import { DAILY_GENERATION_LIMIT } from './constants'

export function canGenerate(todayCount: number): boolean {
  return todayCount < DAILY_GENERATION_LIMIT
}

export function getRemainingCount(todayCount: number): number {
  return Math.max(0, DAILY_GENERATION_LIMIT - todayCount)
}
