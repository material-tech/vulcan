import type { CandleData } from '@vulcan-js/core'
import type { TickData, TimeFrame } from './types'
import { fp18 } from '@vulcan-js/core'
import { TIMEFRAME_MS } from './types'

export function aggregateToOHLCV(
  ticks: TickData[],
  timeFrame: TimeFrame,
  startTime: number,
): CandleData[] {
  if (ticks.length === 0)
    return []

  const interval = TIMEFRAME_MS[timeFrame]
  const candles: CandleData[] = []
  let currentBucket = Math.floor((ticks[0]!.timestamp - startTime) / interval) * interval + startTime

  let open = ticks[0]!.price
  let high = ticks[0]!.price
  let low = ticks[0]!.price
  let close = ticks[0]!.price
  let volume = 0

  for (const tick of ticks) {
    const bucket = Math.floor((tick.timestamp - startTime) / interval) * interval + startTime

    if (bucket !== currentBucket) {
      candles.push({
        o: fp18.toDnum(fp18.toFp18(open)),
        h: fp18.toDnum(fp18.toFp18(high)),
        l: fp18.toDnum(fp18.toFp18(low)),
        c: fp18.toDnum(fp18.toFp18(close)),
        v: fp18.toDnum(fp18.toFp18(volume)),
        timestamp: currentBucket,
      })

      currentBucket = bucket
      open = tick.price
      high = tick.price
      low = tick.price
      volume = 0
    }

    high = Math.max(high, tick.price)
    low = Math.min(low, tick.price)
    close = tick.price
    volume += tick.volume
  }

  if (volume > 0) {
    candles.push({
      o: fp18.toDnum(fp18.toFp18(open)),
      h: fp18.toDnum(fp18.toFp18(high)),
      l: fp18.toDnum(fp18.toFp18(low)),
      c: fp18.toDnum(fp18.toFp18(close)),
      v: fp18.toDnum(fp18.toFp18(volume)),
      timestamp: currentBucket,
    })
  }

  return candles
}

export function generateTimestamps(
  count: number,
  timeFrame: TimeFrame,
  startTime: number,
): number[] {
  const interval = TIMEFRAME_MS[timeFrame]
  const timestamps: number[] = []

  for (let i = 0; i < count; i++) {
    const baseTime = startTime + i * interval
    const jitter = Math.floor(Math.random() * (interval * 0.8))
    timestamps.push(baseTime + jitter)
  }

  return timestamps
}
