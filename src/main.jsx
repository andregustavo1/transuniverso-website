import { createRoot, hydrateRoot } from 'react-dom/client'
import 'lenis/dist/lenis.css'
import './styles.css'
import App from './App'

// the build prerenders the page into #root (prerender.mjs), so hydrate it; the dev server serves it empty
const root = document.getElementById('root')
if (root.hasChildNodes()) hydrateRoot(root, <App />)
else createRoot(root).render(<App />)
