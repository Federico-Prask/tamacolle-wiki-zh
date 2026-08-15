import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // 纯逻辑测试，不需要浏览器环境
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // 数据校验会遍历 71 个 JSON，给足超时
    testTimeout: 20_000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/markdown/**/*.ts'],
      // 数据文件与组件不计入覆盖率
      exclude: ['src/data/pages/**', 'src/**/*.vue'],
    },
  },
})
