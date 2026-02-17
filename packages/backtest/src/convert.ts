import type { Numberish } from 'dnum'
import type { CandleData, NormalizedBar } from './types'
import { from, toNumber } from 'dnum'

function toNum(value: Numberish): number {
  if (typeof value === 'number')
    return value
  return toNumber(from(value))
}

export function normalizeBar(bar: CandleData): NormalizedBar {
  return {
    o: toNum(bar.o),
    h: toNum(bar.h),
    l: toNum(bar.l),
    c: toNum(bar.c),
    v: toNum(bar.v),
    ...(bar.timestamp !== undefined && { timestamp: bar.timestamp }),
  }
}
