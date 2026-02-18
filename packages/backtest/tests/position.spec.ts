import type { BacktestOptions, NormalizedBar, Position } from '@material-tech/vulcan-backtest'
import type { StrategySignal } from '@material-tech/vulcan-strategies'
import { describe, expect, it } from 'vitest'
import { applySlippage, closePositionAtEnd, updatePosition } from '../src/position'

const defaultOptions: BacktestOptions = {
  initialCapital: 10000,
  commissionRate: 0,
  slippageRate: 0,
  allowShort: true,
}

function bar(overrides: Partial<NormalizedBar> = {}): NormalizedBar {
  return { o: 100, h: 105, l: 95, c: 102, v: 1000, ...overrides }
}

function holdSignal(): StrategySignal {
  return { action: 'hold' }
}

function longSignal(extra: Partial<StrategySignal> = {}): StrategySignal {
  return { action: 'long', ...extra }
}

function shortSignal(extra: Partial<StrategySignal> = {}): StrategySignal {
  return { action: 'short', ...extra }
}

function closeSignal(): StrategySignal {
  return { action: 'close' }
}

describe('applySlippage', () => {
  it('increases price for buy direction', () => {
    expect(applySlippage(100, 'buy', 0.01)).toBe(101)
  })

  it('decreases price for sell direction', () => {
    expect(applySlippage(100, 'sell', 0.01)).toBe(99)
  })

  it('returns exact price when slippage is 0', () => {
    expect(applySlippage(100, 'buy', 0)).toBe(100)
    expect(applySlippage(100, 'sell', 0)).toBe(100)
  })
})

describe('updatePosition — FLAT state', () => {
  it('opens long on long signal', () => {
    const result = updatePosition(null, longSignal(), bar(), 0, 10000, defaultOptions)

    expect(result.closedTrade).toBeNull()
    expect(result.position).not.toBeNull()
    expect(result.position!.side).toBe('long')
    expect(result.position!.entryPrice).toBe(102)
    expect(result.position!.quantity).toBeCloseTo(10000 / 102)
    expect(result.position!.entryIndex).toBe(0)
  })

  it('opens short on short signal when allowed', () => {
    const result = updatePosition(null, shortSignal(), bar(), 0, 10000, defaultOptions)

    expect(result.closedTrade).toBeNull()
    expect(result.position).not.toBeNull()
    expect(result.position!.side).toBe('short')
  })

  it('ignores short signal when allowShort is false', () => {
    const opts = { ...defaultOptions, allowShort: false }
    const result = updatePosition(null, shortSignal(), bar(), 0, 10000, opts)

    expect(result.position).toBeNull()
    expect(result.closedTrade).toBeNull()
  })

  it('does nothing on hold signal', () => {
    const result = updatePosition(null, holdSignal(), bar(), 0, 10000, defaultOptions)
    expect(result.position).toBeNull()
    expect(result.closedTrade).toBeNull()
  })

  it('does nothing on close signal', () => {
    const result = updatePosition(null, closeSignal(), bar(), 0, 10000, defaultOptions)
    expect(result.position).toBeNull()
    expect(result.closedTrade).toBeNull()
  })

  it('respects size from signal', () => {
    const result = updatePosition(null, longSignal({ size: 0.5 }), bar(), 0, 10000, defaultOptions)

    expect(result.position!.size).toBe(0.5)
    expect(result.position!.quantity).toBeCloseTo(5000 / 102)
  })
})

describe('updatePosition — LONG state', () => {
  const longPos: Position = {
    side: 'long',
    entryPrice: 100,
    quantity: 100,
    size: 1,
    entryIndex: 0,
  }

  it('holds on hold signal', () => {
    const result = updatePosition(longPos, holdSignal(), bar(), 1, 10000, defaultOptions)
    expect(result.position).toBe(longPos)
    expect(result.closedTrade).toBeNull()
  })

  it('holds on long signal', () => {
    const result = updatePosition(longPos, longSignal(), bar(), 1, 10000, defaultOptions)
    expect(result.position).toBe(longPos)
    expect(result.closedTrade).toBeNull()
  })

  it('closes on close signal', () => {
    const result = updatePosition(longPos, closeSignal(), bar({ c: 110 }), 1, 10000, defaultOptions)

    expect(result.position).toBeNull()
    expect(result.closedTrade).not.toBeNull()
    expect(result.closedTrade!.side).toBe('long')
    expect(result.closedTrade!.pnl).toBeCloseTo((110 - 100) * 100) // +1000
    expect(result.closedTrade!.exitReason).toBe('signal')
  })

  it('reverses to short on short signal', () => {
    const result = updatePosition(longPos, shortSignal(), bar({ c: 110 }), 1, 10000, defaultOptions)

    expect(result.closedTrade).not.toBeNull()
    expect(result.closedTrade!.side).toBe('long')
    expect(result.closedTrade!.pnl).toBeCloseTo(1000)

    expect(result.position).not.toBeNull()
    expect(result.position!.side).toBe('short')
  })

  it('just closes long on short signal when allowShort is false', () => {
    const opts = { ...defaultOptions, allowShort: false }
    const result = updatePosition(longPos, shortSignal(), bar({ c: 110 }), 1, 10000, opts)

    expect(result.closedTrade).not.toBeNull()
    expect(result.position).toBeNull()
  })
})

describe('updatePosition — SHORT state', () => {
  const shortPos: Position = {
    side: 'short',
    entryPrice: 100,
    quantity: 100,
    size: 1,
    entryIndex: 0,
  }

  it('holds on hold signal', () => {
    const result = updatePosition(shortPos, holdSignal(), bar(), 1, 10000, defaultOptions)
    expect(result.position).toBe(shortPos)
    expect(result.closedTrade).toBeNull()
  })

  it('holds on short signal', () => {
    const result = updatePosition(shortPos, shortSignal(), bar(), 1, 10000, defaultOptions)
    expect(result.position).toBe(shortPos)
    expect(result.closedTrade).toBeNull()
  })

  it('closes on close signal', () => {
    const result = updatePosition(shortPos, closeSignal(), bar({ c: 90 }), 1, 10000, defaultOptions)

    expect(result.position).toBeNull()
    expect(result.closedTrade).not.toBeNull()
    expect(result.closedTrade!.side).toBe('short')
    expect(result.closedTrade!.pnl).toBeCloseTo((100 - 90) * 100) // +1000
    expect(result.closedTrade!.exitReason).toBe('signal')
  })

  it('reverses to long on long signal', () => {
    const result = updatePosition(shortPos, longSignal(), bar({ c: 90 }), 1, 10000, defaultOptions)

    expect(result.closedTrade).not.toBeNull()
    expect(result.closedTrade!.side).toBe('short')
    expect(result.closedTrade!.pnl).toBeCloseTo(1000)

    expect(result.position).not.toBeNull()
    expect(result.position!.side).toBe('long')
  })
})

describe('updatePosition — stop loss', () => {
  it('triggers stop loss for long position', () => {
    const pos: Position = {
      side: 'long',
      entryPrice: 100,
      quantity: 100,
      size: 1,
      entryIndex: 0,
      stopLoss: 96,
    }
    // bar.l = 95 triggers SL at 96
    const result = updatePosition(pos, longSignal(), bar({ l: 95 }), 1, 10000, defaultOptions)

    expect(result.closedTrade).not.toBeNull()
    expect(result.closedTrade!.exitReason).toBe('stop_loss')
    expect(result.closedTrade!.exitPrice).toBe(96)
    expect(result.closedTrade!.pnl).toBeCloseTo((96 - 100) * 100) // -400
    expect(result.position).toBeNull()
  })

  it('triggers stop loss for short position', () => {
    const pos: Position = {
      side: 'short',
      entryPrice: 100,
      quantity: 100,
      size: 1,
      entryIndex: 0,
      stopLoss: 104,
    }
    // bar.h = 105 triggers SL at 104
    const result = updatePosition(pos, shortSignal(), bar({ h: 105 }), 1, 10000, defaultOptions)

    expect(result.closedTrade).not.toBeNull()
    expect(result.closedTrade!.exitReason).toBe('stop_loss')
    expect(result.closedTrade!.exitPrice).toBe(104)
    expect(result.closedTrade!.pnl).toBeCloseTo((100 - 104) * 100) // -400
    expect(result.position).toBeNull()
  })

  it('ignores signal when SL triggers', () => {
    const pos: Position = {
      side: 'long',
      entryPrice: 100,
      quantity: 100,
      size: 1,
      entryIndex: 0,
      stopLoss: 96,
    }
    // SL triggers, short signal is ignored (no new position opened)
    const result = updatePosition(pos, shortSignal(), bar({ l: 95 }), 1, 10000, defaultOptions)

    expect(result.closedTrade!.exitReason).toBe('stop_loss')
    expect(result.position).toBeNull()
  })
})

describe('updatePosition — take profit', () => {
  it('triggers take profit for long position', () => {
    const pos: Position = {
      side: 'long',
      entryPrice: 100,
      quantity: 100,
      size: 1,
      entryIndex: 0,
      takeProfit: 110,
    }
    const result = updatePosition(pos, holdSignal(), bar({ h: 112 }), 1, 10000, defaultOptions)

    expect(result.closedTrade).not.toBeNull()
    expect(result.closedTrade!.exitReason).toBe('take_profit')
    expect(result.closedTrade!.exitPrice).toBe(110)
    expect(result.closedTrade!.pnl).toBeCloseTo((110 - 100) * 100) // +1000
    expect(result.position).toBeNull()
  })

  it('triggers take profit for short position', () => {
    const pos: Position = {
      side: 'short',
      entryPrice: 100,
      quantity: 100,
      size: 1,
      entryIndex: 0,
      takeProfit: 90,
    }
    const result = updatePosition(pos, holdSignal(), bar({ l: 88 }), 1, 10000, defaultOptions)

    expect(result.closedTrade).not.toBeNull()
    expect(result.closedTrade!.exitReason).toBe('take_profit')
    expect(result.closedTrade!.exitPrice).toBe(90)
    expect(result.closedTrade!.pnl).toBeCloseTo((100 - 90) * 100)
    expect(result.position).toBeNull()
  })

  it('checks SL before TP', () => {
    const pos: Position = {
      side: 'long',
      entryPrice: 100,
      quantity: 100,
      size: 1,
      entryIndex: 0,
      stopLoss: 96,
      takeProfit: 110,
    }
    // Both SL and TP would trigger in same bar — SL takes priority
    const result = updatePosition(pos, holdSignal(), bar({ l: 95, h: 112 }), 1, 10000, defaultOptions)

    expect(result.closedTrade!.exitReason).toBe('stop_loss')
  })
})

describe('updatePosition — commission and slippage', () => {
  it('applies commission to PnL', () => {
    const opts: BacktestOptions = { ...defaultOptions, commissionRate: 0.001 }
    const pos: Position = {
      side: 'long',
      entryPrice: 100,
      quantity: 100,
      size: 1,
      entryIndex: 0,
    }
    const result = updatePosition(pos, closeSignal(), bar({ c: 110 }), 1, 10000, opts)
    const trade = result.closedTrade!

    // gross pnl = (110 - 100) * 100 = 1000
    // entry commission = 100 * 100 * 0.001 = 10
    // exit commission = 110 * 100 * 0.001 = 11
    // net pnl = 1000 - 10 - 11 = 979
    expect(trade.pnl).toBeCloseTo(979)
  })

  it('applies slippage to entry and exit prices', () => {
    const opts: BacktestOptions = { ...defaultOptions, slippageRate: 0.01 }

    // Open long: entry price should be higher (buy slippage)
    const openResult = updatePosition(null, longSignal(), bar({ c: 100 }), 0, 10000, opts)
    expect(openResult.position!.entryPrice).toBeCloseTo(101) // 100 * 1.01

    // Close long: exit price should be lower (sell slippage)
    const closeResult = updatePosition(openResult.position!, closeSignal(), bar({ c: 110 }), 1, 10000, opts)
    expect(closeResult.closedTrade!.exitPrice).toBeCloseTo(108.9) // 110 * 0.99
  })
})

describe('closePositionAtEnd', () => {
  it('closes position with end_of_data reason', () => {
    const pos: Position = {
      side: 'long',
      entryPrice: 100,
      quantity: 100,
      size: 1,
      entryIndex: 0,
    }
    const trade = closePositionAtEnd(pos, bar({ c: 105 }), 5, defaultOptions)

    expect(trade.exitReason).toBe('end_of_data')
    expect(trade.exitPrice).toBe(105)
    expect(trade.exitIndex).toBe(5)
    expect(trade.pnl).toBeCloseTo(500)
  })
})
