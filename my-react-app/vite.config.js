import { defineConfig, loadEnv } from 'vite'
import { cwd, env } from 'node:process'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const configEnv = loadEnv(mode, cwd(), '')

  return {
    server: {
      proxy: {
        '/api': {
          target: env.API_PROXY_TARGET || configEnv.API_PROXY_TARGET || 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
    plugins: [react(), tailwindcss()],
  }
})
