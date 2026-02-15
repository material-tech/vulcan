import type { Dnum } from 'dnum'
import type { KlineData, RequiredProperties } from '~/types'
import { from, gt, lt } from 'dnum'
import { createSignal } from '~/base'
import { mapPick } from '~/helpers/array'

export interface AroonOptions {
  period: number
}

export const defaultAroonOptions: AroonOptions = {
  period: 25,
}

export interface AroonResult {
  up: Dnum[]
  down: Dnum[]
  oscillator: Dnum[]
}

export const aroon = createSignal({
  compute: (data: RequiredProperties<KlineData, 'h' | 'l'>[], { period }) => {
    const highs = mapPick(data, 'h', v => from(v))
    const lows = mapPick(data, 'l', v => from(v))

    const up: Dnum[] = []
    const down: Dnum[] = []
    const oscillator: Dnum[] = []

    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - period)

      let highestIdx = start
      let lowestIdx = start

      for (let j = start + 1; j <= i; j++) {
        // Prefer the most recent index when values are equal
        if (!gt(highs[highestIdx], highs[j]))
          highestIdx = j
        if (!lt(lows[lowestIdx], lows[j]))
          lowestIdx = j
      }

      const aroonUpValue = ((period - (i - highestIdx)) * 100) / period
      const aroonDownValue = ((period - (i - lowestIdx)) * 100) / period

      up.push(from(aroonUpValue))
      down.push(from(aroonDownValue))
      oscillator.push(from(aroonUpValue - aroonDownValue))
    }

    return { up, down, oscillator } as AroonResult
  },
  stream: ({ period }) => {
    const highBuffer: Dnum[] = []
    const lowBuffer: Dnum[] = []
    return (data: RequiredProperties<KlineData, 'h' | 'l'>) => {
      highBuffer.push(from(data.h))
      lowBuffer.push(from(data.l))
      if (highBuffer.length > period + 1) {
        highBuffer.shift()
        lowBuffer.shift()
      }

      let highestIdx = 0
      let lowestIdx = 0
      for (let j = 1; j < highBuffer.length; j++) {
        if (!gt(highBuffer[highestIdx], highBuffer[j]))
          highestIdx = j
        if (!lt(lowBuffer[lowestIdx], lowBuffer[j]))
          lowestIdx = j
      }

      const windowLen = highBuffer.length - 1
      const aroonUpValue = ((period - (windowLen - highestIdx)) * 100) / period
      const aroonDownValue = ((period - (windowLen - lowestIdx)) * 100) / period

      return {
        up: from(aroonUpValue),
        down: from(aroonDownValue),
        oscillator: from(aroonUpValue - aroonDownValue),
      }
    }
  },
  defaultOptions: defaultAroonOptions,
})
