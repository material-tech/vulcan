import type { GBMParams, JumpParams, PriceBoundaries, SeededRandom, TickData } from './types'

export class Mulberry32 implements SeededRandom {
  private state: number

  constructor(seed: number) {
    this.state = seed >>> 0
  }

  next(): number {
    let z = (this.state += 0x6D2B79F5)
    z = Math.imul(z ^ (z >>> 15), z | 1)
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61)
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296
  }

  nextNormal(): number {
    const u1 = this.next()
    const u2 = this.next()
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  }
}

export interface GBMEngineOptions {
  gbm: GBMParams
  jump?: JumpParams
  boundaries: PriceBoundaries
  rng: SeededRandom
}

export function createGBMEngine(options: GBMEngineOptions) {
  const { gbm, jump, boundaries, rng } = options
  const dt = gbm.dt ?? 1 / (252 * 24 * 60)
  const drift = gbm.mu - 0.5 * gbm.sigma * gbm.sigma

  let currentPrice = gbm.initialPrice

  function applyBoundaries(price: number): number {
    return Math.max(boundaries.minPrice, Math.min(boundaries.maxPrice, price))
  }

  function nextPrice(): number {
    const z = rng.nextNormal()
    let price = currentPrice * Math.exp(drift * dt + gbm.sigma * Math.sqrt(dt) * z)

    if (jump) {
      const jumpProb = jump.jumpIntensity * dt
      if (rng.next() < jumpProb) {
        const jumpZ = rng.nextNormal()
        const jumpSize = Math.exp(jump.jumpMean + jump.jumpVol * jumpZ)
        price *= jumpSize
      }
    }

    price = applyBoundaries(price)
    currentPrice = price
    return price
  }

  return {
    nextPrice,
    getCurrentPrice: () => currentPrice,
    reset: (price?: number) => {
      currentPrice = price ?? gbm.initialPrice
    },
  }
}

export function generateTicks(
  options: GBMEngineOptions,
  count: number,
  timestamps: number[],
  baseVolume: number,
  volumeVolatility: number,
): TickData[] {
  const engine = createGBMEngine(options)
  const ticks: TickData[] = []

  for (let i = 0; i < count; i++) {
    const price = engine.nextPrice()
    const volNoise = 1 + (options.rng.nextNormal() * 0.3)
    const volume = Math.max(1, baseVolume * volNoise * (1 + Math.random() * volumeVolatility))

    ticks.push({
      price,
      volume: Math.round(volume),
      timestamp: timestamps[i]!,
    })
  }

  return ticks
}
