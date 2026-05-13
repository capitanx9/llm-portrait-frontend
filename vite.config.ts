import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react() /* __AXIS_VITE_PLUGINS__ */],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: { environment: 'jsdom', globals: true },
  /* __AXIS_VITE_TEST__ */
})
