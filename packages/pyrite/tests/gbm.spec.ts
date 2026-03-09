import type { GBMParams, JumpParams, PriceBoundaries } from '../src/types'
import { describe, expect, it } from 'vitest'
import { createGBMEngine, generateTicks, Mulberry32 } from '../src/gbm'

describe('mulberry32', () => {
  it('should generate reproducible random numbers with same seed', () => {
    const rng1 = new Mulberry32(12345)
    const rng2 = new Mulberry32(12345)

    const values1 = Array.from({ length: 10 }, () => rng1.next())
    const values2 = Array.from({ length: 10 }, () => rng2.next())

    expect(values1).toEqual(values2)
  })

  it('should generate different sequences with different seeds', () => {
    const rng1 = new Mulberry32(12345)
    const rng2 = new Mulberry32(54321)

    const values1 = Array.from({ length: 10 }, () => rng1.next())
    const values2 = Array.from({ length: 10 }, () => rng2.next())

    expect(values1).not.toEqual(values2)
  })

  it('should generate values in [0, 1) range', () => {
    const rng = new Mulberry32(12345)

    for (let i = 0; i < 100; i++) {
      const value = rng.next()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })

  it('should generate normal distribution values', () => {
    const rng = new Mulberry32(12345)
    const values = Array.from({ length: 1000 }, () => rng.nextNormal())

    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length

    expect(mean).toBeCloseTo(0, 1)
    expect(Math.sqrt(variance)).toBeCloseTo(1, 0)
  })
})

describe('createGBMEngine', () => {
  const baseParams: GBMParams = {
    mu: 0.1,
    sigma: 0.2,
    initialPrice: 100,
  }

  const boundaries: PriceBoundaries = {
    minPrice: 1,
    maxPrice: 10000,
  }

  it('should generate prices starting near initial price', () => {
    const rng = new Mulberry32(12345)
    const engine = createGBMEngine({
      gbm: baseParams,
      boundaries,
      rng,
    })

    const prices = Array.from({ length: 10 }, () => engine.nextPrice())

    expect(prices[0]).toBeGreaterThan(50)
    expect(prices[0]).toBeLessThan(150)
  })

  it('should respect price boundaries', () => {
    const rng = new Mulberry32(12345)
    const tightBoundaries: PriceBoundaries = {
      minPrice: 90,
      maxPrice: 110,
    }

    const engine = createGBMEngine({
      gbm: baseParams,
      boundaries: tightBoundaries,
      rng,
    })

    for (let i = 0; i < 100; i++) {
      const price = engine.nextPrice()
      expect(price).toBeGreaterThanOrEqual(tightBoundaries.minPrice)
      expect(price).toBeLessThanOrEqual(tightBoundaries.maxPrice)
    }
  })

  it('should be resettable', () => {
    const rng = new Mulberry32(12345)
    const engine = createGBMEngine({
      gbm: baseParams,
      boundaries,
      rng,
    })

    const price1 = engine.nextPrice()
    engine.reset()
    const price2 = engine.nextPrice()

    expect(price1).toBe(price2)
  })

  it('should apply jumps when jump params provided', () => {
    const rng = new Mulberry32(12345)
    const jumpParams: JumpParams = {
      jumpIntensity: 1000,
      jumpMean: 0,
      jumpVol: 0.1,
    }

    const engine = createGBMEngine({
      gbm: baseParams,
      jump: jumpParams,
      boundaries,
      rng,
    })

    const prices = Array.from({ length: 100 }, () => engine.nextPrice())
    const priceChanges = prices.slice(1).map((p, i) => Math.abs(p - prices[i]!))
    const maxChange = Math.max(...priceChanges)

    expect(maxChange).toBeGreaterThan(10)
  })
})

describe('generateTicks', () => {
  const baseParams: GBMParams = {
    mu: 0.1,
    sigma: 0.2,
    initialPrice: 100,
  }

  const boundaries: PriceBoundaries = {
    minPrice: 1,
    maxPrice: 10000,
  }

  it('should generate correct number of ticks', () => {
    const rng = new Mulberry32(12345)
    const count = 50
    const timestamps = Array.from({ length: count }, (_, i) => 1000000 + i * 1000)

    const ticks = generateTicks(
      { gbm: baseParams, boundaries, rng },
      count,
      timestamps,
      1000,
      0.5,
    )

    expect(ticks.length).toBe(count)
  })

  it('should generate positive volumes', () => {
    const rng = new Mulberry32(12345)
    const count = 10
    const timestamps = Array.from({ length: count }, (_, i) => 1000000 + i * 1000)

    const ticks = generateTicks(
      { gbm: baseParams, boundaries, rng },
      count,
      timestamps,
      1000,
      0.5,
    )

    for (const tick of ticks) {
      expect(tick.volume).toBeGreaterThan(0)
    }
  })

  it('should respect provided timestamps', () => {
    const rng = new Mulberry32(12345)
    const count = 10
    const timestamps = Array.from({ length: count }, (_, i) => 1000000 + i * 1000)

    const ticks = generateTicks(
      { gbm: baseParams, boundaries, rng },
      count,
      timestamps,
      1000,
      0.5,
    )

    for (let i = 0; i < count; i++) {
      expect(ticks[i]!.timestamp).toBe(timestamps[i])
    }
  })
})
