import type { Dnum } from 'dnum'
import type { KlineData, Processor, RequiredProperties } from '~/types'
import { from, gt, lt } from 'dnum'
import { createGenerator } from '~/base'

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
export const aroon = createGenerator(
  ({ period }: Required<AroonOptions>): Processor<RequiredProperties<KlineData, 'h' | 'l'>, AroonPoint> => {
    const highBuffer: Dnum[] = []
    const lowBuffer: Dnum[] = []

    return (bar) => {
      const h = from(bar.h)
      const l = from(bar.l)

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

      const aroonUpValue = ((period - daysSinceHigh) * 100) / period
      const aroonDownValue = ((period - daysSinceLow) * 100) / period

      return {
        up: from(aroonUpValue),
        down: from(aroonDownValue),
        oscillator: from(aroonUpValue - aroonDownValue),
      }
    }
  },
  defaultAroonOptions,
)
