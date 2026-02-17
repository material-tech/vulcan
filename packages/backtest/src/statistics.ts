import type { BacktestStatistics, Trade } from './types'

/**
 * Compute comprehensive backtest statistics from closed trades and equity curve.
 */
export function computeStatistics(
  trades: Trade[],
  equityCurve: number[],
  initialCapital: number,
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

  const wins = trades.filter(t => t.pnl > 0)
  const losses = trades.filter(t => t.pnl <= 0)
  const winningTrades = wins.length
  const losingTrades = losses.length

  const grossProfit = wins.reduce((sum, t) => sum + t.pnl, 0)
  const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.pnl, 0))
  const netPnl = grossProfit - grossLoss

  const averageWin = winningTrades > 0 ? grossProfit / winningTrades : 0
  const averageLoss = losingTrades > 0 ? grossLoss / losingTrades : 0

  const { maxDrawdown, maxDrawdownAmount } = computeMaxDrawdown(equityCurve)
  const { sharpeRatio, sortinoRatio } = computeRiskMetrics(equityCurve)
  const { maxConsecutiveWins, maxConsecutiveLosses } = computeStreaks(trades)

  return {
    totalBars,
    totalTrades,
    winningTrades,
    losingTrades,
    winRate: winningTrades / totalTrades,
    netPnl,
    netReturn: initialCapital > 0 ? netPnl / initialCapital : 0,
    grossProfit,
    grossLoss,
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0,
    averageWin,
    averageLoss,
    payoffRatio: averageLoss > 0 ? averageWin / averageLoss : averageWin > 0 ? Infinity : 0,
    maxDrawdown,
    maxDrawdownAmount,
    sharpeRatio,
    sortinoRatio,
    maxConsecutiveWins,
    maxConsecutiveLosses,
  }
}

function computeMaxDrawdown(equityCurve: number[]): { maxDrawdown: number, maxDrawdownAmount: number } {
  if (equityCurve.length === 0)
    return { maxDrawdown: 0, maxDrawdownAmount: 0 }

  let peak = equityCurve[0]
  let maxDrawdownAmount = 0
  let maxDrawdown = 0

  for (const equity of equityCurve) {
    if (equity > peak)
      peak = equity
    const drawdownAmount = peak - equity
    if (drawdownAmount > maxDrawdownAmount) {
      maxDrawdownAmount = drawdownAmount
      maxDrawdown = peak > 0 ? drawdownAmount / peak : 0
    }
  }

  return { maxDrawdown, maxDrawdownAmount }
}

function computeRiskMetrics(equityCurve: number[]): { sharpeRatio: number, sortinoRatio: number } {
  if (equityCurve.length < 2)
    return { sharpeRatio: 0, sortinoRatio: 0 }

  const returns: number[] = []
  for (let i = 1; i < equityCurve.length; i++) {
    returns.push((equityCurve[i] - equityCurve[i - 1]) / equityCurve[i - 1])
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
    if (trade.pnl > 0) {
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
