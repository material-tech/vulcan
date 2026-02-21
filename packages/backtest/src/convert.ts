import type { CandleData, NormalizedBar } from './types'
import { toDnum } from '@vulcan-js/core'

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
