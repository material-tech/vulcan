import type { Dnum } from 'dnum'
import type { BacktestOptions, NormalizedBar, Position, PositionSide, StrategySignal, Trade } from './types'
import { add, divide, from, greaterThan, greaterThanOrEqual, lessThanOrEqual, multiply, subtract } from 'dnum'

const ZERO: Dnum = from(0, 18)

export interface PositionUpdate {
  position: Position | null
  closedTrade: Trade | null
}

export function applySlippage(price: Dnum, direction: 'buy' | 'sell', slippageRate: number): Dnum {
  const slippage = multiply(price, slippageRate, 18)
  return direction === 'buy'
    ? add(price, slippage)
    : subtract(price, slippage)
}

function closeTrade(
  position: Position,
  exitPrice: Dnum,
  index: number,
  exitReason: Trade['exitReason'],
  options: BacktestOptions,
): Trade {
  const direction = position.side === 'long' ? 'sell' : 'buy'
  const actualExitPrice = applySlippage(exitPrice, direction, options.slippageRate)

  const entryCommission = multiply(multiply(position.entryPrice, position.quantity, 18), options.commissionRate, 18)
  const exitCommission = multiply(multiply(actualExitPrice, position.quantity, 18), options.commissionRate, 18)

  const priceDiff = position.side === 'long'
    ? subtract(actualExitPrice, position.entryPrice)
    : subtract(position.entryPrice, actualExitPrice)

  const grossPnl = multiply(priceDiff, position.quantity, 18)
  const pnl = subtract(subtract(grossPnl, entryCommission), exitCommission)
  const cost = multiply(position.entryPrice, position.quantity, 18)

  const returnRate = greaterThan(cost, ZERO)
    ? divide(pnl, cost, 18)
    : ZERO

  return {
    side: position.side,
    entryPrice: position.entryPrice,
    exitPrice: actualExitPrice,
    size: position.size,
    quantity: position.quantity,
    pnl,
    returnRate,
    entryIndex: position.entryIndex,
    exitIndex: index,
    exitReason,
  }
}

function openPosition(
  side: PositionSide,
  bar: NormalizedBar,
  index: number,
  equity: Dnum,
  signal: StrategySignal,
  options: BacktestOptions,
): Position {
  const size = signal.size ?? 1
  const direction = side === 'long' ? 'buy' : 'sell'
  const entryPrice = applySlippage(bar.c, direction, options.slippageRate)
  const allocatedCapital = multiply(equity, size, 18)
  const quantity = divide(allocatedCapital, entryPrice, 18)

  return {
    side,
    entryPrice,
    quantity,
    size,
    entryIndex: index,
    stopLoss: signal.stopLoss != null ? from(signal.stopLoss, 18) : undefined,
    takeProfit: signal.takeProfit != null ? from(signal.takeProfit, 18) : undefined,
  }
}

function checkStopLoss(position: Position, bar: NormalizedBar): boolean {
  if (position.stopLoss == null)
    return false
  return position.side === 'long'
    ? lessThanOrEqual(bar.l, position.stopLoss)
    : greaterThanOrEqual(bar.h, position.stopLoss)
}

function checkTakeProfit(position: Position, bar: NormalizedBar): boolean {
  if (position.takeProfit == null)
    return false
  return position.side === 'long'
    ? greaterThanOrEqual(bar.h, position.takeProfit)
    : lessThanOrEqual(bar.l, position.takeProfit)
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
  equity: Dnum,
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
      const newEquity = add(equity, trade.pnl)
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
    const newEquity = add(equity, trade.pnl)
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
