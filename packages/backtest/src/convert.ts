import type { Numberish } from 'dnum'
import type { CandleData, NormalizedBar } from './types'
import { from } from 'dnum'

function toDnum(value: Numberish) {
  return from(value, 18)
}

export function normalizeBar(bar: CandleData): NormalizedBar {
  return {
    o: toDnum(bar.o),
    h: toDnum(bar.h),
    l: toDnum(bar.l),
    c: toDnum(bar.c),
    v: toDnum(bar.v),
    ...(bar.timestamp !== undefined && { timestamp: bar.timestamp }),
  }
}
