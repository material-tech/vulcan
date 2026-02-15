import type { CreateSignalOptions, TechnicalSignal, Unarray } from './types'
import { defu } from 'defu'

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function transpose<T extends Record<string, unknown>>(items: T[]): { [K in keyof T]: T[K][] } {
  const result = {} as Record<string, unknown[]>
  for (const item of items) {
    for (const key of Object.keys(item)) {
      ;(result[key] ??= []).push(item[key])
    }
  }
  return result as { [K in keyof T]: T[K][] }
}

/**
 * Create a technical signal with batch compute and streaming support.
 * When `compute` is omitted, it is auto-derived from `stream` via `data.map(streamFn)`.
 */
export function createSignal<Data, Result, Options extends Record<string, any>>(
  config: CreateSignalOptions<Data, Result, Options>,
): TechnicalSignal<Data, Result, Options> {
  const { compute, stream: createStream, defaultOptions } = config

  function impl(dataset: Data[], options?: Partial<Options>) {
    if (dataset.length === 0) {
      return [] as Result
    }
    const opt = defu(options, defaultOptions) as Required<Options>
    if (compute) {
      return compute(dataset, opt)
    }
    // Auto-derive from stream
    const streamFn = createStream(opt)
    const results = dataset.map(streamFn)
    const first = results[0]
    if (isPlainObject(first)) {
      return transpose(results as Record<string, unknown>[]) as Result
    }
    return results as Result
  }

  impl.stream = (options?: Partial<Options>) => {
    const opt = defu(options, defaultOptions) as Required<Options>
    return createStream(opt)
  }

  impl.toTransformStream = (options?: Partial<Options>) => {
    const streamFn = impl.stream(options)
    return new TransformStream<Data, Unarray<Result>>({
      transform(chunk: Data, controller) {
        controller.enqueue(streamFn(chunk))
      },
    })
  }

  Object.defineProperty(impl, 'defaultOptions', {
    get() {
      return defu(defaultOptions)
    },
  })

  return impl as TechnicalSignal<Data, Result, Options>
}
