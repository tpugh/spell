// Post-build SPA fallback for static hosts without rewrite rules (GitHub Pages).
// Copies dist/index.html -> dist/404.html so client-side routes work on refresh.
import { copyFile, access } from 'node:fs/promises'
import { constants } from 'node:fs'
import { fileURLToPath } from 'node:url'

const distDir = new URL('../dist/', import.meta.url)
const indexHtml = fileURLToPath(new URL('index.html', distDir))
const notFoundHtml = fileURLToPath(new URL('404.html', distDir))

try {
  await access(indexHtml, constants.F_OK)
  await copyFile(indexHtml, notFoundHtml)
  console.log('SPA fallback: copied dist/index.html -> dist/404.html')
} catch {
  console.warn('SPA fallback: dist/index.html not found, skipping 404.html copy')
}
