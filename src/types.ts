import type { Numberish } from 'dnum'

export type Processor<Input, Output> = (value: Input) => Output

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
