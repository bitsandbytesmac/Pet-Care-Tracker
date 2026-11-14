import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          // Pure logic, no database. Fast; runs everywhere.
          name: 'unit',
          include: ['src/**/*.test.ts'],
          environment: 'node',
        },
      },
      {
        test: {
          // The API in-process against the Postgres in DATABASE_URL (Docker locally, a service in CI).
          name: 'api',
          include: ['server/**/*.test.ts'],
          environment: 'node',
          setupFiles: ['server/test/setup.ts'],
          testTimeout: 20_000,
          hookTimeout: 30_000,
        },
      },
    ],
  },
})
