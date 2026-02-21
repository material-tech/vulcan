import type { Dnum } from 'dnum'
import type { BacktestStatistics, Trade } from './types'
import { constants } from '@vulcan-js/core'
import { abs, add, divide, greaterThan, subtract, toNumber } from 'dnum'

/**
 * Compute comprehensive backtest statistics from closed trades and equity curve.
 */
export function computeStatistics(
  trades: Trade[],
  equityCurve: Dnum[],
  initialCapital: Dnum,
): BacktestStatistics {
  const totalBars = equityCurve.length
  const totalTrades = trades.length

  if (totalTrades === 0) {
    return {
      totalBars,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      netPnl: 0,
      netReturn: 0,
      grossProfit: 0,
      grossLoss: 0,
      profitFactor: 0,
      averageWin: 0,
      averageLoss: 0,
      payoffRatio: 0,
      maxDrawdown: 0,
      maxDrawdownAmount: 0,
      sharpeRatio: 0,
      sortinoRatio: 0,
      maxConsecutiveWins: 0,
      maxConsecutiveLosses: 0,
    }
  }

  const wins = trades.filter(t => greaterThan(t.pnl, constants.ZERO))
  const losses = trades.filter(t => !greaterThan(t.pnl, constants.ZERO))
  const winningTrades = wins.length
  const losingTrades = losses.length

  const grossProfitDnum = wins.reduce((sum, t) => add(sum, t.pnl), constants.ZERO)
  const grossLossDnum = abs(losses.reduce((sum, t) => add(sum, t.pnl), constants.ZERO))
  const netPnlDnum = subtract(grossProfitDnum, grossLossDnum)

  const grossProfit = toNumber(grossProfitDnum)
  const grossLoss = toNumber(grossLossDnum)
  const netPnl = toNumber(netPnlDnum)

  const averageWin = winningTrades > 0 ? grossProfit / winningTrades : 0
  const averageLoss = losingTrades > 0 ? grossLoss / losingTrades : 0

  const { maxDrawdown, maxDrawdownAmount } = computeMaxDrawdown(equityCurve)
  const { sharpeRatio, sortinoRatio } = computeRiskMetrics(equityCurve)
  const { maxConsecutiveWins, maxConsecutiveLosses } = computeStreaks(trades)

  const initialCapitalNum = toNumber(initialCapital)

  return {
    totalBars,
    totalTrades,
    winningTrades,
    losingTrades,
    winRate: winningTrades / totalTrades,
    netPnl,
    netReturn: initialCapitalNum > 0 ? netPnl / initialCapitalNum : 0,
    grossProfit,
    grossLoss,
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0,
    averageWin,
    averageLoss,
    payoffRatio: averageLoss > 0 ? averageWin / averageLoss : averageWin > 0 ? Infinity : 0,
    maxDrawdown: toNumber(maxDrawdown),
    maxDrawdownAmount: toNumber(maxDrawdownAmount),
    sharpeRatio,
    sortinoRatio,
    maxConsecutiveWins,
    maxConsecutiveLosses,
  }
}

function computeMaxDrawdown(equityCurve: Dnum[]): { maxDrawdown: Dnum, maxDrawdownAmount: Dnum } {
  if (equityCurve.length === 0)
    return { maxDrawdown: constants.ZERO, maxDrawdownAmount: constants.ZERO }

  let peak = equityCurve[0]
  let maxDrawdownAmount = constants.ZERO
  let maxDrawdown = constants.ZERO

  for (const equity of equityCurve) {
    if (greaterThan(equity, peak))
      peak = equity
    const drawdownAmount = subtract(peak, equity)
    if (greaterThan(drawdownAmount, maxDrawdownAmount)) {
      maxDrawdownAmount = drawdownAmount
      maxDrawdown = greaterThan(peak, constants.ZERO) ? divide(drawdownAmount, peak, constants.DECIMALS) : constants.ZERO
    }
  }

  return { maxDrawdown, maxDrawdownAmount }
}

function computeRiskMetrics(equityCurve: Dnum[]): { sharpeRatio: number, sortinoRatio: number } {
  if (equityCurve.length < 2)
    return { sharpeRatio: 0, sortinoRatio: 0 }

  const returns: number[] = []
  for (let i = 1; i < equityCurve.length; i++) {
    const ret = divide(subtract(equityCurve[i], equityCurve[i - 1]), equityCurve[i - 1], constants.DECIMALS)
    returns.push(toNumber(ret))
  }

  const n = returns.length
  const meanReturn = returns.reduce((a, b) => a + b, 0) / n

  const variance = returns.reduce((sum, r) => sum + (r - meanReturn) ** 2, 0) / n
  const stdDev = Math.sqrt(variance)

  const downsideVariance = returns.reduce((sum, r) => sum + Math.min(0, r) ** 2, 0) / n
  const downsideDev = Math.sqrt(downsideVariance)

  // Annualize assuming ~252 trading days
  const annFactor = Math.sqrt(252)

  return {
    sharpeRatio: stdDev > 0 ? (meanReturn / stdDev) * annFactor : 0,
    sortinoRatio: downsideDev > 0 ? (meanReturn / downsideDev) * annFactor : 0,
  }
}

function computeStreaks(trades: Trade[]): { maxConsecutiveWins: number, maxConsecutiveLosses: number } {
  let maxWins = 0
  let maxLosses = 0
  let currentWins = 0
  let currentLosses = 0

  for (const trade of trades) {
    if (greaterThan(trade.pnl, constants.ZERO)) {
      currentWins++
      currentLosses = 0
      maxWins = Math.max(maxWins, currentWins)
    }
    else {
      currentLosses++
      currentWins = 0
      maxLosses = Math.max(maxLosses, currentLosses)
    }
  }

  return { maxConsecutiveWins: maxWins, maxConsecutiveLosses: maxLosses }
}
