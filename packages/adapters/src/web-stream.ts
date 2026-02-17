import type { IndicatorGenerator, Processor } from '@material-tech/alloy-core'

/** Create a Web TransformStream from an IndicatorGenerator */
export function toWebStream<I, O, Opts extends Record<string, any>>(
  indicator: IndicatorGenerator<I, O, Opts>,
  options?: Partial<Opts>,
): TransformStream<I, O> {
  const processor = indicator.create(options)
  return new TransformStream<I, O>({
    transform(chunk, controller) {
      controller.enqueue(processor(chunk))
    },
  })
}

/** Create a Web TransformStream from a Processor */
export function processorToWebStream<I, O>(
  processor: Processor<I, O>,
): TransformStream<I, O> {
  return new TransformStream<I, O>({
    transform(chunk, controller) {
      controller.enqueue(processor(chunk))
    },
  })
}
