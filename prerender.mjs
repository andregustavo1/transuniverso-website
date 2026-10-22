// runs after `vite build`: renders App to HTML and writes it into dist/index.html, so crawlers, link previews and
// AI bots that don't run JS read the whole page. main.jsx then hydrates that HTML instead of building it again
import fs from 'node:fs'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { createServer } from 'vite'

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
try {
  const { default: App } = await vite.ssrLoadModule('/src/App.jsx')
  const html = renderToString(createElement(App))
  const file = 'dist/index.html'
  const page = fs.readFileSync(file, 'utf8')
  if (!page.includes('<div id="root"></div>')) throw new Error(`${file} has no empty #root to fill`)
  fs.writeFileSync(file, page.replace('<div id="root"></div>', `<div id="root">${html}</div>`))
  console.log(`prerender: ${file} (${(html.length / 1024).toFixed(1)} KB of HTML)`)
} finally {
  await vite.close()
}
