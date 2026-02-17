import type { Dnum, Numberish } from 'dnum'
import type { BaseStrategyOptions, StrategySignal } from '../types'
import { sma } from '@material-tech/alloy-indicators'
import { from, gt, toNumber } from 'dnum'
import { createStrategy } from '../base'

export interface GoldenCrossOptions extends BaseStrategyOptions {
  /** Fast SMA period */
  fastPeriod: number
  /** Slow SMA period */
  slowPeriod: number
  /** Stop-loss percentage (0–1), e.g. 0.02 = 2% */
  stopLossPercent: number
}

export const defaultGoldenCrossOptions: GoldenCrossOptions = {
  windowSize: 2,
  fastPeriod: 50,
  slowPeriod: 200,
  stopLossPercent: 0.02,
}

/**
 * Golden Cross / Death Cross Strategy
 *
 * Detects when a fast SMA crosses above (golden cross → long) or
 * below (death cross → short) a slow SMA.
 *
 * - **Golden Cross**: fast SMA crosses above slow SMA → `long`
 * - **Death Cross**: fast SMA crosses below slow SMA → `short`
 * - Otherwise → `hold`
 *
 * Stop-loss is set as a percentage below/above the entry price.
 */
export const goldenCross = createStrategy(
  ({ fastPeriod, slowPeriod, stopLossPercent }) => {
    const fastSma = sma.create({ period: fastPeriod })
    const slowSma = sma.create({ period: slowPeriod })
    let prevFastAbove: boolean | undefined

    return (ctx) => {
      const close = ctx.bar.c as Numberish
      const fast: Dnum = fastSma(close)
      const slow: Dnum = slowSma(close)
      const fastAbove = gt(fast, slow)
      const price = toNumber(from(close, 18))

      let signal: StrategySignal = { action: 'hold' }

      if (prevFastAbove !== undefined) {
        if (fastAbove && !prevFastAbove) {
          signal = {
            action: 'long',
            stopLoss: price * (1 - stopLossPercent),
            reason: 'Golden cross: fast SMA crossed above slow SMA',
          }
        }
        else if (!fastAbove && prevFastAbove) {
          signal = {
            action: 'short',
            stopLoss: price * (1 + stopLossPercent),
            reason: 'Death cross: fast SMA crossed below slow SMA',
          }
        }
      }

      prevFastAbove = fastAbove

      return signal
    }
  },
  defaultGoldenCrossOptions,
)

export { goldenCross as goldenCrossStrategy }
