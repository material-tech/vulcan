import { rsi } from '@vulcan-js/indicators'
import { bench, describe } from 'vitest'

const data = Array.from({ length: 1000 }, () => Math.random() * 1000)
const period = 14

function nativeRMA(period: number) {
  let count = 0
  let sum = 0
  let prev = 0

  return (value: number): number => {
    if (count < period) {
      sum += value
      count++
      prev = sum / count
      return prev
    }
    prev = (prev * (period - 1) + value) / period
    return prev
  }
}

function nativeRSI(values: number[], period: number): number[] {
  const results: number[] = []
  const gainProc = nativeRMA(period)
  const lossProc = nativeRMA(period)
  let prev: number | undefined

  for (const v of values) {
    if (prev === undefined) {
      prev = v
      gainProc(0)
      lossProc(0)
      results.push(0)
      continue
    }

    const change = v - prev
    prev = v

    const gain = change > 0 ? change : 0
    const loss = change > 0 ? 0 : -change

    const avgGain = gainProc(gain)
    const avgLoss = lossProc(loss)

    if (avgLoss === 0) {
      results.push(100)
      continue
    }

    const rs = avgGain / avgLoss
    results.push(100 - 100 / (1 + rs))
  }
  return results
}

describe('rsi (period=14, 1000 data points)', () => {
  bench('native number', () => {
    nativeRSI(data, period)
  })

  bench('dnum', () => {
    const process = rsi.create({ period })
    for (const v of data) {
      process(v)
    }
  })
})
