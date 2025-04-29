import { describe, expect, it } from 'vitest'
import { createSignal, setDecimalOptions } from './base'

describe('createSignal', () => {
  it('should create a TechnicalSignal instance', () => {
    const signal = createSignal(() => void 0)

    expect(signal).toHaveProperty('defaultOptions')
    expect(signal).instanceOf(Function)
  })

  it('should get default options', () => {
    const signal = createSignal(() => void 0, { foo: 'bar' })

    expect(signal.defaultOptions).toEqual({
      foo: 'bar',
      decimals: 18,
      rounding: 'ROUND_HALF',
    })
  })

  it('should get empty result when dataset is empty', () => {
    const signal = createSignal(() => void 0)

    expect(signal([])).toEqual([])
  })

  it('should able to override default options', () => {
    const signal = createSignal((_, { decimals }) => decimals)

    expect(signal.defaultOptions.decimals).toEqual(18)
    setDecimalOptions({
      decimals: 14,
    })

    expect(signal.defaultOptions.decimals).toEqual(14)
  })

  it('should return result by call directly', () => {
    const signal = createSignal(v => v)

    expect(signal([1, 2, 3])).toEqual([1, 2, 3])
  })
})
