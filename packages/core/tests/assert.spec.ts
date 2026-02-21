import { describe, expect, it } from 'vitest'
import { assertPositiveInteger } from '../src/index'

describe('assertPositiveInteger', () => {
  it('should accept positive integers', () => {
    expect(() => assertPositiveInteger(1)).not.toThrow()
    expect(() => assertPositiveInteger(5)).not.toThrow()
    expect(() => assertPositiveInteger(100)).not.toThrow()
  })

  it('should reject zero', () => {
    expect(() => assertPositiveInteger(0)).toThrow(RangeError)
    expect(() => assertPositiveInteger(0)).toThrow('Expected period to be a positive integer, got 0')
  })

  it('should reject negative integers', () => {
    expect(() => assertPositiveInteger(-1)).toThrow(RangeError)
    expect(() => assertPositiveInteger(-5)).toThrow('Expected period to be a positive integer, got -5')
  })

  it('should reject non-integer numbers', () => {
    expect(() => assertPositiveInteger(1.5)).toThrow(RangeError)
    expect(() => assertPositiveInteger(0.5)).toThrow(RangeError)
  })

  it('should reject NaN and Infinity', () => {
    expect(() => assertPositiveInteger(Number.NaN)).toThrow(RangeError)
    expect(() => assertPositiveInteger(Number.POSITIVE_INFINITY)).toThrow(RangeError)
    expect(() => assertPositiveInteger(Number.NEGATIVE_INFINITY)).toThrow(RangeError)
  })

  it('should use custom name in error message', () => {
    expect(() => assertPositiveInteger(0, 'fastPeriod')).toThrow(
      'Expected fastPeriod to be a positive integer, got 0',
    )
  })
})
