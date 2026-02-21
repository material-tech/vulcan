import { collect } from '@vulcan-js/core'
import { since } from '@vulcan-js/indicators'
import { describe, expect, it } from 'vitest'

describe('since', () => {
  it('should count periods since value changed', () => {
    const values = [1, 1, 1, 2, 2, 3, 3, 3, 3]
    const result = collect(since(values))
    const expected = [0, 1, 2, 0, 1, 0, 1, 2, 3]

    expect(result).toMatchNumberArray(expected)
  })

  it('should return 0 for each value when all values are different', () => {
    const values = [1, 2, 3, 4, 5]
    const result = collect(since(values))
    const expected = [0, 0, 0, 0, 0]

    expect(result).toMatchNumberArray(expected)
  })

  it('should count continuously when all values are the same', () => {
    const values = [5, 5, 5, 5, 5]
    const result = collect(since(values))
    const expected = [0, 1, 2, 3, 4]

    expect(result).toMatchNumberArray(expected)
  })

  it('should handle single value', () => {
    const values = [42]
    const result = collect(since(values))
    const expected = [0]

    expect(result).toMatchNumberArray(expected)
  })

  it('should handle decimal values', () => {
    const values = [1.5, 1.5, 2.5, 2.5, 2.5, 1.5]
    const result = collect(since(values))
    const expected = [0, 1, 0, 1, 2, 0]

    expect(result).toMatchNumberArray(expected)
  })

  it('should work with stateful processor via .create()', () => {
    const process = since.create()

    expect(process(10)).toMatchNumber(0)
    expect(process(10)).toMatchNumber(1)
    expect(process(10)).toMatchNumber(2)
    expect(process(20)).toMatchNumber(0)
    expect(process(20)).toMatchNumber(1)
    expect(process(10)).toMatchNumber(0)
  })
})
