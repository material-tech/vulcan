import type { BaseStrategyOptions, CandleData, Processor, StrategyContext, StrategyFactory, StrategyGenerator, StrategySignal } from './types'
import { assert } from '@vulcan-js/core'
import { defu } from 'defu'

/**
 * A fixed-capacity ring buffer with O(1) push and O(n) snapshot.
 */
function createRingBuffer<T>(capacity: number) {
  const buf: T[] = Array.from({ length: capacity })
  let head = 0
  let size = 0

  return {
    push(item: T) {
      buf[head] = item
      head = (head + 1) % capacity
      if (size < capacity)
        size++
    },
    toArray(): readonly T[] {
      if (size < capacity) {
        return buf.slice(0, size)
      }
      // head points to the oldest element when buffer is full
      return [...buf.slice(head), ...buf.slice(0, head)]
    },
    get size() {
      return size
    },
  }
}

/**
 * Create a generator-based strategy from a strategy factory.
 *
 * Mirrors `createSignal` from core, but manages a rolling window of bars
 * and constructs a `StrategyContext` for each evaluation.
 *
 * The returned generator is fully compatible with `SignalGenerator<CandleData, StrategySignal, Opts>`.
 */
export function createStrategy<Opts extends BaseStrategyOptions>(
  factory: StrategyFactory<Opts>,
  defaultOptions: Opts,
): StrategyGenerator<Opts> {
  function buildProcessor(options?: Partial<Opts>): Processor<CandleData, StrategySignal> {
    const opt = defu(options, defaultOptions) as Required<Opts>
    assert(Number.isInteger(opt.windowSize) && opt.windowSize >= 1, new RangeError(`Expected windowSize to be a positive integer, got ${opt.windowSize}`))
    const ring = createRingBuffer<CandleData>(opt.windowSize)
    const process = factory(opt)
    let index = 0
    return (bar: CandleData) => {
      ring.push(bar)
      const ctx: StrategyContext = { bar, bars: ring.toArray(), index }
      const signal = process(ctx)
      index++
      return signal
    }
  }

  function* generator(
    source: Iterable<CandleData>,
    options?: Partial<Opts>,
  ): Generator<StrategySignal, void, unknown> {
    const process = buildProcessor(options)
    for (const bar of source) {
      yield process(bar)
    }
  }

  generator.create = (options?: Partial<Opts>): Processor<CandleData, StrategySignal> => {
    return buildProcessor(options)
  }

  Object.defineProperty(generator, 'defaultOptions', {
    get() {
      return JSON.parse(JSON.stringify(defaultOptions))
    },
  })

  return generator as StrategyGenerator<Opts>
}
