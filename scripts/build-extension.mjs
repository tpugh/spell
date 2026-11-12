// Packages the built extension: copies manifest.json (with the version from
// package.json), the background service worker and the icons into
// dist-extension/, which is what gets zipped for the release.
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const dist = path.join(root, 'dist-extension')
const appHtml = path.join(dist, 'extension.html')

if (!existsSync(appHtml)) {
  throw new Error('dist-extension/extension.html is missing - run the Vite extension build first')
}

const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'))
const manifest = JSON.parse(await readFile(path.join(root, 'extension', 'manifest.json'), 'utf8'))
manifest.version = pkg.version

await writeFile(path.join(dist, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
await copyFile(path.join(root, 'extension', 'background.js'), path.join(dist, 'background.js'))

const icons = ['icon-16.png', 'icon-32.png', 'icon-48.png', 'icon-128.png']
await mkdir(path.join(dist, 'icons'), { recursive: true })
for (const icon of icons) {
  await copyFile(path.join(root, 'extension', 'icons', icon), path.join(dist, 'icons', icon))
}

console.log(`Extension packaged in dist-extension/ (version ${pkg.version})`)
