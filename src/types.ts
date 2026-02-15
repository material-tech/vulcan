import type { Numberish } from 'dnum'

/**
 * Unwrap array types from a result type.
 * - `Dnum[]` → `Dnum`
 * - `{ macd: Dnum[], signal: Dnum[] }` → `{ macd: Dnum, signal: Dnum }`
 */
export type Unarray<T> = T extends readonly (infer U)[]
  ? U
  : { [K in keyof T]: T[K] extends readonly (infer U)[] ? U : T[K] }

/**
 * Wrap an element type into a batch result type (inverse of Unarray).
 * - `Dnum` → `Dnum[]`
 * - `{ macd: Dnum, signal: Dnum }` → `{ macd: Dnum[], signal: Dnum[] }`
 * - `number` → `number[]`
 */
export type WrapResult<T> = T extends readonly any[]
  ? T[]
  : T extends Record<string, any>
    ? { [K in keyof T]: T[K][] }
    : T[]

export interface TechnicalSignal<Data, Result, Options extends Record<string, any>> {
  readonly defaultOptions: Options
  (dataset: Data[], options?: Partial<Options>): Result
  stream: (options?: Partial<Options>) => (data: Data) => Unarray<Result>
  toTransformStream: (options?: Partial<Options>) => TransformStream<Data, Unarray<Result>>
}

export interface CreateSignalFunc<Data, Result, Options extends Record<string, any>> {
  (dataset: Data[], options: Required<Options>): Result
}

export interface CreateStreamFunc<Data, Result, Options extends Record<string, any>> {
  (options: Required<Options>): (data: Data) => Unarray<Result>
}

export interface CreateSignalConfig<Data, Element, Options extends Record<string, any>> {
  compute?: (dataset: Data[], options: Required<Options>) => WrapResult<Element>
  stream: (options: Required<Options>) => (data: Data) => Element
  defaultOptions?: Options
}

/** @deprecated Use CreateSignalConfig instead */
export type CreateSignalOptions<Data, Element, Options extends Record<string, any>> = CreateSignalConfig<Data, Element, Options>

export interface KlineData {
  /** High price */
  h: Numberish
  /** Low price */
  l: Numberish
  /** Open price */
  o: Numberish
  /** Close price */
  c: Numberish
  /** Volume */
  v: Numberish
  /** Timestamp */
  timestamp?: number | Date | string
}

type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}

export type RequiredProperties<T, K extends keyof T> = Prettify<{
  [P in K]-?: T[P]
}>
