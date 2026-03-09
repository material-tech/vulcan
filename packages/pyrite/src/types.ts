import type { CandleData } from '@vulcan-js/core'

export type MarketSector = 'crypto' | 'forex' | 'equity' | 'commodity' | 'custom'
export type MarketSentiment = 'bullish' | 'bearish' | 'neutral' | 'volatile'
export type TimeFrame = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w'

export const TIMEFRAME_MS: Record<TimeFrame, number> = {
  '1m': 60 * 1000,
  '5m': 5 * 60 * 1000,
  '15m': 15 * 60 * 1000,
  '30m': 30 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
  '1d': 24 * 60 * 60 * 1000,
  '1w': 7 * 24 * 60 * 60 * 1000,
}

export interface GBMParams {
  mu: number
  sigma: number
  initialPrice: number
  dt?: number
}

export interface JumpParams {
  jumpIntensity: number
  jumpMean: number
  jumpVol: number
}

export interface PriceBoundaries {
  minPrice: number
  maxPrice: number
}

export interface SectorConfig {
  baseVolatility: number
  baseDrift: number
  jumpParams?: JumpParams
  boundaries: PriceBoundaries
}

export interface PyriteConfig {
  sector?: MarketSector
  sentiment?: MarketSentiment
  gbm?: Partial<GBMParams>
  jump?: Partial<JumpParams>
  boundaries?: Partial<PriceBoundaries>
  seed?: number
  useLLM?: boolean
  llmConfig?: LLMConfig
}

export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'custom'
  apiKey?: string
  model?: string
  baseURL?: string
  timeout?: number
}

export interface GenerateOptions {
  count: number
  timeFrame?: TimeFrame
  startTime?: number | Date
  initialPrice?: number
  baseVolume?: number
  volumeVolatility?: number
}

export interface TickData {
  price: number
  volume: number
  timestamp: number
}

export interface GenerationResult {
  candles: CandleData[]
  meta: {
    params: GBMParams & Partial<JumpParams>
    startTime: number
    endTime: number
    tickCount: number
    seed: number
  }
}

export interface SeededRandom {
  next: () => number
  nextNormal: () => number
}

export const SECTOR_CONFIGS: Record<MarketSector, SectorConfig> = {
  crypto: {
    baseVolatility: 0.8,
    baseDrift: 0.05,
    jumpParams: { jumpIntensity: 12, jumpMean: 0, jumpVol: 0.1 },
    boundaries: { minPrice: 0.000001, maxPrice: 1000000 },
  },
  forex: {
    baseVolatility: 0.1,
    baseDrift: 0.02,
    boundaries: { minPrice: 0.1, maxPrice: 1000 },
  },
  equity: {
    baseVolatility: 0.25,
    baseDrift: 0.08,
    jumpParams: { jumpIntensity: 4, jumpMean: -0.02, jumpVol: 0.05 },
    boundaries: { minPrice: 0.01, maxPrice: 100000 },
  },
  commodity: {
    baseVolatility: 0.3,
    baseDrift: 0.04,
    boundaries: { minPrice: 1, maxPrice: 10000 },
  },
  custom: {
    baseVolatility: 0.5,
    baseDrift: 0,
    boundaries: { minPrice: 0.000001, maxPrice: 10000000 },
  },
}

export const SENTIMENT_MULTIPLIERS: Record<MarketSentiment, { drift: number, vol: number }> = {
  bullish: { drift: 1.5, vol: 0.9 },
  bearish: { drift: -0.5, vol: 1.2 },
  neutral: { drift: 1, vol: 1 },
  volatile: { drift: 0.5, vol: 1.8 },
}
