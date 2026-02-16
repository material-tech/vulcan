import { from, toNumber } from 'dnum'
import { describe, expect, it } from 'vitest'
import { createSignal } from '../src/base'

describe('createSignal', () => {
  const signal = createSignal({
    compute: (v: number[]) => v,
    step: () => (v: number) => v,
  })

  it('should create a TechnicalSignal instance', () => {
    expect(signal).toHaveProperty('defaultOptions')
    expect(signal).instanceOf(Function)
  })

  it('should get default options', () => {
    const signal = createSignal({
      step: () => () => void 0 as unknown,
      defaultOptions: { foo: 'bar' },
    })

    expect(signal.defaultOptions).toEqual({
      foo: 'bar',
    })
  })

  it('should get empty result when dataset is empty', () => {
    expect(signal([])).toEqual([])
  })

  it('should return result by call directly', () => {
    expect(signal([1, 2, 3])).toEqual([1, 2, 3])
  })

  it('should return step function', () => {
    const next = signal.next()
    expect(next).instanceOf(Function)
    expect(next(42)).toBe(42)
  })

  it('step should merge options with defaults', () => {
    const signal = createSignal({
      compute: (v: number[], { multiplier }: { multiplier: number }) =>
        v.map(x => x * multiplier),
      step: ({ multiplier }: { multiplier: number }) =>
        (v: number) => v * multiplier,
      defaultOptions: { multiplier: 2 },
    })

    // Use default options
    const next1 = signal.next()
    expect(next1(3)).toBe(6)

    // Override options
    const next2 = signal.next({ multiplier: 5 })
    expect(next2(3)).toBe(15)
  })
})

describe('createSignal auto-derive from step', () => {
  it('should auto-derive compute for scalar results', () => {
    const signal = createSignal({
      step: () => (v: number) => v * 2,
    })

    expect(signal([1, 2, 3])).toEqual([2, 4, 6])
  })

  it('should auto-derive compute for Dnum results', () => {
    const signal = createSignal({
      step: () => (v: number) => from(v, 18),
    })

    const result = signal([1, 2, 3])
    expect(result).toHaveLength(3)
    expect(toNumber(result[0])).toBe(1)
    expect(toNumber(result[1])).toBe(2)
    expect(toNumber(result[2])).toBe(3)
  })

  it('should not treat Dnum tuples as plain objects', () => {
    const signal = createSignal({
      step: () => (v: number) => from(v, 18),
    })

    // Dnum is [bigint, number] - Array.isArray returns true
    // so it should NOT be transposed
    const result = signal([42])
    expect(Array.isArray(result[0])).toBe(true)
    expect(toNumber(result[0])).toBe(42)
  })

  it('should auto-derive and transpose object results', () => {
    const signal = createSignal({
      step: () => (v: number) => ({ doubled: v * 2, tripled: v * 3 }),
    })

    const result = signal([1, 2, 3])
    expect(result.doubled).toEqual([2, 4, 6])
    expect(result.tripled).toEqual([3, 6, 9])
  })

  it('should return empty array for empty dataset', () => {
    const signal = createSignal({
      step: () => (v: number) => v,
    })

    expect(signal([])).toEqual([])
  })

  it('should merge options with defaults when auto-deriving', () => {
    const signal = createSignal({
      step: ({ factor }: { factor: number }) => (v: number) => v * factor,
      defaultOptions: { factor: 10 },
    })

    expect(signal([1, 2], { factor: 5 })).toEqual([5, 10])
    expect(signal([1, 2])).toEqual([10, 20])
  })

  it('should use explicit compute when provided (backward compat)', () => {
    const computeSpy = (v: number[]) => v.map(x => x + 100)
    const signal = createSignal({
      compute: computeSpy,
      step: () => (v: number) => v * 2,
    })

    // Should use compute, not step
    expect(signal([1, 2, 3])).toEqual([101, 102, 103])
  })
})
