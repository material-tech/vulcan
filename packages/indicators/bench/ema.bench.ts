import { ema } from '@vulcan-js/indicators'
import { bench, describe } from 'vitest'

const data = Array.from({ length: 1000 }, () => Math.random() * 1000)
const period = 12

function nativeEMA(values: number[], period: number): number[] {
  const results: number[] = []
  const k = 2 / (period + 1)
  const m = 1 - k
  let prev: number | undefined

  for (const v of values) {
    if (prev === undefined) {
      prev = v
    }
    else {
      prev = v * k + prev * m
    }
    results.push(prev)
  }
  return results
}

describe('ema (period=12, 1000 data points)', () => {
  bench('native number', () => {
    nativeEMA(data, period)
  })

  bench('fp18 (via dnum API)', () => {
    const process = ema.create({ period })
    for (const v of data) {
      process(v)
    }
  })
})
