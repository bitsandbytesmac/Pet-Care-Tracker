import { afterAll } from 'vitest'
import { closeDb } from '../db/client'

try {
  process.loadEnvFile('.env')
} catch {
  // CI provides the environment directly.
}
// Integration tests create users through the test-only route.
process.env.ALLOW_SIGNUP = 'true'
process.env.ENABLE_TEST_ROUTES = 'true'
process.env.UPLOAD_DIR = '.data/test-uploads'

afterAll(async () => {
  await closeDb()
})
