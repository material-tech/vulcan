import type { CandleData, RequiredProperties } from '@vulcan-js/core'
import type { Dnum } from 'dnum'
import { assert, createSignal, fp18 } from '@vulcan-js/core'

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
    const highBuffer: bigint[] = []
    const lowBuffer: bigint[] = []
    const periodBig = BigInt(period)

    return (bar: RequiredProperties<CandleData, 'h' | 'l'>) => {
      const h = fp18.toFp18(bar.h)
      const l = fp18.toFp18(bar.l)

      highBuffer.push(h)
      lowBuffer.push(l)
      if (highBuffer.length > period + 1)
        highBuffer.shift()
      if (lowBuffer.length > period + 1)
        lowBuffer.shift()

      let highestIdx = 0
      let lowestIdx = 0
      for (let j = 1; j < highBuffer.length; j++) {
        if (highBuffer[j] >= highBuffer[highestIdx])
          highestIdx = j
        if (lowBuffer[j] <= lowBuffer[lowestIdx])
          lowestIdx = j
      }

      const daysSinceHigh = highBuffer.length - 1 - highestIdx
      const daysSinceLow = lowBuffer.length - 1 - lowestIdx

      const up = BigInt(period - daysSinceHigh) * fp18.HUNDRED / periodBig
      const down = BigInt(period - daysSinceLow) * fp18.HUNDRED / periodBig

      return {
        up: fp18.toDnum(up),
        down: fp18.toDnum(down),
        oscillator: fp18.toDnum(up - down),
      }
    }
  },
  defaultAroonOptions,
)
