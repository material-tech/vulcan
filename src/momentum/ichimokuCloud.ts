import type { Dnum } from 'dnum'
import type { KlineData, RequiredProperties } from '~/types'
import { defu } from 'defu'
import { add, div, from } from 'dnum'
import { assert } from '~/helpers/assert'
import { max, min } from '~/helpers/operations'

export interface IchimokuCloudOptions {
  /**
   * Conversion line period
   *
   * @default 9
   */
  conversionPeriod?: number
  /**
   * Base line period
   *
   * @default 26
   */
  basePeriod?: number
  /**
   * Leading span B period
   *
   * @default 52
   */
  leadingBPeriod?: number
  /**
   * Displacement period
   *
   * @default 26
   */
  displacement?: number
}

export const defaultIchimokuCloudOptions: IchimokuCloudOptions = {
  conversionPeriod: 9,
  basePeriod: 26,
  leadingBPeriod: 52,
  displacement: 26,
}

export interface IchimokuCloudPoint {
  conversion: Dnum
  base: Dnum
  leadingA: Dnum
  leadingB: Dnum
  lagging: Dnum
}

/**
 * Ichimoku Cloud
 *
 * Note: Since the lagging span requires "future" data, this generator
 * collects the entire input first before yielding results.
 */
export function* ichimokuCloud(
  source: Iterable<RequiredProperties<KlineData, 'h' | 'l' | 'c' | 'v'>>,
  options?: Partial<IchimokuCloudOptions>,
): Generator<IchimokuCloudPoint> {
  const { conversionPeriod, basePeriod, leadingBPeriod, displacement } = defu(options, defaultIchimokuCloudOptions) as Required<IchimokuCloudOptions>

  const data = Array.isArray(source) ? source : [...source]

  assert(
    data.length > Math.max(conversionPeriod, basePeriod, leadingBPeriod),
    'data length must be greater than the maximum of conversionPeriod, basePeriod, leadingBPeriod',
  )

  const highs = data.map(d => from(d.h))
  const lows = data.map(d => from(d.l))
  const closings = data.map(d => from(d.c))

  const createMovingAverage = (period: number) => {
    return Array.from({ length: highs.length }, (_, cur) => {
      const start = cur - period + 1
      if (start < 0) {
        return from(0)
      }
      const highest = max(highs, { period, start })
      const lowest = min(lows, { period, start })
      return div(add(highest, lowest), 2, 18)
    })
  }

  const conversion = createMovingAverage(conversionPeriod)
  const base = createMovingAverage(basePeriod)
  const leadingBBase = createMovingAverage(leadingBPeriod)

  for (let i = 0; i < data.length; i++) {
    const displacedIndex = i - displacement
    const leadingA = displacedIndex < 0
      ? from(0)
      : div(add(conversion[i], base[i]), 2, 18)
    const leadingB = displacedIndex < 0
      ? from(0)
      : leadingBBase[i]

    const laggedIndex = i + displacement
    const lagging = laggedIndex >= closings.length
      ? from(0)
      : closings[i]

    yield {
      conversion: conversion[i],
      base: base[i],
      leadingA,
      leadingB,
      lagging,
    }
  }
}
