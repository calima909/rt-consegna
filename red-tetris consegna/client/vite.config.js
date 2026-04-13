import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      lines: 70,
      functions: 70,
      branches: 50,
      statements: 70,
      exclude: [
        'node_modules/',
        'tests/',
        'src/main.js'
      ]
    }
  }
})
