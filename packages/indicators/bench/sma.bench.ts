import { sma } from '@vulcan-js/indicators'
import { bench, describe } from 'vitest'

const data = Array.from({ length: 1000 }, () => Math.random() * 1000)
const period = 20

function nativeSMA(values: number[], period: number): number[] {
  const results: number[] = []
  const buffer = Array.from({ length: period }, () => 0)
  let head = 0
  let count = 0
  let sum = 0

  for (const v of values) {
    if (count < period) {
      buffer[count] = v
      sum += v
      count++
    }
    else {
      sum -= buffer[head]
      sum += v
      buffer[head] = v
      head = (head + 1) % period
    }
    results.push(sum / count)
  }
  return results
}

describe('sma (period=20, 1000 data points)', () => {
  bench('native number', () => {
    nativeSMA(data, period)
  })

  bench('dnum', () => {
    const process = sma.create({ period })
    for (const v of data) {
      process(v)
    }
  })
})
