import { toNumber } from 'dnum'
import { describe, expect, it } from 'vitest'
import { createSignal } from '../src/base'

describe('createSignal', () => {
  const signal = createSignal({
    compute: (v: number[]) => v,
    stream: () => (v: number) => v,
  })

  it('should create a TechnicalSignal instance', () => {
    expect(signal).toHaveProperty('defaultOptions')
    expect(signal).instanceOf(Function)
  })

  it('should get default options', () => {
    const signal = createSignal({
      compute: () => void 0,
      stream: () => () => void 0,
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

  it('should return stream function', () => {
    const next = signal.stream()
    expect(next).instanceOf(Function)
    expect(next(42)).toBe(42)
  })

  it('should return TransformStream', async () => {
    const { from } = await import('dnum')
    const addOne = createSignal({
      compute: (v: number[]) => v.map(x => from(x + 1)),
      stream: () => (v: number) => from(v + 1),
    })

    const transform = addOne.toTransformStream()
    const reader = transform.readable.getReader()
    const writer = transform.writable.getWriter()

    const read1 = reader.read()
    writer.write(1)
    const { value } = await read1
    expect(toNumber(value!)).toBe(2)

    const read2 = reader.read()
    writer.write(5)
    const { value: value2 } = await read2
    expect(toNumber(value2!)).toBe(6)

    writer.close()
  })
})
