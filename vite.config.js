import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Relative base so the build works under GitHub Pages' /<repo>/ path as well
  // as at a domain root; App.jsx builds iframe URLs from BASE_URL.
  base: './',
  server: {
    port: 5173,
    strictPort: true,
  },
})
