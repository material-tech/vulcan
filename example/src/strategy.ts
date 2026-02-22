/**
 * Strategy example — demonstrates Golden Cross and RSI Oversold/Overbought.
 *
 * Run:  pnpm --filter @vulcan-js/example run strategy
 */

import { collect, goldenCross, rsiOversoldOverbought } from '@vulcan-js/forge'
import { generateCandles, sampleCandles } from './data'

// ---------------------------------------------------------------------------
// 1. Golden Cross strategy — uses fast & slow SMA crossover
// ---------------------------------------------------------------------------

console.log('=== Golden Cross Strategy ===')

// Use shorter periods so we can see signals in a small data set
const gcSignals = collect(goldenCross(sampleCandles, {
  fastPeriod: 5,
  slowPeriod: 15,
  stopLossPercent: 0.03,
}))

for (const [i, signal] of gcSignals.entries()) {
  if (signal.action !== 'hold') {
    console.log(`Bar ${i}: ${signal.action.toUpperCase()} — ${signal.reason}`)
    if (signal.stopLoss != null) {
      console.log(`  Stop-loss: ${signal.stopLoss.toFixed(2)}`)
    }
  }
}

console.log()

// ---------------------------------------------------------------------------
// 2. RSI Oversold/Overbought strategy
// ---------------------------------------------------------------------------

console.log('=== RSI Oversold/Overbought Strategy ===')

// Generate more candles with wider swings to trigger RSI signals
const volatileCandles = generateCandles(200, 100)

const rsiSignals = collect(rsiOversoldOverbought(volatileCandles, {
  period: 14,
  overboughtLevel: 70,
  oversoldLevel: 30,
}))

let signalCount = 0
for (const [i, signal] of rsiSignals.entries()) {
  if (signal.action !== 'hold') {
    signalCount++
    console.log(`Bar ${i}: ${signal.action.toUpperCase()} — ${signal.reason}`)
  }
}
console.log(`Total signals: ${signalCount}`)

console.log()

// ---------------------------------------------------------------------------
// 3. Processor mode — real-time signal generation
// ---------------------------------------------------------------------------

console.log('=== Processor Mode (streaming) ===')

const gcProc = goldenCross.create({ fastPeriod: 5, slowPeriod: 15 })

for (const [i, bar] of sampleCandles.entries()) {
  const signal = gcProc(bar)
  if (signal.action !== 'hold') {
    console.log(`Bar ${i}: ${signal.action.toUpperCase()} — ${signal.reason}`)
  }
}
