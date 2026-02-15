import type { Dnum } from 'dnum'
import type { KlineData, RequiredProperties } from '~/types'
import { from, gt, lt } from 'dnum'
import { createSignal } from '~/base'

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

export const aroon = createSignal(({ period }) => {
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
}, defaultAroonOptions)
