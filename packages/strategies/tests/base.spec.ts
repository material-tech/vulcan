import type { StrategySignal } from '@vulcan-js/strategies'
import { collect } from '@vulcan-js/core'
import { createStrategy } from '@vulcan-js/strategies'
import { describe, expect, it } from 'vitest'

function bar(c: number, h = c, l = c, o = c, v = 100) {
  return { h, l, o, c, v }
}

describe('createStrategy', () => {
  const hold: StrategySignal = { action: 'hold' }

  const dummyStrategy = createStrategy(
    () => (ctx) => {
      if (ctx.index === 0)
        return { action: 'long', reason: 'first bar' }
      return hold
    },
    { windowSize: 3 },
  )

  it('should create a generator function with .create() and .defaultOptions', () => {
    expect(dummyStrategy).toBeInstanceOf(Function)
    expect(dummyStrategy.create).toBeInstanceOf(Function)
    expect(dummyStrategy.defaultOptions).toEqual({ windowSize: 3 })
  })

  it('should yield strategy signals from source', () => {
    const bars = [bar(1), bar(2), bar(3)]
    const result = collect(dummyStrategy(bars))

    expect(result).toEqual([
      { action: 'long', reason: 'first bar' },
      hold,
      hold,
    ])
  })

  it('should create independent processors via .create()', () => {
    const counterStrategy = createStrategy(
      () => {
        let count = 0
        return () => {
          count++
          return { action: 'hold' as const, reason: String(count) }
        }
      },
      { windowSize: 2 },
    )

    const p1 = counterStrategy.create()
    const p2 = counterStrategy.create()

    expect(p1(bar(1)).reason).toBe('1')
    expect(p1(bar(2)).reason).toBe('2')
    expect(p2(bar(1)).reason).toBe('1') // independent state
  })

  it('should respect windowSize and limit bars in context', () => {
    const windowCapture = createStrategy(
      () => (ctx) => {
        return { action: 'hold', reason: String(ctx.bars.length) }
      },
      { windowSize: 2 },
    )

    const bars = [bar(1), bar(2), bar(3), bar(4)]
    const result = collect(windowCapture(bars))

    expect(result.map(s => s.reason)).toEqual(['1', '2', '2', '2'])
  })

  it('should provide bars in oldest-first order', () => {
    const barCapture = createStrategy(
      () => (ctx) => {
        const closes = ctx.bars.map(b => Number(b.c))
        return { action: 'hold', reason: closes.join(',') }
      },
      { windowSize: 3 },
    )

    const bars = [bar(10), bar(20), bar(30), bar(40), bar(50)]
    const result = collect(barCapture(bars))

    expect(result[0].reason).toBe('10')
    expect(result[1].reason).toBe('10,20')
    expect(result[2].reason).toBe('10,20,30')
    expect(result[3].reason).toBe('20,30,40') // oldest (10) dropped
    expect(result[4].reason).toBe('30,40,50')
  })

  it('should increment index on each bar', () => {
    const indexCapture = createStrategy(
      () => (ctx) => {
        return { action: 'hold', reason: String(ctx.index) }
      },
      { windowSize: 2 },
    )

    const bars = [bar(1), bar(2), bar(3)]
    const result = collect(indexCapture(bars))

    expect(result.map(s => s.reason)).toEqual(['0', '1', '2'])
  })

  it('should merge options with defaults', () => {
    const windowCapture = createStrategy(
      () => (ctx) => {
        return { action: 'hold', reason: String(ctx.bars.length) }
      },
      { windowSize: 5 },
    )

    // Override windowSize to 2
    const bars = [bar(1), bar(2), bar(3)]
    const result = collect(windowCapture(bars, { windowSize: 2 }))

    expect(result.map(s => s.reason)).toEqual(['1', '2', '2'])
  })

  it('should not mutate defaultOptions', () => {
    const opts = dummyStrategy.defaultOptions
    opts.windowSize = 999

    expect(dummyStrategy.defaultOptions).toEqual({ windowSize: 3 })
  })

  it('should pass the current bar directly in context', () => {
    const barCheck = createStrategy(
      () => (ctx) => {
        return { action: 'hold', reason: String(ctx.bar.c) }
      },
      { windowSize: 2 },
    )

    const bars = [bar(42), bar(99)]
    const result = collect(barCheck(bars))

    expect(result[0].reason).toBe('42')
    expect(result[1].reason).toBe('99')
  })

  it('should return empty array when source is empty', () => {
    expect(collect(dummyStrategy([]))).toEqual([])
  })

  it('should work with for...of iteration', () => {
    const bars = [bar(1), bar(2)]
    const result: StrategySignal[] = []

    for (const signal of dummyStrategy(bars)) {
      result.push(signal)
    }

    expect(result).toHaveLength(2)
  })
})
