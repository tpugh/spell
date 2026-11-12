import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Chrome extension (Manifest V3) build. It reuses the same React app and
// src/ modules as the web build, but:
//   - relative asset paths, because it is served from chrome-extension://
//   - no PWA plugin (extensions do not register a service worker)
//   - no modulepreload polyfill, because MV3 blocks inline scripts
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist-extension',
    emptyOutDir: true,
    target: 'chrome120',
    modulePreload: { polyfill: false },
    rollupOptions: {
      input: path.resolve(__dirname, 'extension.html'),
    },
  },
})
