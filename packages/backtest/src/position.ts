import type { BacktestOptions, NormalizedBar, Position, PositionSide, StrategySignal, Trade } from './types'

export interface PositionUpdate {
  position: Position | null
  closedTrade: Trade | null
}

export function applySlippage(price: number, direction: 'buy' | 'sell', slippageRate: number): number {
  return direction === 'buy'
    ? price * (1 + slippageRate)
    : price * (1 - slippageRate)
}

function closeTrade(
  position: Position,
  exitPrice: number,
  index: number,
  exitReason: Trade['exitReason'],
  options: BacktestOptions,
): Trade {
  const direction = position.side === 'long' ? 'sell' : 'buy'
  const actualExitPrice = applySlippage(exitPrice, direction, options.slippageRate)

  const entryCommission = position.entryPrice * position.quantity * options.commissionRate
  const exitCommission = actualExitPrice * position.quantity * options.commissionRate

  const grossPnl = position.side === 'long'
    ? (actualExitPrice - position.entryPrice) * position.quantity
    : (position.entryPrice - actualExitPrice) * position.quantity

  const pnl = grossPnl - entryCommission - exitCommission
  const cost = position.entryPrice * position.quantity

  return {
    side: position.side,
    entryPrice: position.entryPrice,
    exitPrice: actualExitPrice,
    size: position.size,
    quantity: position.quantity,
    pnl,
    returnRate: cost > 0 ? pnl / cost : 0,
    entryIndex: position.entryIndex,
    exitIndex: index,
    exitReason,
  }
}

function openPosition(
  side: PositionSide,
  bar: NormalizedBar,
  index: number,
  equity: number,
  signal: StrategySignal,
  options: BacktestOptions,
): Position {
  const size = signal.size ?? 1
  const direction = side === 'long' ? 'buy' : 'sell'
  const entryPrice = applySlippage(bar.c, direction, options.slippageRate)
  const allocatedCapital = equity * size
  const quantity = allocatedCapital / entryPrice

  return {
    side,
    entryPrice,
    quantity,
    size,
    entryIndex: index,
    stopLoss: signal.stopLoss,
    takeProfit: signal.takeProfit,
  }
}

function checkStopLoss(position: Position, bar: NormalizedBar): boolean {
  if (position.stopLoss == null)
    return false
  return position.side === 'long'
    ? bar.l <= position.stopLoss
    : bar.h >= position.stopLoss
}

function checkTakeProfit(position: Position, bar: NormalizedBar): boolean {
  if (position.takeProfit == null)
    return false
  return position.side === 'long'
    ? bar.h >= position.takeProfit
    : bar.l <= position.takeProfit
}

/**
 * Pure-function position state machine.
 *
 * SL/TP is checked **before** the signal is processed.
 * When SL/TP triggers, the current signal is ignored.
 */
export function updatePosition(
  currentPosition: Position | null,
  signal: StrategySignal,
  bar: NormalizedBar,
  index: number,
  equity: number,
  options: BacktestOptions,
): PositionUpdate {
  // Step 1: Check SL/TP before processing signal
  if (currentPosition) {
    if (checkStopLoss(currentPosition, bar)) {
      const trade = closeTrade(currentPosition, currentPosition.stopLoss!, index, 'stop_loss', options)
      return { position: null, closedTrade: trade }
    }
    if (checkTakeProfit(currentPosition, bar)) {
      const trade = closeTrade(currentPosition, currentPosition.takeProfit!, index, 'take_profit', options)
      return { position: null, closedTrade: trade }
    }
  }

  const { action } = signal

  // Step 2: FLAT state
  if (!currentPosition) {
    if (action === 'long') {
      return {
        position: openPosition('long', bar, index, equity, signal, options),
        closedTrade: null,
      }
    }
    if (action === 'short' && options.allowShort) {
      return {
        position: openPosition('short', bar, index, equity, signal, options),
        closedTrade: null,
      }
    }
    return { position: null, closedTrade: null }
  }

  // Step 3: LONG state
  if (currentPosition.side === 'long') {
    if (action === 'close') {
      const trade = closeTrade(currentPosition, bar.c, index, 'signal', options)
      return { position: null, closedTrade: trade }
    }
    if (action === 'short') {
      const trade = closeTrade(currentPosition, bar.c, index, 'signal', options)
      const newEquity = equity + trade.pnl
      const newPos = options.allowShort
        ? openPosition('short', bar, index, newEquity, signal, options)
        : null
      return { position: newPos, closedTrade: trade }
    }
    return { position: currentPosition, closedTrade: null }
  }

  // Step 4: SHORT state
  if (action === 'close') {
    const trade = closeTrade(currentPosition, bar.c, index, 'signal', options)
    return { position: null, closedTrade: trade }
  }
  if (action === 'long') {
    const trade = closeTrade(currentPosition, bar.c, index, 'signal', options)
    const newEquity = equity + trade.pnl
    const newPos = openPosition('long', bar, index, newEquity, signal, options)
    return { position: newPos, closedTrade: trade }
  }
  return { position: currentPosition, closedTrade: null }
}

/**
 * Force-close a position at the end of data.
 */
export function closePositionAtEnd(
  position: Position,
  bar: NormalizedBar,
  index: number,
  options: BacktestOptions,
): Trade {
  return closeTrade(position, bar.c, index, 'end_of_data', options)
}
