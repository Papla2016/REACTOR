import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/docs': {
        target: 'http://backend:8000',
        changeOrigin: true
      },
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/openapi.json': {
        target: 'http://backend:8000',
        changeOrigin: true
      },
      '/redoc': {
        target: 'http://backend:8000',
        changeOrigin: true
      }
    }
  }
})
