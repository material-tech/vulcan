import { macd } from '@vulcan-js/indicators'
import { bench, describe } from 'vitest'

const data = Array.from({ length: 1000 }, () => Math.random() * 1000)

function nativeEMA(period: number) {
  const k = 2 / (period + 1)
  const m = 1 - k
  let prev: number | undefined

  return (value: number): number => {
    if (prev === undefined) {
      prev = value
      return prev
    }
    prev = value * k + prev * m
    return prev
  }
}

function nativeMACD(values: number[], fastPeriod: number, slowPeriod: number, signalPeriod: number) {
  const results: { macd: number, signal: number, histogram: number }[] = []
  const fastProc = nativeEMA(fastPeriod)
  const slowProc = nativeEMA(slowPeriod)
  const signalProc = nativeEMA(signalPeriod)

  for (const v of values) {
    const fast = fastProc(v)
    const slow = slowProc(v)
    const m = fast - slow
    const sig = signalProc(m)
    results.push({ macd: m, signal: sig, histogram: m - sig })
  }
  return results
}

describe('macd (12/26/9, 1000 data points)', () => {
  bench('native number', () => {
    nativeMACD(data, 12, 26, 9)
  })

  bench('dnum', () => {
    const process = macd.create({ fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 })
    for (const v of data) {
      process(v)
    }
  })
})
