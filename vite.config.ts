import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Reads "paths" from tsconfig.app.json. Do not add resolve.alias.
  resolve: { tsconfigPaths: true },
})
