import { describe, expect, it } from 'vitest'
import { createSignal } from './base'

describe('createSignal', () => {
  it('should create a TechnicalSignal instance', () => {
    const signal = createSignal(() => void 0)

    expect(signal).toHaveProperty('update')
    expect(signal).toHaveProperty('result')
    expect(signal).toHaveProperty('dataset')
    expect(signal).toHaveProperty('defaultOptions')
    expect(signal).instanceOf(Function)
  })

  it('should get default options', () => {
    const signal = createSignal(() => void 0, { foo: 'bar' })

    expect(signal.defaultOptions).toEqual({ foo: 'bar' })
  })

  it('should update inner dataset', () => {
    const signal = createSignal(() => void 0)

    expect(signal.dataset).toEqual([])
    signal.update(1, 2, 3)
    expect(signal.dataset).toEqual([1, 2, 3])
    signal.update([4, 5, 6])
    expect(signal.dataset).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('should return result', () => {
    const signal = createSignal(v => v)

    expect(signal.result()).toEqual([])
    signal.update(1, 2, 3)
    expect(signal.result()).toEqual([1, 2, 3])
  })

  it('should return result by call directly', () => {
    const signal = createSignal(v => v)

    expect(signal([1, 2, 3])).toEqual([1, 2, 3])
  })
})
