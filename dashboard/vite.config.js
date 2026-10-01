import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

const root = dirname(fileURLToPath(import.meta.url))

// Two entry points:
//   index.html     -> GridSense AI product site (src/site/main.jsx — Tailwind + Framer Motion)
//   dashboard.html -> live forecasting dashboard (src/main.jsx — Recharts)
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        site: resolve(root, 'index.html'),
        dashboard: resolve(root, 'dashboard.html'),
      },
    },
  },
})
