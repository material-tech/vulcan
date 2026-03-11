import type { CandleData } from '@vulcan-js/core'
import process from 'node:process'

/**
 * Environment variable helpers
 */
export function getEnv(key: string): string | undefined {
  return process.env[key]
}

export function hasEnv(key: string): boolean {
  return !!process.env[key]
}

/**
 * Skip tests if API key is not available
 */
export function requireApiKey(key: string): void {
  if (!hasEnv(key)) {
    throw new Error(`Skipping test: ${key} not set`)
  }
}

/**
 * Validate candle data structure
 */
export function validateCandle(candle: CandleData): void {
  if (!candle) {
    throw new Error('Candle is null or undefined')
  }

  // Check required fields exist
  if (candle.o === undefined || candle.o === null) {
    throw new Error('Candle missing open price (o)')
  }
  if (candle.h === undefined || candle.h === null) {
    throw new Error('Candle missing high price (h)')
  }
  if (candle.l === undefined || candle.l === null) {
    throw new Error('Candle missing low price (l)')
  }
  if (candle.c === undefined || candle.c === null) {
    throw new Error('Candle missing close price (c)')
  }
  if (candle.v === undefined || candle.v === null) {
    throw new Error('Candle missing volume (v)')
  }

  // Check timestamp exists
  if (!candle.timestamp) {
    throw new Error('Candle missing timestamp')
  }

  // Validate OHLC logic (High >= Open, Close, Low)
  const high = Number((candle.h as [bigint, number])[0]) / 10 ** (candle.h as [bigint, number])[1]
  const low = Number((candle.l as [bigint, number])[0]) / 10 ** (candle.l as [bigint, number])[1]

  if (high < low) {
    throw new Error(`Invalid candle: high (${high}) < low (${low})`)
  }
}

/**
 * Wait for a specified duration
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Wait for a condition with timeout
 */
export async function waitFor<T>(
  predicate: () => T | Promise<T>,
  timeoutMs: number = 5000,
  pollIntervalMs: number = 100,
): Promise<T> {
  const startTime = Date.now()

  while (Date.now() - startTime < timeoutMs) {
    const result = await predicate()
    if (result) {
      return result
    }
    await wait(pollIntervalMs)
  }

  throw new Error(`Timeout waiting for condition after ${timeoutMs}ms`)
}

/**
 * Collect WebSocket messages for a duration
 */
export async function collectWsMessages<T>(
  subscribeFn: (callback: (data: T) => void) => Promise<() => void>,
  durationMs: number,
  minMessages: number = 1,
): Promise<T[]> {
  const messages: T[] = []

  const unsubscribe = await subscribeFn((data) => {
    messages.push(data)
  })

  try {
    // Wait for minimum duration
    await wait(durationMs)

    // If we need minimum messages, wait a bit longer
    if (minMessages > 1) {
      const startTime = Date.now()
      while (messages.length < minMessages && Date.now() - startTime < 10000) {
        await wait(100)
      }
    }

    return messages
  }
  finally {
    await unsubscribe()
  }
}

/**
 * Common test symbols for different exchanges
 */
export const TEST_SYMBOLS = {
  binance: 'BTCUSDT',
  okx: 'BTC-USDT',
  hyperliquid: 'BTC',
  alpaca: 'BTC/USD',
} as const

/**
 * Common test config
 */
export const TEST_CONFIG = {
  // Short timeout for faster tests
  timeout: 30000,
  // WebSocket test duration
  wsDuration: 5000,
  // Candle fetch limit
  candleLimit: 10,
  // Retry attempts for flaky operations
  retries: 2,
}
