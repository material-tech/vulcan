import type { CandleData } from '@vulcan-js/core'
import type {
  GBMParams,
  GenerateOptions,
  JumpParams,
  MarketSector,
  MarketSentiment,
  PriceBoundaries,
  PyriteConfig,
  SectorConfig,
} from './types'
import { aggregateToOHLCV, generateTimestamps } from './aggregate'
import { generateTicks, Mulberry32 } from './gbm'
import { mockLLMGenerate, resolveParams } from './prompt'
import {
  SECTOR_CONFIGS,
  SENTIMENT_MULTIPLIERS,
  TIMEFRAME_MS,
} from './types'

export * from './aggregate'
export * from './gbm'
export * from './prompt'
export * from './types'

export interface GenerateResult {
  candles: CandleData[]
  meta: {
    params: GBMParams & Partial<JumpParams>
    startTime: number
    endTime: number
    tickCount: number
    seed: number
  }
}

export async function generate(
  config: PyriteConfig,
  options: GenerateOptions,
): Promise<GenerateResult> {
  const sector: MarketSector = config.sector ?? 'custom'
  const sentiment: MarketSentiment = config.sentiment ?? 'neutral'
  const sectorConfig: SectorConfig = SECTOR_CONFIGS[sector]
  const sentimentMult = SENTIMENT_MULTIPLIERS[sentiment]

  const seed = config.seed ?? Date.now()
  const rng = new Mulberry32(seed)

  let gbmParams: GBMParams

  if (config.useLLM) {
    const promptContext = {
      sector,
      sentiment,
      initialPrice: options.initialPrice ?? config.gbm?.initialPrice,
    }
    const llmResponse = await mockLLMGenerate(promptContext)
    gbmParams = resolveParams(promptContext, llmResponse, config.gbm)
  }
  else {
    gbmParams = {
      mu: config.gbm?.mu ?? sectorConfig.baseDrift * sentimentMult.drift,
      sigma: config.gbm?.sigma ?? sectorConfig.baseVolatility * sentimentMult.vol,
      initialPrice: options.initialPrice ?? config.gbm?.initialPrice ?? 100,
      dt: config.gbm?.dt,
    }
  }

  const jumpParams: JumpParams | undefined = config.jump
    ? {
        jumpIntensity: config.jump.jumpIntensity ?? sectorConfig.jumpParams?.jumpIntensity ?? 0,
        jumpMean: config.jump.jumpMean ?? sectorConfig.jumpParams?.jumpMean ?? 0,
        jumpVol: config.jump.jumpVol ?? sectorConfig.jumpParams?.jumpVol ?? 0,
      }
    : sectorConfig.jumpParams

  const boundaries: PriceBoundaries = {
    minPrice: config.boundaries?.minPrice ?? sectorConfig.boundaries.minPrice,
    maxPrice: config.boundaries?.maxPrice ?? sectorConfig.boundaries.maxPrice,
  }

  const timeFrame = options.timeFrame ?? '1h'
  const interval = TIMEFRAME_MS[timeFrame]

  const endTime = options.startTime
    ? (typeof options.startTime === 'number' ? options.startTime : options.startTime.getTime()) + options.count * interval
    : Date.now()

  const startTime = options.startTime
    ? (typeof options.startTime === 'number' ? options.startTime : options.startTime.getTime())
    : endTime - options.count * interval

  const ticksPerCandle = 100
  const totalTicks = options.count * ticksPerCandle

  const timestamps = generateTimestamps(totalTicks, timeFrame, startTime)

  const baseVolume = options.baseVolume ?? 1000
  const volumeVolatility = options.volumeVolatility ?? 0.5

  const engineOptions = {
    gbm: gbmParams,
    jump: jumpParams,
    boundaries,
    rng,
  }

  const ticks = generateTicks(
    engineOptions,
    totalTicks,
    timestamps,
    baseVolume,
    volumeVolatility,
  )

  const candles = aggregateToOHLCV(ticks, timeFrame, startTime)

  return {
    candles,
    meta: {
      params: { ...gbmParams, ...jumpParams },
      startTime,
      endTime,
      tickCount: totalTicks,
      seed,
    },
  }
}

export function generateSync(
  config: PyriteConfig,
  options: GenerateOptions,
): GenerateResult {
  const sector: MarketSector = config.sector ?? 'custom'
  const sentiment: MarketSentiment = config.sentiment ?? 'neutral'
  const sectorConfig: SectorConfig = SECTOR_CONFIGS[sector]
  const sentimentMult = SENTIMENT_MULTIPLIERS[sentiment]

  const seed = config.seed ?? Date.now()
  const rng = new Mulberry32(seed)

  const gbmParams: GBMParams = {
    mu: config.gbm?.mu ?? sectorConfig.baseDrift * sentimentMult.drift,
    sigma: config.gbm?.sigma ?? sectorConfig.baseVolatility * sentimentMult.vol,
    initialPrice: options.initialPrice ?? config.gbm?.initialPrice ?? 100,
    dt: config.gbm?.dt,
  }

  const jumpParams: JumpParams | undefined = config.jump
    ? {
        jumpIntensity: config.jump.jumpIntensity ?? sectorConfig.jumpParams?.jumpIntensity ?? 0,
        jumpMean: config.jump.jumpMean ?? sectorConfig.jumpParams?.jumpMean ?? 0,
        jumpVol: config.jump.jumpVol ?? sectorConfig.jumpParams?.jumpVol ?? 0,
      }
    : sectorConfig.jumpParams

  const boundaries: PriceBoundaries = {
    minPrice: config.boundaries?.minPrice ?? sectorConfig.boundaries.minPrice,
    maxPrice: config.boundaries?.maxPrice ?? sectorConfig.boundaries.maxPrice,
  }

  const timeFrame = options.timeFrame ?? '1h'
  const interval = TIMEFRAME_MS[timeFrame]

  const endTime = options.startTime
    ? (typeof options.startTime === 'number' ? options.startTime : options.startTime.getTime()) + options.count * interval
    : Date.now()

  const startTime = options.startTime
    ? (typeof options.startTime === 'number' ? options.startTime : options.startTime.getTime())
    : endTime - options.count * interval

  const ticksPerCandle = 100
  const totalTicks = options.count * ticksPerCandle

  const timestamps = generateTimestamps(totalTicks, timeFrame, startTime)

  const baseVolume = options.baseVolume ?? 1000
  const volumeVolatility = options.volumeVolatility ?? 0.5

  const engineOptions = {
    gbm: gbmParams,
    jump: jumpParams,
    boundaries,
    rng,
  }

  const ticks = generateTicks(
    engineOptions,
    totalTicks,
    timestamps,
    baseVolume,
    volumeVolatility,
  )

  const candles = aggregateToOHLCV(ticks, timeFrame, startTime)

  return {
    candles,
    meta: {
      params: { ...gbmParams, ...jumpParams },
      startTime,
      endTime,
      tickCount: totalTicks,
      seed,
    },
  }
}
