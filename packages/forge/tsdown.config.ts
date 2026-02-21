import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: {
    index: './src/index.ts',
  },
  target: 'es2020',
  clean: true,
  dts: true,
  exports: true,
  sourcemap: true,
  platform: 'neutral',
})
