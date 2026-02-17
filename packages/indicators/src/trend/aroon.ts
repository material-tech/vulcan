import type { KlineData, RequiredProperties } from '@material-tech/alloy-core'
import type { Dnum } from 'dnum'
import { createSignal } from '@material-tech/alloy-core'
import { divide, from, gt, lt, multiply, subtract } from 'dnum'

export interface AroonOptions {
  period: number
}

export const defaultAroonOptions: AroonOptions = {
  period: 25,
}

export interface AroonPoint {
  up: Dnum
  down: Dnum
  oscillator: Dnum
}

/**
 * Aroon Indicator
 *
 * Aroon Up = ((period - days since highest high) / period) * 100
 * Aroon Down = ((period - days since lowest low) / period) * 100
 * Oscillator = Aroon Up - Aroon Down
 */
export const aroon = createSignal(
  ({ period }) => {
    const highBuffer: Dnum[] = []
    const lowBuffer: Dnum[] = []

    return (bar: RequiredProperties<KlineData, 'h' | 'l'>) => {
      const h = from(bar.h, 18)
      const l = from(bar.l, 18)

      highBuffer.push(h)
      lowBuffer.push(l)
      if (highBuffer.length > period + 1)
        highBuffer.shift()
      if (lowBuffer.length > period + 1)
        lowBuffer.shift()

      let highestIdx = 0
      let lowestIdx = 0
      for (let j = 1; j < highBuffer.length; j++) {
        if (!gt(highBuffer[highestIdx], highBuffer[j]))
          highestIdx = j
        if (!lt(lowBuffer[lowestIdx], lowBuffer[j]))
          lowestIdx = j
      }

      const daysSinceHigh = highBuffer.length - 1 - highestIdx
      const daysSinceLow = lowBuffer.length - 1 - lowestIdx

      const periodDnum = from(period, 18)
      const up = divide(multiply(from(period - daysSinceHigh, 18), 100, 18), periodDnum, 18)
      const down = divide(multiply(from(period - daysSinceLow, 18), 100, 18), periodDnum, 18)

      return {
        up,
        down,
        oscillator: subtract(up, down),
      }
    }
  },
  defaultAroonOptions,
)
