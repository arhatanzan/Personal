import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/.netlify/functions': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  // Build into `dist` and copy `public` assets (default `publicDir`) there.
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false
  }
})

