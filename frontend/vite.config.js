import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Use subpath for deployment
  base: '/profiling/',
  server: {
    port: 4000
  }
})

