import type { IndicatorGenerator, Processor } from '@material-tech/alloy-core'
import { Transform } from 'node:stream'

/** Create a Node.js Transform stream (object mode) from an IndicatorGenerator */
export function toNodeStream<I, O, Opts extends Record<string, any>>(
  indicator: IndicatorGenerator<I, O, Opts>,
  options?: Partial<Opts>,
): Transform {
  const processor = indicator.create(options)
  return new Transform({
    objectMode: true,
    transform(chunk: I, _encoding, callback) {
      try {
        callback(null, processor(chunk))
      }
      catch (error) {
        callback(error as Error)
      }
    },
  })
}

/** Create a Node.js Transform stream from a Processor */
export function processorToNodeStream<I, O>(
  processor: Processor<I, O>,
): Transform {
  return new Transform({
    objectMode: true,
    transform(chunk: I, _encoding, callback) {
      try {
        callback(null, processor(chunk))
      }
      catch (error) {
        callback(error as Error)
      }
    },
  })
}
