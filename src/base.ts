import type { CreateSignalOptions, TechnicalSignal, WrapResult } from './types'
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
export function createSignal<Data, Element, Options extends Record<string, any>>(
  config: CreateSignalOptions<Data, Element, Options>,
): TechnicalSignal<Data, WrapResult<Element>, Options> {
  const { compute, stream: createStream, defaultOptions } = config

  function impl(dataset: Data[], options?: Partial<Options>) {
    if (dataset.length === 0) {
      return [] as unknown as WrapResult<Element>
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
      return transpose(results as Record<string, unknown>[]) as WrapResult<Element>
    }
    return results as WrapResult<Element>
  }

  impl.stream = (options?: Partial<Options>) => {
    const opt = defu(options, defaultOptions) as Required<Options>
    return createStream(opt)
  }

  impl.toTransformStream = (options?: Partial<Options>) => {
    const streamFn = impl.stream(options)
    return new TransformStream<Data, Element>({
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

  return impl as TechnicalSignal<Data, WrapResult<Element>, Options>
}
