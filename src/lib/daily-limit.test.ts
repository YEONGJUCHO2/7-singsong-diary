import { describe, it, expect } from 'vitest'
import { canGenerate, getRemainingCount } from './daily-limit'

describe('daily-limit', () => {
  it('allows generation when count is below limit', () => {
    expect(canGenerate(0)).toBe(true)
    expect(canGenerate(1)).toBe(true)
    expect(canGenerate(2)).toBe(true)
  })

  it('blocks generation when count reaches limit', () => {
    expect(canGenerate(3)).toBe(false)
    expect(canGenerate(5)).toBe(false)
  })

  it('returns remaining count', () => {
    expect(getRemainingCount(0)).toBe(3)
    expect(getRemainingCount(2)).toBe(1)
    expect(getRemainingCount(3)).toBe(0)
    expect(getRemainingCount(5)).toBe(0)
  })
})
