import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Unit tests live next to the code. Playwright specs in tests/ are run by Playwright, not Vitest.
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
