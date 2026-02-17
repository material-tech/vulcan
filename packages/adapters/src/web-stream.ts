import type { Processor, SignalGenerator } from '@material-tech/alloy-core'

/** Create a Web TransformStream from an SignalGenerator */
export function toWebStream<I, O, Opts extends Record<string, any>>(
  indicator: SignalGenerator<I, O, Opts>,
  options?: Partial<Opts>,
): TransformStream<I, O> {
  const processor = indicator.create(options)
  return new TransformStream<I, O>({
    transform(chunk, controller) {
      try {
        controller.enqueue(processor(chunk))
      }
      catch (e) {
        controller.error(e)
      }
    },
  })
}

/** Create a Web TransformStream from a Processor */
export function processorToWebStream<I, O>(
  processor: Processor<I, O>,
): TransformStream<I, O> {
  return new TransformStream<I, O>({
    transform(chunk, controller) {
      try {
        controller.enqueue(processor(chunk))
      }
      catch (e) {
        controller.error(e)
      }
    },
  })
}
