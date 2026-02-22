import type { CandleData } from '@vulcan-js/forge'

/**
 * Generate simulated OHLCV candle data for demonstration purposes.
 *
 * Uses a random walk starting from `startPrice`. Each candle's open equals the
 * previous close and the high/low are derived from the random body with added
 * wick noise.
 */
export function generateCandles(count: number, startPrice = 100): CandleData[] {
  const candles: CandleData[] = []
  let price = startPrice

  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.48) * 4 // slight upward bias
    const open = price
    const close = open + change
    const wickUp = Math.random() * 2
    const wickDown = Math.random() * 2
    const high = Math.max(open, close) + wickUp
    const low = Math.min(open, close) - wickDown
    const volume = 1000 + Math.random() * 5000

    candles.push({
      o: Number(open.toFixed(2)),
      h: Number(high.toFixed(2)),
      l: Number(low.toFixed(2)),
      c: Number(close.toFixed(2)),
      v: Math.round(volume),
    })

    price = close
  }

  return candles
}

/** A fixed set of 60 candles for reproducible demos. */
export const sampleCandles: CandleData[] = [
  { o: 100, h: 102.5, l: 99.1, c: 101.2, v: 2500 },
  { o: 101.2, h: 103.0, l: 100.5, c: 102.8, v: 3100 },
  { o: 102.8, h: 104.1, l: 101.9, c: 103.5, v: 2800 },
  { o: 103.5, h: 105.2, l: 102.8, c: 104.9, v: 3500 },
  { o: 104.9, h: 106.0, l: 104.0, c: 105.5, v: 2900 },
  { o: 105.5, h: 107.1, l: 104.8, c: 106.8, v: 3200 },
  { o: 106.8, h: 108.0, l: 106.0, c: 107.5, v: 3400 },
  { o: 107.5, h: 109.2, l: 106.9, c: 108.8, v: 3800 },
  { o: 108.8, h: 110.0, l: 108.0, c: 109.2, v: 3100 },
  { o: 109.2, h: 110.5, l: 108.5, c: 110.1, v: 3600 },
  { o: 110.1, h: 111.0, l: 109.0, c: 109.5, v: 2700 },
  { o: 109.5, h: 110.2, l: 108.2, c: 108.8, v: 3000 },
  { o: 108.8, h: 109.5, l: 107.5, c: 107.9, v: 3300 },
  { o: 107.9, h: 108.8, l: 106.8, c: 107.2, v: 2900 },
  { o: 107.2, h: 108.0, l: 106.0, c: 106.5, v: 3100 },
  { o: 106.5, h: 107.5, l: 105.5, c: 105.8, v: 2800 },
  { o: 105.8, h: 106.8, l: 104.9, c: 105.2, v: 3200 },
  { o: 105.2, h: 106.0, l: 104.0, c: 104.5, v: 2600 },
  { o: 104.5, h: 105.5, l: 103.8, c: 104.0, v: 2900 },
  { o: 104.0, h: 105.0, l: 103.0, c: 103.5, v: 3400 },
  { o: 103.5, h: 104.8, l: 103.0, c: 104.2, v: 3100 },
  { o: 104.2, h: 105.5, l: 103.5, c: 105.0, v: 3300 },
  { o: 105.0, h: 106.2, l: 104.5, c: 105.8, v: 2800 },
  { o: 105.8, h: 107.0, l: 105.0, c: 106.5, v: 3500 },
  { o: 106.5, h: 108.0, l: 106.0, c: 107.8, v: 3700 },
  { o: 107.8, h: 109.5, l: 107.0, c: 109.0, v: 4000 },
  { o: 109.0, h: 110.2, l: 108.5, c: 110.0, v: 3800 },
  { o: 110.0, h: 111.5, l: 109.5, c: 111.2, v: 4200 },
  { o: 111.2, h: 112.8, l: 110.8, c: 112.5, v: 4500 },
  { o: 112.5, h: 113.5, l: 112.0, c: 113.0, v: 4100 },
  { o: 113.0, h: 114.0, l: 112.2, c: 112.5, v: 3600 },
  { o: 112.5, h: 113.2, l: 111.5, c: 111.8, v: 3200 },
  { o: 111.8, h: 112.5, l: 110.8, c: 111.0, v: 3400 },
  { o: 111.0, h: 112.0, l: 110.0, c: 110.5, v: 3100 },
  { o: 110.5, h: 111.5, l: 109.5, c: 110.0, v: 2900 },
  { o: 110.0, h: 111.0, l: 109.0, c: 109.5, v: 3000 },
  { o: 109.5, h: 110.5, l: 108.5, c: 109.0, v: 3200 },
  { o: 109.0, h: 110.0, l: 108.0, c: 108.5, v: 2800 },
  { o: 108.5, h: 109.5, l: 107.5, c: 108.0, v: 3100 },
  { o: 108.0, h: 109.0, l: 107.0, c: 107.5, v: 2700 },
  { o: 107.5, h: 108.5, l: 107.0, c: 108.0, v: 3300 },
  { o: 108.0, h: 109.5, l: 107.5, c: 109.2, v: 3500 },
  { o: 109.2, h: 110.5, l: 108.8, c: 110.0, v: 3800 },
  { o: 110.0, h: 111.2, l: 109.5, c: 111.0, v: 4000 },
  { o: 111.0, h: 112.5, l: 110.5, c: 112.2, v: 4200 },
  { o: 112.2, h: 113.8, l: 111.8, c: 113.5, v: 4500 },
  { o: 113.5, h: 115.0, l: 113.0, c: 114.8, v: 4800 },
  { o: 114.8, h: 116.0, l: 114.2, c: 115.5, v: 5000 },
  { o: 115.5, h: 117.0, l: 115.0, c: 116.8, v: 4600 },
  { o: 116.8, h: 118.0, l: 116.0, c: 117.5, v: 4900 },
  { o: 117.5, h: 118.5, l: 116.5, c: 116.8, v: 4200 },
  { o: 116.8, h: 117.5, l: 115.8, c: 116.0, v: 3800 },
  { o: 116.0, h: 117.0, l: 115.0, c: 115.5, v: 3600 },
  { o: 115.5, h: 116.5, l: 114.5, c: 115.0, v: 3400 },
  { o: 115.0, h: 116.0, l: 114.0, c: 114.5, v: 3200 },
  { o: 114.5, h: 115.5, l: 113.5, c: 114.0, v: 3000 },
  { o: 114.0, h: 115.0, l: 113.0, c: 114.5, v: 3300 },
  { o: 114.5, h: 116.0, l: 114.0, c: 115.8, v: 3600 },
  { o: 115.8, h: 117.0, l: 115.0, c: 116.5, v: 3900 },
  { o: 116.5, h: 118.0, l: 116.0, c: 117.8, v: 4200 },
]
