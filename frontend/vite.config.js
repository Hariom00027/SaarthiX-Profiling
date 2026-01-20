import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/i5h0t1r1a2a2s.com/profiling/',
  server: {
    port: 4000
  }
})

