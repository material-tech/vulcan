import type { IndicatorGenerator, Processor } from '@material-tech/alloy-core'

/** Wrap an IndicatorGenerator to accept an array and return an array */
export function batch<I, O, Opts extends Record<string, any>>(
  indicator: IndicatorGenerator<I, O, Opts>,
): (source: I[], options?: Partial<Opts>) => O[] {
  return (source, options) => Array.from(indicator(source, options))
}

/** Process an array through a Processor, returning result array */
export function batchProcess<I, O>(
  processor: Processor<I, O>,
  source: I[],
): O[] {
  return source.map(processor)
}
