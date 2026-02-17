import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    'index': './src/index.ts',
    'batch': './src/batch.ts',
    'node-stream': './src/node-stream.ts',
    'web-stream': './src/web-stream.ts',
  },
  target: 'es2020',
  clean: true,
  dts: true,
  exports: true,
  sourcemap: true,
  platform: 'neutral',
})
