import type { Dnum, Numberish } from 'dnum'
import type { BaseStrategyOptions, StrategySignal } from '../types'
import { toDnum } from '@vulcan-js/core'
import { rsi } from '@vulcan-js/indicators'
import { gt, lt } from 'dnum'
import { createStrategy } from '../base'

export interface RsiOversoldOverboughtOptions extends BaseStrategyOptions {
  /** RSI calculation period */
  period: number
  /** RSI level above which the asset is considered overbought */
  overboughtLevel: number
  /** RSI level below which the asset is considered oversold */
  oversoldLevel: number
}

export const defaultRsiOversoldOverboughtOptions: RsiOversoldOverboughtOptions = {
  windowSize: 2,
  period: 14,
  overboughtLevel: 70,
  oversoldLevel: 30,
}

/**
 * RSI Oversold/Overbought Strategy
 *
 * Uses the Relative Strength Index to detect oversold and overbought conditions.
 *
 * - RSI crosses below `oversoldLevel` then back above → `long` (oversold reversal)
 * - RSI crosses above `overboughtLevel` then back below → `short` (overbought reversal)
 * - Otherwise → `hold`
 */
export const rsiOversoldOverbought = createStrategy(
  ({ period, overboughtLevel, oversoldLevel }) => {
    const rsiProc = rsi.create({ period })
    let prevRsi: Dnum | undefined
    const obLevel = toDnum(overboughtLevel)
    const osLevel = toDnum(oversoldLevel)

    return (ctx) => {
      const close = ctx.bar.c as Numberish
      const currentRsi = rsiProc(close)

      let signal: StrategySignal = { action: 'hold' }

      if (prevRsi !== undefined) {
        // Oversold reversal: RSI was below oversoldLevel, now crosses above
        if (lt(prevRsi, osLevel) && gt(currentRsi, osLevel)) {
          signal = {
            action: 'long',
            reason: `RSI crossed above oversold level (${oversoldLevel})`,
          }
        }
        // Overbought reversal: RSI was above overboughtLevel, now crosses below
        else if (gt(prevRsi, obLevel) && lt(currentRsi, obLevel)) {
          signal = {
            action: 'short',
            reason: `RSI crossed below overbought level (${overboughtLevel})`,
          }
        }
      }

      prevRsi = currentRsi

      return signal
    }
  },
  defaultRsiOversoldOverboughtOptions,
)

export { rsiOversoldOverbought as rsiOversoldOverboughtStrategy }
