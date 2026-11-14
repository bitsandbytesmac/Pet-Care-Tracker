import { getRequestListener } from '@hono/node-server'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'

/**
 * Serves the Hono API (server/app.ts) from the Vite dev server, so `npm run dev`
 * runs the whole app on one port. Server code is reloaded on change.
 */
function apiDevServer(): Plugin {
  return {
    name: 'petcare-api-dev-server',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next()
        server
          .ssrLoadModule('/server/app.ts')
          .then((mod) => getRequestListener((mod as typeof import('./server/app')).app.fetch)(req, res))
          .catch(next)
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  // Make .env available to the server code. Real environment variables win (CI, Playwright).
  for (const [key, value] of Object.entries(loadEnv(mode, process.cwd(), ''))) {
    process.env[key] ??= value
  }
  return {
    plugins: [react(), tailwindcss(), apiDevServer()],
    server: { port: 5173, strictPort: true },
  }
})
