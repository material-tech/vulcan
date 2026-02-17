import { antfu } from '@antfu/eslint-config'

export default antfu({
  typescript: true,
  ignores: ['.agents/**', 'packages/*/dist/**'],
})
