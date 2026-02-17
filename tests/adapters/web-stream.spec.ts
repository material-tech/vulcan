import { processorToWebStream, toWebStream } from '@material-tech/alloy-adapters/web-stream'
import { createSignal } from '@material-tech/alloy-core'
import { describe, expect, it } from 'vitest'

async function collectWebStream<T>(stream: ReadableStream<T>): Promise<T[]> {
  const reader = stream.getReader()
  const chunks: T[] = []
  while (true) {
    const { done, value } = await reader.read()
    if (done)
      break
    chunks.push(value)
  }
  return chunks
}

describe('toWebStream', () => {
  it('should create a TransformStream from an indicator', async () => {
    const double = createSignal(
      () => (v: number) => v * 2,
    )
    const transform = toWebStream(double)
    const writer = transform.writable.getWriter()
    const resultPromise = collectWebStream(transform.readable)

    for (const v of [1, 2, 3]) {
      await writer.write(v)
    }
    await writer.close()

    expect(await resultPromise).toEqual([2, 4, 6])
  })

  it('should pass options to the indicator', async () => {
    const multiply = createSignal(
      (opts: Required<{ factor: number }>) => (v: number) => v * opts.factor,
      { factor: 2 },
    )
    const transform = toWebStream(multiply, { factor: 5 })
    const writer = transform.writable.getWriter()
    const resultPromise = collectWebStream(transform.readable)

    for (const v of [1, 2, 3]) {
      await writer.write(v)
    }
    await writer.close()

    expect(await resultPromise).toEqual([5, 10, 15])
  })
})

describe('processorToWebStream', () => {
  it('should create a TransformStream from a processor', async () => {
    const double = createSignal(
      () => (v: number) => v * 2,
    )
    const processor = double.create()
    const transform = processorToWebStream(processor)
    const writer = transform.writable.getWriter()
    const resultPromise = collectWebStream(transform.readable)

    for (const v of [10, 20, 30]) {
      await writer.write(v)
    }
    await writer.close()

    expect(await resultPromise).toEqual([20, 40, 60])
  })
})
