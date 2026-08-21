import { describe, expect, it } from 'vitest'
import { createRng, floatBetween, intBetween, pick, roundTo } from '@/affordai/data/seed'

describe('createRng', () => {
  it('returns values in [0, 1)', () => {
    const rng = createRng(1)
    for (let i = 0; i < 500; i += 1) {
      const value = rng()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })

  it('is deterministic for a given seed', () => {
    const first = Array.from({ length: 20 }, createRng(42))
    const second = Array.from({ length: 20 }, createRng(42))
    expect(first).toEqual(second)
  })

  it('diverges for different seeds', () => {
    expect(createRng(1)()).not.toEqual(createRng(2)())
  })
})

describe('helpers', () => {
  it('intBetween stays inside the inclusive bounds', () => {
    const rng = createRng(7)
    for (let i = 0; i < 200; i += 1) {
      const value = intBetween(rng, 3, 9)
      expect(Number.isInteger(value)).toBe(true)
      expect(value).toBeGreaterThanOrEqual(3)
      expect(value).toBeLessThanOrEqual(9)
    }
  })

  it('floatBetween stays inside the bounds', () => {
    const rng = createRng(8)
    for (let i = 0; i < 200; i += 1) {
      const value = floatBetween(rng, 0.3, 0.7)
      expect(value).toBeGreaterThanOrEqual(0.3)
      expect(value).toBeLessThan(0.7)
    }
  })

  it('pick returns a member of the list', () => {
    const rng = createRng(9)
    const items = ['a', 'b', 'c'] as const
    for (let i = 0; i < 50; i += 1) {
      expect(items).toContain(pick(rng, items))
    }
  })

  it('roundTo snaps to the step', () => {
    expect(roundTo(4237, 50)).toBe(4250)
    expect(roundTo(4212, 50)).toBe(4200)
    expect(roundTo(0.8431, 0.001)).toBeCloseTo(0.843, 5)
  })
})
