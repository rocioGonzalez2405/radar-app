/**
 * Deterministic randomness for the AffordAI synthetic dataset.
 *
 * The console must render identical numbers on every reload — a reviewer who
 * refreshes mid-demo should see no drift — so `Math.random` is never used
 * anywhere under `src/affordai/`.
 */

/** mulberry32. Small, fast, and stable across engines. */
export const createRng = (seed: number) => {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const floatBetween = (rng: () => number, min: number, max: number) =>
  min + rng() * (max - min)

export const intBetween = (rng: () => number, min: number, max: number) =>
  Math.floor(min + rng() * (max - min + 1))

export const pick = <T,>(rng: () => number, items: readonly T[]): T =>
  items[Math.floor(rng() * items.length)]

export const roundTo = (value: number, step: number) =>
  Math.round(value / step) * step
