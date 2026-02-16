import { describe, expect, it } from 'vitest'
import { mapPick } from '~/helpers/array'

describe('mapPick', () => {
  it('should extract and transform a field from object arrays', () => {
    const data = [
      { h: 10, l: 5 },
      { h: 20, l: 15 },
      { h: 30, l: 25 },
    ]
    const result = mapPick(data, 'h', v => v * 2)
    expect(result).toEqual([20, 40, 60])
  })

  it('should work with identity transform', () => {
    const data = [{ name: 'a' }, { name: 'b' }]
    const result = mapPick(data, 'name', v => v)
    expect(result).toEqual(['a', 'b'])
  })

  it('should return empty array for empty input', () => {
    const result = mapPick([], 'x' as never, v => v)
    expect(result).toEqual([])
  })
})
