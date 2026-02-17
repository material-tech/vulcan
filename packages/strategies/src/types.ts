import type { KlineData, Processor, SignalGenerator } from '@material-tech/alloy-core'

/**
 * The action a strategy recommends.
 */
export type StrategyAction = 'long' | 'short' | 'close' | 'hold'

/**
 * Structured signal output from a strategy.
 */
export interface StrategySignal {
  /** The recommended action */
  action: StrategyAction
  /** Position size as a fraction (0–1), defaults to 1 */
  size?: number
  /** Stop-loss price level */
  stopLoss?: number
  /** Take-profit price level */
  takeProfit?: number
  /** Human-readable reason for the signal */
  reason?: string
}

/**
 * Base options that every strategy must include.
 */
export interface BaseStrategyOptions {
  /** Number of historical bars to keep in the rolling window */
  windowSize: number
}

/**
 * Context passed to the strategy evaluation function on each bar.
 */
export interface StrategyContext {
  /** The current bar */
  bar: KlineData
  /** Historical bars in the rolling window (oldest first, includes current bar) */
  bars: readonly KlineData[]
  /** Zero-based index of the current bar since the strategy started */
  index: number
}

/**
 * A strategy generator — type alias ensuring compatibility with all existing adapters.
 */
export type StrategyGenerator<Opts extends BaseStrategyOptions>
  = SignalGenerator<KlineData, StrategySignal, Opts>

export type StrategyFactory<Opts extends BaseStrategyOptions>
  = (opts: Required<Opts>) => (ctx: StrategyContext) => StrategySignal

export type { KlineData, Processor }
