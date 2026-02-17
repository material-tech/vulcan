import { batch, batchProcess } from '@material-tech/alloy-adapters/batch'
import { createSignal } from '@material-tech/alloy-core'
import { describe, expect, it } from 'vitest'

describe('batch', () => {
  it('should wrap an indicator generator to process arrays', () => {
    const double = createSignal(
      () => (v: number) => v * 2,
    )
    const batchDouble = batch(double)
    expect(batchDouble([1, 2, 3])).toEqual([2, 4, 6])
  })

  it('should pass options to the indicator', () => {
    const multiply = createSignal(
      (opts: Required<{ factor: number }>) => (v: number) => v * opts.factor,
      { factor: 2 },
    )
    const batchMultiply = batch(multiply)
    expect(batchMultiply([1, 2, 3], { factor: 10 })).toEqual([10, 20, 30])
  })

  it('should return empty array for empty input', () => {
    const identity = createSignal(
      () => (v: number) => v,
    )
    const batchIdentity = batch(identity)
    expect(batchIdentity([])).toEqual([])
  })
})

describe('batchProcess', () => {
  it('should process an array through a processor', () => {
    const double = createSignal(
      () => (v: number) => v * 2,
    )
    const processor = double.create()
    expect(batchProcess(processor, [1, 2, 3])).toEqual([2, 4, 6])
  })

  it('should maintain stateful processing', () => {
    const cumSum = createSignal(
      () => {
        let sum = 0
        return (v: number) => {
          sum += v
          return sum
        }
      },
    )
    const processor = cumSum.create()
    expect(batchProcess(processor, [1, 2, 3])).toEqual([1, 3, 6])
  })
})
