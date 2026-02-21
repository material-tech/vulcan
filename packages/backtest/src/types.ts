import type { CandleData } from '@vulcan/core'
import type { StrategySignal } from '@vulcan/strategies'
import type { Dnum, Numberish } from 'dnum'

export type { CandleData, StrategySignal }

export interface NormalizedBar {
  o: Dnum
  h: Dnum
  l: Dnum
  c: Dnum
  v: Dnum
  timestamp?: number | Date | string
}

export interface BacktestOptions {
  /** Initial capital, defaults to 10000 */
  initialCapital: Numberish
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
  entryPrice: Dnum
  quantity: Dnum
  size: number
  entryIndex: number
  stopLoss?: Dnum
  takeProfit?: Dnum
}

export interface Trade {
  side: PositionSide
  entryPrice: Dnum
  exitPrice: Dnum
  size: number
  quantity: Dnum
  pnl: Dnum
  returnRate: Dnum
  entryIndex: number
  exitIndex: number
  exitReason: 'signal' | 'stop_loss' | 'take_profit' | 'end_of_data'
}

export interface BacktestSnapshot {
  index: number
  bar: NormalizedBar
  signal: StrategySignal
  position: Position | null
  equity: Dnum
  unrealizedPnl: Dnum
  totalEquity: Dnum
  closedTrade: Trade | null
}

export interface BacktestResult {
  trades: Trade[]
  statistics: BacktestStatistics
  equityCurve: Dnum[]
  finalEquity: Dnum
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
