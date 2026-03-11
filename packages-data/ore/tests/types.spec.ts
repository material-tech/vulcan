import {
  ExchangeError,
  RateLimitError,
  WebSocketError,
} from '@vulcan-js/ore'
import { describe, expect, it } from 'vitest'

describe('exchangeError', () => {
  it('should create ExchangeError with message only', () => {
    const error = new ExchangeError('Something went wrong')

    expect(error.message).toBe('Something went wrong')
    expect(error.name).toBe('ExchangeError')
    expect(error.code).toBeUndefined()
    expect(error.exchange).toBeUndefined()
  })

  it('should create ExchangeError with code', () => {
    const error = new ExchangeError('Invalid symbol', 'INVALID_SYMBOL')

    expect(error.message).toBe('Invalid symbol')
    expect(error.code).toBe('INVALID_SYMBOL')
    expect(error.exchange).toBeUndefined()
  })

  it('should create ExchangeError with code and exchange', () => {
    const error = new ExchangeError('API Error', 'RATE_LIMIT', 'binance')

    expect(error.message).toBe('API Error')
    expect(error.code).toBe('RATE_LIMIT')
    expect(error.exchange).toBe('binance')
  })

  it('should be instanceof Error', () => {
    const error = new ExchangeError('Test')
    expect(error).toBeInstanceOf(Error)
  })
})

describe('rateLimitError', () => {
  it('should create RateLimitError with required fields', () => {
    const error = new RateLimitError('Too many requests', 5000)

    expect(error.message).toBe('Too many requests')
    expect(error.retryAfter).toBe(5000)
    expect(error.code).toBe('RATE_LIMIT')
    expect(error.name).toBe('RateLimitError')
  })

  it('should create RateLimitError with exchange', () => {
    const error = new RateLimitError('Rate limited', 30000, 'okx')

    expect(error.message).toBe('Rate limited')
    expect(error.retryAfter).toBe(30000)
    expect(error.exchange).toBe('okx')
  })

  it('should be instanceof ExchangeError', () => {
    const error = new RateLimitError('Test', 1000)
    expect(error).toBeInstanceOf(ExchangeError)
  })

  it('should be instanceof Error', () => {
    const error = new RateLimitError('Test', 1000)
    expect(error).toBeInstanceOf(Error)
  })
})

describe('webSocketError', () => {
  it('should create WebSocketError with message only', () => {
    const error = new WebSocketError('Connection failed')

    expect(error.message).toBe('Connection failed')
    expect(error.code).toBe('WEBSOCKET_ERROR')
    expect(error.name).toBe('WebSocketError')
  })

  it('should create WebSocketError with exchange', () => {
    const error = new WebSocketError('WebSocket closed unexpectedly', 'binance')

    expect(error.message).toBe('WebSocket closed unexpectedly')
    expect(error.exchange).toBe('binance')
    expect(error.code).toBe('WEBSOCKET_ERROR')
  })

  it('should be instanceof ExchangeError', () => {
    const error = new WebSocketError('Test')
    expect(error).toBeInstanceOf(ExchangeError)
  })

  it('should be instanceof Error', () => {
    const error = new WebSocketError('Test')
    expect(error).toBeInstanceOf(Error)
  })
})
