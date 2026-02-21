import type { CandleData, RequiredProperties } from '@vulcan-js/core'
import type { Dnum } from 'dnum'
import { assert, constants, createSignal, toDnum } from '@vulcan-js/core'
import { divide, gt, lt, multiply, subtract } from 'dnum'

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
    assert(Number.isInteger(period) && period >= 1, new RangeError(`Expected period to be a positive integer, got ${period}`))
    const highBuffer: Dnum[] = []
    const lowBuffer: Dnum[] = []

    return (bar: RequiredProperties<CandleData, 'h' | 'l'>) => {
      const h = toDnum(bar.h)
      const l = toDnum(bar.l)

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

      const periodDnum = toDnum(period)
      const up = divide(multiply(toDnum(period - daysSinceHigh), 100, constants.DECIMALS), periodDnum, constants.DECIMALS)
      const down = divide(multiply(toDnum(period - daysSinceLow), 100, constants.DECIMALS), periodDnum, constants.DECIMALS)

      return {
        up,
        down,
        oscillator: subtract(up, down),
      }
    }
  },
  defaultAroonOptions,
)
