import path from 'node:path'
import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: ['./src/index'],
  sourcemap: true,
  declaration: true,
  alias: {
    '~': path.resolve(__dirname, 'src'),
  },
  rollup: {
    emitCJS: true,
  },
})
