import { describe, expect, it } from 'vitest'
import { assert } from '../src/index'

describe('assert', () => {
  it('should not throw for truthy conditions', () => {
    expect(() => assert(true, 'fail')).not.toThrow()
    expect(() => assert(1, 'fail')).not.toThrow()
    expect(() => assert('non-empty', 'fail')).not.toThrow()
    expect(() => assert({}, 'fail')).not.toThrow()
  })

  it('should throw Error with string message', () => {
    expect(() => assert(false, 'something went wrong')).toThrow(Error)
    expect(() => assert(false, 'something went wrong')).toThrow('something went wrong')
  })

  it('should throw for all falsy values', () => {
    expect(() => assert(0, 'zero')).toThrow('zero')
    expect(() => assert('', 'empty string')).toThrow('empty string')
    expect(() => assert(null, 'null')).toThrow('null')
    expect(() => assert(undefined, 'undefined')).toThrow('undefined')
  })

  it('should throw custom Error instance', () => {
    const error = new RangeError('out of range')
    expect(() => assert(false, error)).toThrow(RangeError)
    expect(() => assert(false, error)).toThrow('out of range')
  })

  it('should throw custom TypeError instance', () => {
    expect(() => assert(false, new TypeError('invalid type'))).toThrow(TypeError)
    expect(() => assert(false, new TypeError('invalid type'))).toThrow('invalid type')
  })
})
