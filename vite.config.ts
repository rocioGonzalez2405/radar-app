import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Reads "paths" from tsconfig.app.json. Do not add resolve.alias.
  resolve: { tsconfigPaths: true },
  test: {
    // Data-layer tests only — no DOM environment is needed.
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
