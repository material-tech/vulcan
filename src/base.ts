import type { CreateSignalOptions, TechnicalSignal, Unarray } from './types'
import { defu } from 'defu'

/**
 * Create a technical signal with batch compute and streaming support
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
    return compute(dataset, opt)
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
