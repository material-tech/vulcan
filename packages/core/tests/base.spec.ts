import { describe, expect, it } from 'vitest'
import { collect, createSignal } from '../src/index'

describe('createSignal', () => {
  it('should create a generator function with createProcessor and defaultOptions', () => {
    const gen = createSignal(
      () => (v: number) => v * 2,
      { factor: 1 },
    )

    expect(gen).instanceOf(Function)
    expect(gen.create).instanceOf(Function)
    expect(gen.defaultOptions).toEqual({ factor: 1 })
  })

  it('should yield transformed values from source', () => {
    const gen = createSignal(
      () => (v: number) => v * 2,
    )

    const result = collect(gen([1, 2, 3]))
    expect(result).toEqual([2, 4, 6])
  })

  it('should return empty array when source is empty', () => {
    const gen = createSignal(
      () => (v: number) => v,
    )

    expect(collect(gen([]))).toEqual([])
  })

  it('should merge options with defaults', () => {
    const gen = createSignal(
      (opts: Required<{ multiplier: number }>) => (v: number) => v * opts.multiplier,
      { multiplier: 2 },
    )

    expect(collect(gen([3]))).toEqual([6])
    expect(collect(gen([3], { multiplier: 10 }))).toEqual([30])
  })

  it('should create independent processors via createProcessor', () => {
    const gen = createSignal(
      () => {
        let sum = 0
        return (v: number) => {
          sum += v
          return sum
        }
      },
    )

    const p1 = gen.create()
    const p2 = gen.create()

    expect(p1(1)).toBe(1)
    expect(p1(2)).toBe(3)
    expect(p2(10)).toBe(10)
  })

  it('should apply options override in create()', () => {
    const gen = createSignal(
      (opts: Required<{ multiplier: number }>) => (v: number) => v * opts.multiplier,
      { multiplier: 2 },
    )

    const p = gen.create({ multiplier: 5 })
    expect(p(3)).toBe(15)
  })

  it('should return empty object when no defaultOptions provided', () => {
    const gen = createSignal(
      () => (v: number) => v,
    )

    expect(gen.defaultOptions).toEqual({})
  })

  it('should return a shallow copy from defaultOptions getter', () => {
    const gen = createSignal(
      () => (v: number) => v,
      { period: 14 },
    )

    const opts = gen.defaultOptions
    opts.period = 999

    expect(gen.defaultOptions).toEqual({ period: 14 })
  })

  it('should work with for...of iteration', () => {
    const gen = createSignal(
      () => (v: number) => v + 1,
    )

    const result: number[] = []
    for (const v of gen([10, 20])) {
      result.push(v)
    }

    expect(result).toEqual([11, 21])
  })
})

describe('collect', () => {
  it('should collect generator values into an array', () => {
    function* gen() {
      yield 1
      yield 2
      yield 3
    }
    expect(collect(gen())).toEqual([1, 2, 3])
  })

  it('should collect from an array', () => {
    expect(collect([4, 5, 6])).toEqual([4, 5, 6])
  })

  it('should collect from a Set', () => {
    expect(collect(new Set([1, 2, 3]))).toEqual([1, 2, 3])
  })

  it('should return empty array for empty iterable', () => {
    expect(collect([])).toEqual([])
  })
})
