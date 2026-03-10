import { defineConfig } from 'tsdown'

export default defineConfig({
  workspace: ['packages/*', 'packages-data/*'],
  entry: ['./src/index.ts'],
  target: 'es2020',
  clean: true,
  dts: true,
  exports: true,
  sourcemap: true,
  platform: 'neutral',
})
