import type { GBMParams, MarketSector, MarketSentiment } from './types'
import { SECTOR_CONFIGS, SENTIMENT_MULTIPLIERS } from './types'

export interface PromptContext {
  sector: MarketSector
  sentiment: MarketSentiment
  initialPrice?: number
}

export function buildMacroPrompt(context: PromptContext): string {
  const { sector, sentiment, initialPrice } = context
  const sectorConfig = SECTOR_CONFIGS[sector]
  const sentimentMult = SENTIMENT_MULTIPLIERS[sentiment]

  return `Generate realistic market parameters for ${sector} with ${sentiment} sentiment.

Context:
- Sector base volatility: ${(sectorConfig.baseVolatility * 100).toFixed(1)}%
- Sector base drift: ${(sectorConfig.baseDrift * 100).toFixed(1)}%
- Sentiment drift multiplier: ${sentimentMult.drift}x
- Sentiment vol multiplier: ${sentimentMult.vol}x
${initialPrice ? `- Initial price: ${initialPrice}` : ''}

Generate GBM parameters (mu, sigma) suitable for this market condition.
Return ONLY a JSON object: {"mu": number, "sigma": number}`
}

export interface MockLLMResponse {
  mu: number
  sigma: number
}

export async function mockLLMGenerate(context: PromptContext): Promise<MockLLMResponse> {
  const sectorConfig = SECTOR_CONFIGS[context.sector]
  const sentimentMult = SENTIMENT_MULTIPLIERS[context.sentiment]

  await new Promise(resolve => setTimeout(resolve, 10))

  return {
    mu: sectorConfig.baseDrift * sentimentMult.drift * (0.9 + Math.random() * 0.2),
    sigma: sectorConfig.baseVolatility * sentimentMult.vol * (0.9 + Math.random() * 0.2),
  }
}

export function resolveParams(
  context: PromptContext,
  llmResponse: MockLLMResponse,
  overrides?: Partial<GBMParams>,
): GBMParams {
  return {
    mu: overrides?.mu ?? llmResponse.mu,
    sigma: overrides?.sigma ?? llmResponse.sigma,
    initialPrice: overrides?.initialPrice ?? context.initialPrice ?? 100,
    dt: overrides?.dt,
  }
}
