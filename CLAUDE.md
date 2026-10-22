# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Transuniverso: a one-page marketing site for a logistics company, with a space/universe theme. Brand colours are red, black and white only. Sections in order: a 3D hero, stats, a road-style services section, guarantee, partners, FAQ and a quote form, then the footer. Every quote CTA opens WhatsApp (`wa()` in App.jsx).

## Commands

- `npm run dev`: Vite dev server on port 5173. `.claude/launch.json` defines it as `dev` for the preview pane.
- `npm run build`: production build into `dist/`, then `prerender.mjs` renders `App` with `renderToString` into `dist/index.html`'s `#root`. This is the only automated check. There are no tests and no linter.
- `npm run indexnow`: pings IndexNow (Bing, Yandex) for the home page. Run it after a content deploy to www.transuniverso.com.br. The key file is `public/3d469584e95406a52d84b9b7fea6edd1.txt`.
- `npm run preview`: serve the built `dist/`.

`brasilmotoshow/` is a separate, unrelated project with its own git repo. Don't touch it or include it in anything.

## Rules

- **Mobile-first layout.** Write base Tailwind classes for phones, then scale up with `sm:`, `md:` and `lg:`. Never write desktop styles first and patch mobile afterwards. Full-screen sections use `h-svh`, not `100vh`, so they don't jump when mobile browser toolbars appear. Check every layout change at phone (375px), tablet (768px) and desktop widths, and make sure nothing scrolls sideways.
- **Animations ignore `prefers-reduced-motion`, by the owner's choice.** Don't add reduced-motion media queries, Framer `reducedMotion` settings or Lenis `respectReducedMotion: true`.
- Styling is Tailwind CSS v4 utilities in JSX. `src/styles.css` holds only the `@theme` tokens (`red`, `ink`, `paper`, `muted`, `line`, `font-display`, `font-mono`, the motion tokens) and a few global base rules. Don't add component CSS there. `@import "tailwindcss" source(".")` limits class scanning to `src/`. This folder isn't a git repo, so without that limit Tailwind scans `node_modules`.

## Architecture

- SEO prerender: the built page ships its full HTML (for crawlers, link previews and AI bots), and `main.jsx` hydrates it. `App.jsx` runs in Node during the build, so module-level code and render-time code must not touch `window`, `document` or rAF without an `import.meta.env.SSR` guard (effects are fine). The first client render must match the server's HTML: that's why `Hero` starts with the canvas held (`holdScene`), since the server can't render three.js. A mismatch shows up as React error #418/#419 in the console of the built site (`npm run preview`). The dev server doesn't prerender.
- `public/robots.txt`, `sitemap.xml` and `llms.txt` are hand-written. Update the sitemap's `lastmod` when the content changes. `vercel.json` redirects the bare domain to `www` (308) and sends `X-Robots-Tag: noindex` on `*.vercel.app`. The canonical URL is `https://www.transuniverso.com.br/`. `seo.md` tracks the SEO work.
- Google Analytics 4 (`G-46WQCRHKHX`) is an inline script in `index.html`. It only runs on www.transuniverso.com.br and loads gtag.js after `load` plus idle. A capture-phase click listener there sends `generate_lead` for wa.me, `tel:` and `mailto:` links, with `cta_location` set to the closest section id (or `header`), and `trabalhe_conosco` for the careers link. `Quote` sends its own `generate_lead` (`method: form`). New CTAs need no tracking code if they are wa.me links inside a section with an id.
- `src/App.jsx`: everything in the page DOM.
  - Lenis smooth scroll runs with `respectReducedMotion: false`, deliberately. The owner's Windows has reduced motion on, and otherwise Lenis turns wheel smoothing off.
  - The intro curtain. It waits only for the fonts, never for the 3D assets. Don't gate it on them again, because on slow 4G that held the page for about 25 s. Its "TRANSUNIVERSO" text is the page's LCP element. It must be visible from the first paint, so it slides in without a fade, and the 3D chunk only starts loading after that paint. A fade made Lighthouse count the 3D downloads in its simulated LCP: mobile LCP went from 2.4 s to 5–13 s, and the score from about 70 to 31–52.
  - A custom cursor: a dot plus a trailing ring whose red arc shows page scroll progress. It replaces the hidden scrollbar.
  - `Hero`: a tall section with a sticky full-screen child, driven by Framer Motion `useScroll`. The old horizontal `Services` card track was removed.
- `src/Scene.jsx`: the whole React Three Fiber canvas for the hero. `App.jsx` loads it with `lazy()`, so three.js is a separate chunk. Never import three, drei or fiber from `App.jsx`, or they end up in the main bundle again. The scene draws nothing until `Warmup` has finished. Warmup uploads every texture in the scene, compiles every shader with `compileAsync`, forces each program to finish linking, and then draws the scene one object per frame into the still invisible canvas. Each step runs in its own small task. Only then does it call `onLoaded`, and `Hero` fades the scene in. Skipping any of these steps froze the page for 300 to 500 ms on a first visit with Windows/D3D11. Warmup finds textures by walking the scene, so a new texture or object is covered automatically. The GLB, the textures and the Draco decoder all start downloading together when the module loads. `Hero` passes its scroll progress as a motion value (`progress`). The scene reads it with `progress.get()` inside `useFrame`, never through React state.
  - `Rig`: damps the camera between shot `A` (front three-quarter) and shot `Z` (side view) as you scroll, adds a small mouse parallax, and on narrow or portrait screens centres the truck and pulls the camera back.
  - `TruckModel`: loads `public/models/truck.glb`, a single static mesh, so its wheels can't spin. Scale it with `TRUCK_SCALE`. Its texture's side logo is garbled.
  - `Earth`: custom GLSL that blends day and night, with clouds, ocean glint and an atmosphere glow. Its textures are in `public/textures/earth/`: 3K on large screens, 2K on phones (`EARTH_RES`). The 4K originals are in `source/earth-4096/`, outside `public/` so they don't ship. The textures load through `ImageBitmapLoader`, so the webp decode happens off the main thread. Its rotation is tuned so Brazil faces camera `A` when the page loads. If you move the Earth or camera `A`, re-aim it.
  - `Nebula`: a pre-rendered equirect image, `public/textures/nebula.webp`. Computing its noise live cost about 2 ms of GPU per frame, and baking it at load blocked the page for about 100 ms while its shader compiled. To change it, edit `nebulaFrag`, open the dev site with `?bakenebula`, and save the downloaded file over the old one.
  - Truck reflections come from `public/env/studio-cubeuv.bin`, a pre-baked environment map (gzipped half floats in three's CubeUV layout). Prefiltering the environment live compiles a GGX shader that blocked the page for 1 to 1.8 s on a first visit with Windows/D3D11. To change the lights, edit `StudioLights`, open the dev site with `?bakeenv`, and save the downloaded file over the old one.
  - Opaque truck materials are switched to `FrontSide` at load. The GLB marks them all double-sided, and that cost about 25% of the truck's GPU time.
  - `DriftingStars`: custom point-sprite shader with a core, halo, diffraction spikes and twinkle. Its fragment shader must `discard` outside the circle and output real alpha, or some GPUs draw square sprites.
  - `Road`: drei `Line`s, which keep a constant pixel width so they don't fatten near the camera.
- Fonts are self-hosted in `public/fonts/` (latin subset, variable woff2) and declared with `@font-face` in `styles.css`. Don't preload them: on slow 4G the preloads competed with the JS that paints the first screen, and LCP got 0.6 s worse.
- Photos in `public/images/` come with smaller copies next to them (`name-560.webp`, `name-1040.webp`, ...) for `srcSet` (the `srcSet` helper in `App.jsx`). When you add or replace a photo, generate those copies too.
- The canvas keeps MSAA antialiasing on purpose. Turning it off saved about 1 ms of GPU per frame at 1080p, but the truck's edges visibly jagged.
- The canvas mounts under the curtain when the Scene chunk arrives before the curtain lifts. If it arrives later, the canvas waits for the intro to finish (`INTRO_MS`), because creating it during the intro animations cost about 90 ms of main thread, against about 10 ms when the page is quiet.
- Deployed on Vercel. `vercel.json` sets a 1-year immutable cache on `/assets` (hashed names), and a 7-day cache plus `stale-while-revalidate` on `/models`, `/textures`, `/env`, `/fonts`, `/draco` and `/images`. Those names aren't hashed, so give a file a new name if a stale copy for up to a week would be a problem.
- Source files that must not ship (4K Earth textures, the old truck GLB) live in `source/`, outside `public/`.
- Framer Motion is used as `m.*` inside `<LazyMotion features={domAnimation} strict>` in `App`, never as `motion.*`. That drops layout, drag and projection (13.5 KB gzip off the main JS). `strict` throws if a `motion.*` slips in. If something needs layout or drag animations, switch to `domMax`.
- The Earth's data texture packs roughness in R and clouds in G (B is empty). Clouds sit in green because webp keeps green at full resolution, while blue lands in the half-resolution chroma. The textures are generated with Pillow from `source/earth-4096/`, as webp q65 at 3K and q72 at 2K.
- Static assets in `public/` (the GLB, the Earth textures) load by absolute path, for example `/models/truck.glb`.

## Gotchas

- Lighthouse mobile scores about 75 (desktop 95 or more), and the owner accepts that. The remaining TBT is the 3D scene rendering on the CPU, because Lighthouse's Chrome has no GPU; without the 3D the score is about 88. A static fallback for clients without GPU acceleration (`failIfMajorPerformanceCaveat`) was considered and declined. The prerender doesn't cost score: hydration adds only 10–20 ms of TBT.
- Don't let a test harness inject anything into the page. A probe that called `getComputedStyle` every 50 ms inflated TBT and produced misleading Lighthouse scores.

- Measuring performance: the preview pane hides itself and stalls rAF, and Chrome's shader cache hides first-visit costs. Use headless Chrome with a fresh profile instead, driven over CDP with the real GPU (`--headless=new --use-angle=d3d11`), plus `EXT_disjoint_timer_query_webgl2` for GPU time per frame.

- The preview pane is often a hidden or background page. There, `requestAnimationFrame` and ResizeObserver stall, so the canvas stays at 300×150 and animations freeze. To force a re-measure before taking a screenshot, dispatch a `resize` event and nudge `scrollTo`. Don't take timing or smoothness readings from a hidden pane.
- The scene must stay on a black background (`[&_canvas]:bg-black`). The stars use additive blending, which assumes black behind them.
