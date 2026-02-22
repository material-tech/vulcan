/**
 * Indicators example — demonstrates basic usage of SMA, EMA, RSI and MACD.
 *
 * Run:  pnpm --filter @vulcan-js/example run indicators
 */

import { collect, ema, macd, rsi, sma } from '@vulcan-js/forge'
import { toNumber } from 'dnum'
import { sampleCandles } from './data'

const closePrices = sampleCandles.map(c => c.c as number)

// ---------------------------------------------------------------------------
// 1. Generator mode — feed an array, collect all results at once
// ---------------------------------------------------------------------------

console.log('=== SMA (period=5) — generator mode ===')
const smaResults = collect(sma(closePrices, { period: 5 }))
console.log(
  'Last 10 values:',
  smaResults.slice(-10).map(v => toNumber(v, 2)),
)

console.log()

// ---------------------------------------------------------------------------
// 2. Lazy iteration — process values one-by-one with for-of
// ---------------------------------------------------------------------------

console.log('=== EMA (period=10) — lazy iteration ===')
const emaValues: number[] = []
for (const value of ema(closePrices, { period: 10 })) {
  emaValues.push(toNumber(value, 2))
}
console.log('Last 10 values:', emaValues.slice(-10))

console.log()

// ---------------------------------------------------------------------------
// 3. Processor mode — stateful function via .create(), ideal for streaming
// ---------------------------------------------------------------------------

console.log('=== RSI (period=14) — processor mode ===')
const rsiProc = rsi.create({ period: 14 })
const rsiValues: number[] = []
for (const price of closePrices) {
  rsiValues.push(toNumber(rsiProc(price), 2))
}
console.log('Last 10 values:', rsiValues.slice(-10))

console.log()

// ---------------------------------------------------------------------------
// 4. Multi-output indicator — MACD returns { macd, signal, histogram }
// ---------------------------------------------------------------------------

console.log('=== MACD (12/26/9) ===')
const macdResults = collect(macd(closePrices))
for (const point of macdResults.slice(-5)) {
  console.log({
    macd: toNumber(point.macd, 4),
    signal: toNumber(point.signal, 4),
    histogram: toNumber(point.histogram, 4),
  })
}
