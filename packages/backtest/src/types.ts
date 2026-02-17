import type { CandleData } from '@material-tech/alloy-core'
import type { StrategySignal } from '@material-tech/alloy-strategies'

export type { CandleData, StrategySignal }

export interface NormalizedBar {
  o: number
  h: number
  l: number
  c: number
  v: number
  timestamp?: number | Date | string
}

export interface BacktestOptions {
  /** Initial capital, defaults to 10000 */
  initialCapital: number
  /** Commission rate (0–1), defaults to 0 */
  commissionRate: number
  /** Slippage rate (0–1), defaults to 0 */
  slippageRate: number
  /** Allow short selling, defaults to true */
  allowShort: boolean
}

export type PositionSide = 'long' | 'short'

export interface Position {
  side: PositionSide
  entryPrice: number
  quantity: number
  size: number
  entryIndex: number
  stopLoss?: number
  takeProfit?: number
}

export interface Trade {
  side: PositionSide
  entryPrice: number
  exitPrice: number
  size: number
  quantity: number
  pnl: number
  returnRate: number
  entryIndex: number
  exitIndex: number
  exitReason: 'signal' | 'stop_loss' | 'take_profit' | 'end_of_data'
}

export interface BacktestSnapshot {
  index: number
  bar: NormalizedBar
  signal: StrategySignal
  position: Position | null
  equity: number
  unrealizedPnl: number
  totalEquity: number
  closedTrade: Trade | null
}

export interface BacktestResult {
  trades: Trade[]
  statistics: BacktestStatistics
  equityCurve: number[]
  finalEquity: number
}

export interface BacktestStatistics {
  totalBars: number
  totalTrades: number
  winningTrades: number
  losingTrades: number
  winRate: number
  netPnl: number
  netReturn: number
  grossProfit: number
  grossLoss: number
  profitFactor: number
  averageWin: number
  averageLoss: number
  payoffRatio: number
  maxDrawdown: number
  maxDrawdownAmount: number
  sharpeRatio: number
  sortinoRatio: number
  maxConsecutiveWins: number
  maxConsecutiveLosses: number
}
