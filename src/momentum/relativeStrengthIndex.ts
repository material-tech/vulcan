import type { Dnum, Numberish } from 'dnum'
import { defu } from 'defu'
import { add, div, eq, from, gt, mul, sub } from 'dnum'
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
export function* rsi(
  source: Iterable<Numberish>,
  options?: Partial<RSIOptions>,
): Generator<Dnum> {
  const { period } = defu(options, defaultRSIOptions) as Required<RSIOptions>
  const gainProc = rma.create({ period })
  const lossProc = rma.create({ period })

  let prev: Dnum | undefined

  for (const value of source) {
    const price = from(value)

    if (prev === undefined) {
      prev = price
      // Feed zero to both RMA processors for the first element
      gainProc(from(0))
      lossProc(from(0))
      yield from(0)
      continue
    }

    const change = sub(price, prev)
    prev = price

    const gain = gt(change, 0) ? change : from(0)
    const loss = gt(change, 0) ? from(0) : mul(change, -1, 18)

    const avgGain = gainProc(gain)
    const avgLoss = lossProc(loss)

    if (eq(avgLoss, 0)) {
      yield from(100)
    }
    else {
      const rs = div(avgGain, avgLoss)
      yield sub(100, div(100, add(1, rs), 18))
    }
  }
}

export { rsi as relativeStrengthIndex }
