import type { Dnum, Numberish } from 'dnum'
import { add, div, eq, from, gt, mul, sub } from 'dnum'
import { createSignal } from '~/base'
import { rma } from '~/trend/rollingMovingAverage'

export interface RSIOptions {
  period: number
}

export const defaultRSIOptions: RSIOptions = {
  period: 14,
}

/**
 * Relative Strength Index (RSI). It is a momentum indicator that measures the magnitude of
 * recent price changes to evaluate overbought and oversold conditions
 * using the given window period.
 *
 * RS = Average Gain / Average Loss
 *
 * RSI = 100 - (100 / (1 + RS))
 */
export const rsi = createSignal(({ period }) => {
  const gainRma = rma.next({ period })
  const lossRma = rma.next({ period })
  let prev: Dnum | null = null
  let first = true
  return (value: Numberish): Dnum => {
    const current = from(value)
    if (first) {
      first = false
      prev = current
      // First point: feed 0 gain/loss into RMA
      gainRma(from(0))
      lossRma(from(0))
      return from(0)
    }

    const change = sub(current, prev!)
    prev = current

    const gain = gt(change, 0) ? change : from(0)
    const loss = gt(change, 0) ? from(0) : mul(change, -1, 18)

    const avgGain = gainRma(gain)
    const avgLoss = lossRma(loss)

    if (eq(avgLoss, 0)) {
      return from(100)
    }

    const rs = div(avgGain, avgLoss)
    return sub(100, div(100, add(1, rs), 18))
  }
}, defaultRSIOptions)

export { rsi as relativeStrengthIndex }
