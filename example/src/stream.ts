/**
 * Stream API example — demonstrates using indicators and strategies with
 * Web Streams API (ReadableStream / TransformStream).
 *
 * The `.create()` processor mode returns a stateful function that processes
 * values one at a time, making it a natural fit for TransformStream.
 *
 * Run:  pnpm --filter @vulcan-js/example run stream
 */

import type { Processor } from '@vulcan-js/forge'
import process from 'node:process'
import { ema, goldenCross, rsi, sma } from '@vulcan-js/forge'
import { toNumber } from 'dnum'
import { sampleCandles } from './data'

// ---------------------------------------------------------------------------
// Helper: create a ReadableStream from an iterable
// ---------------------------------------------------------------------------

function toReadableStream<T>(items: Iterable<T>): ReadableStream<T> {
  return new ReadableStream({
    start(controller) {
      for (const item of items) {
        controller.enqueue(item)
      }
      controller.close()
    },
  })
}

// ---------------------------------------------------------------------------
// Helper: wrap a Processor into a TransformStream
// ---------------------------------------------------------------------------

function toTransformStream<I, O>(processor: Processor<I, O>): TransformStream<I, O> {
  return new TransformStream({
    transform(chunk, controller) {
      controller.enqueue(processor(chunk))
    },
  })
}

// ---------------------------------------------------------------------------
// 1. Single indicator — pipe close prices through SMA TransformStream
// ---------------------------------------------------------------------------

console.log('=== SMA (period=5) — TransformStream ===')

const closePrices = sampleCandles.map(c => c.c as number)

const smaStream = toReadableStream(closePrices)
  .pipeThrough(toTransformStream(sma.create({ period: 5 })))

const smaResults: number[] = []
for await (const value of smaStream) {
  smaResults.push(toNumber(value, 2))
}
console.log('Last 10 values:', smaResults.slice(-10))

console.log()

// ---------------------------------------------------------------------------
// 2. Chained indicators — pipe through EMA then RSI
// ---------------------------------------------------------------------------

console.log('=== Chained: EMA(10) → RSI(14) — TransformStream pipeline ===')

const chainedStream = toReadableStream(closePrices)
  .pipeThrough(toTransformStream(ema.create({ period: 10 })))
  .pipeThrough(toTransformStream(rsi.create({ period: 14 })))

const chainedResults: number[] = []
for await (const value of chainedStream) {
  chainedResults.push(toNumber(value, 2))
}
console.log('Last 10 values:', chainedResults.slice(-10))

console.log()

// ---------------------------------------------------------------------------
// 3. Strategy — pipe candles through Golden Cross as a TransformStream
// ---------------------------------------------------------------------------

console.log('=== Golden Cross Strategy — TransformStream ===')

const strategyStream = toReadableStream(sampleCandles)
  .pipeThrough(toTransformStream(goldenCross.create({ fastPeriod: 5, slowPeriod: 15 })))

let barIndex = 0
for await (const signal of strategyStream) {
  if (signal.action !== 'hold') {
    console.log(`Bar ${barIndex}: ${signal.action.toUpperCase()} — ${signal.reason}`)
  }
  barIndex++
}

console.log()

// ---------------------------------------------------------------------------
// 4. Simulated real-time stream — using a delayed ReadableStream
// ---------------------------------------------------------------------------

console.log('=== Simulated Real-time Stream (50ms interval) ===')

function toDelayedStream<T>(items: Iterable<T>, delayMs: number): ReadableStream<T> {
  const iterator = items[Symbol.iterator]()
  return new ReadableStream({
    async pull(controller) {
      const { value, done } = iterator.next()
      if (done) {
        controller.close()
        return
      }
      await new Promise(resolve => setTimeout(resolve, delayMs))
      controller.enqueue(value)
    },
  })
}

// Stream the last 10 candles with a short delay to simulate real-time data
const recentCandles = sampleCandles.slice(-10)
const realtimeStream = toDelayedStream(recentCandles, 50)
  .pipeThrough(toTransformStream(goldenCross.create({ fastPeriod: 5, slowPeriod: 15 })))

let realtimeIndex = 0
for await (const signal of realtimeStream) {
  const action = signal.action === 'hold' ? '—' : signal.action.toUpperCase()
  process.stdout.write(`[tick ${realtimeIndex}] ${action}  `)
  realtimeIndex++
}
console.log('\nDone.')
