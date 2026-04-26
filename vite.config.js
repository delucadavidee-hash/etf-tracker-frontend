import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const API_URL = process.env.VITE_API_URL || 'http://localhost:8000'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  server: {
    proxy: {
      '/api': {
        target: API_URL,
        changeOrigin: true,
      }
    }
  },
  define: {
    __API_URL__: JSON.stringify(process.env.VITE_API_URL || ''),
  }
})
