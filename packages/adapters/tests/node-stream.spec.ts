import { Readable } from 'node:stream'
import { processorToNodeStream, toNodeStream } from '@material-tech/alloy-adapters/node-stream'
import { createSignal } from '@material-tech/alloy-core'
import { describe, expect, it } from 'vitest'

function collectStream<T>(stream: Readable): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const chunks: T[] = []
    stream.on('data', (chunk: T) => chunks.push(chunk))
    stream.on('end', () => resolve(chunks))
    stream.on('error', reject)
  })
}

describe('toNodeStream', () => {
  it('should create a Transform stream from an indicator', async () => {
    const double = createSignal(
      () => (v: number) => v * 2,
    )
    const transform = toNodeStream(double)
    const input = Readable.from([1, 2, 3])
    const result = await collectStream<number>(input.pipe(transform))
    expect(result).toEqual([2, 4, 6])
  })

  it('should pass options to the indicator', async () => {
    const multiply = createSignal(
      (opts: Required<{ factor: number }>) => (v: number) => v * opts.factor,
      { factor: 2 },
    )
    const transform = toNodeStream(multiply, { factor: 5 })
    const input = Readable.from([1, 2, 3])
    const result = await collectStream<number>(input.pipe(transform))
    expect(result).toEqual([5, 10, 15])
  })
})

describe('processorToNodeStream', () => {
  it('should create a Transform stream from a processor', async () => {
    const double = createSignal(
      () => (v: number) => v * 2,
    )
    const processor = double.create()
    const transform = processorToNodeStream(processor)
    const input = Readable.from([10, 20, 30])
    const result = await collectStream<number>(input.pipe(transform))
    expect(result).toEqual([20, 40, 60])
  })
})
