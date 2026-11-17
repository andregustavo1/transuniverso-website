import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import Lenis from 'lenis'
import { animate, domAnimation, LazyMotion, m, useInView, useMotionValue, useMotionValueEvent, useScroll, useSpring, useTransform } from 'framer-motion'

// three.js and its scene load as a separate chunk, so the page's own JS (and the hero copy) isn't waiting on them.
// The import starts right after the first paint, not before: Lighthouse simulates the network from every request
// that began before LCP, so starting the 3D downloads earlier pulled them into the simulated LCP (13 s instead of
// 2.5 s on mobile). sceneHere tells Hero whether the chunk arrived while the curtain was still down.
// The prerender (SSR) never loads it: three.js needs a browser, so the server leaves the canvas out
const sceneChunk = import.meta.env.SSR ? new Promise(() => {}) : new Promise((r) => requestAnimationFrame(() => setTimeout(r))).then(() => import('./Scene'))
let sceneHere = false
sceneChunk.then(() => (sceneHere = true))
const Scene = lazy(() => sceneChunk)

// motion tokens, mirrored in styles.css (--ease-in-out, --ease-out, --default-transition-duration):
// ease for big one-off moves, easeOut for everything that responds or settles, ui for small state changes
const ease = [0.76, 0, 0.24, 1]
const easeOut = [0.22, 1, 0.36, 1]
const ui = { duration: 0.3, ease: easeOut }

// press feedback on pointer-down, not on release (deliberately quicker than ui)
const tap = { scale: 0.97, transition: { duration: 0.1 } }

const WHATSAPP = '5511940134501' // same number as the footer
// every quote CTA opens WhatsApp with the first message already written; the form stays for detailed quotes
const wa = (text = 'Olá! Quero uma cotação de frete.') => ({ href: `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`, target: '_blank', rel: 'noopener noreferrer' })
const WaIcon = ({ className = 'size-[1.2em]' }) => (
  <svg viewBox="0 0 24 24" className={`${className} shrink-0 fill-current`} aria-hidden><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.42.25-.7.25-1.29.18-1.41-.08-.13-.28-.2-.57-.35m-5.42 7.4h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89a11.82 11.82 0 0 0-3.48-8.41z" /></svg>
)

// CTA that leans toward the mouse and springs back on leave (mouse only, touch stays still)
function Magnetic({ strength = 0.35, ...props }) {
  const x = useMotionValue(0), y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 220, damping: 16, mass: 0.4 }), sy = useSpring(y, { stiffness: 220, damping: 16, mass: 0.4 })
  const move = (e) => {
    if (e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    x.set((e.clientX - r.left - r.width / 2) * strength)
    y.set((e.clientY - r.top - r.height / 2) * strength)
  }
  return <m.a {...props} style={{ x: sx, y: sy }} whileTap={tap} onPointerMove={move} onPointerLeave={() => { x.set(0); y.set(0) }} />
}

// dot follows the pointer; trailing ring fills red with page scroll progress.
// Over links and buttons the dot hides and the native hand pointer shows instead
function Cursor() {
  const x = useMotionValue(-100), y = useMotionValue(-100)
  const rx = useSpring(x, { stiffness: 180, damping: 22 }), ry = useSpring(y, { stiffness: 180, damping: 22 })
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })
  const [hover, setHover] = useState(false)
  // the dot takes the opposite of the section's theme. It used mix-blend-difference, which made the browser blend
  // it against everything underneath (the WebGL canvas included) on every frame
  const [light, setLight] = useState(false)
  useEffect(() => {
    const move = (e) => {
      x.set(e.clientX); y.set(e.clientY)
      setHover(e.target.closest('a, button') ? 'link' : null)
      setLight(e.target.closest('[data-theme]')?.dataset.theme === 'light')
    }
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [x, y])
  return (
    <>
      <m.div className="pointer-events-none fixed left-0 top-0 z-100 -ml-[23px] -mt-[23px] size-[46px] pointer-coarse:hidden" style={{ x: rx, y: ry }} animate={{ scale: hover ? 1.15 : 1 }} transition={ui}>
        <svg viewBox="0 0 46 46" className="size-full -rotate-90 overflow-visible">
          <circle className="fill-none stroke-paper/20 stroke-1" cx="23" cy="23" r="21" />
          <m.circle className="fill-none stroke-red stroke-2" strokeLinecap="round" cx="23" cy="23" r="21" style={{ pathLength: progress }} />
        </svg>
      </m.div>
      <m.div className={`pointer-events-none fixed left-0 top-0 z-100 -ml-[3px] -mt-[3px] size-1.5 rounded-full transition-colors pointer-coarse:hidden ${light ? 'bg-ink' : 'bg-paper'}`} style={{ x, y }} animate={{ scale: hover === 'link' ? 0 : 1 }} transition={ui} />
    </>
  )
}

// fixed header; flips colours to match the section underneath (sections set data-theme)
function Header() {
  const [light, setLight] = useState(false)
  const [hidden, setHidden] = useState(false)
  useEffect(() => {
    // theme: an IntersectionObserver on a 1px line at y = 40 (the header's middle) instead of hit-testing every scroll.
    // Of the [data-theme] elements crossing it, the last in document order wins: the innermost one, or the later
    // sheet on top (Stats sliding over the hero card)
    const hits = new Set()
    let io
    const observe = () => {
      io?.disconnect()
      hits.clear()
      io = new IntersectionObserver((entries) => {
        entries.forEach((e) => (e.isIntersecting ? hits.add(e.target) : hits.delete(e.target)))
        const top = [...hits].sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1)).at(-1)
        setLight(top?.dataset.theme === 'light')
      }, { rootMargin: `-40px 0px ${41 - innerHeight}px 0px` })
      document.querySelectorAll('[data-theme]').forEach((el) => io.observe(el))
    }
    // hide once the hero starts shrinking into its card (0.7 = cardScale start in Hero). The threshold is measured on
    // resize only: reading offsetTop/offsetHeight on every scroll event forced a layout each frame
    let hideAt = 0
    const measure = () => {
      const top = document.getElementById('top')
      hideAt = top.offsetTop + (top.offsetHeight - innerHeight) * 0.7
    }
    const check = () => setHidden(scrollY >= hideAt)
    const resize = () => { observe(); measure(); check() }
    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('scroll', check, { passive: true })
    return () => {
      io.disconnect()
      window.removeEventListener('resize', resize)
      window.removeEventListener('scroll', check)
    }
  }, [])
  return (
    <header className={`pointer-events-none fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-3 px-4 pt-4 transition-[color,opacity,translate] md:px-[6vw] md:pt-7 ${light ? 'text-ink' : 'text-paper'} ${hidden ? '-translate-y-full opacity-0 *:pointer-events-none!' : ''}`}>
      {/* scroll-edge tint that fades out downward, so content passing under the bar stays legible without a hard divider.
          No backdrop-blur: the bar only shows over the hero, whose WebGL canvas changes every frame, so the browser
          re-blurred the whole strip on every frame */}
      <div className={`pointer-events-none absolute inset-x-0 top-0 -z-10 h-[calc(100%+1.5rem)] transition-colors [mask-image:linear-gradient(to_bottom,black_45%,transparent)] ${light ? 'bg-paper/70' : 'bg-ink/45'}`} aria-hidden />
      <a href="#top" className="pointer-events-auto font-display text-xs font-extrabold tracking-[0.14em] md:text-lg md:tracking-[0.2em]">TRANSUNIVERSO</a>
      <Magnetic {...wa()} className={`pointer-events-auto inline-flex items-center gap-2 rounded-full px-3.5 py-2.5 whitespace-nowrap text-xs font-semibold transition-colors hover:bg-red hover:text-paper md:gap-2.5 md:px-6 md:py-3.5 md:text-[15px] ${light ? 'bg-ink text-paper' : 'bg-paper text-ink'}`}><WaIcon />Faça sua cotação</Magnetic>
    </header>
  )
}

// one-shot colour sweep: a 300%-wide gradient clipped to the text slides right, so a red band crosses the
// letters and leaves them in --sweep (the text's final colour); before that the letters are transparent
const sweep = 'bg-[linear-gradient(90deg,var(--sweep)_33.4%,#ff5c66_42%,var(--color-red)_50%,transparent_62%)] bg-size-[300%_100%] bg-clip-text text-transparent w-fit' // w-fit: the band must cross the letters, not the empty block width
const sweepIn = (ready, delay) => ({ initial: { backgroundPosition: '100% 0%' }, animate: ready && { backgroundPosition: '0% 0%' }, transition: { delay, duration: 1.8, ease } })

// the hero copy's entrance ends when the second sweep does (delay 0.9 s + 1.8 s, see Hero)
const INTRO_MS = 2700

function Hero({ ready }) {
  const ref = useRef()
  const inView = useInView(ref, { initial: true })
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const copyOpacity = useTransform(p, [0.1, 0.4], [1, 0])
  const copyY = useTransform(p, [0.1, 0.4], [0, -60])
  // once faded out, hide the copy so its pointer-events-auto buttons can't be clicked invisibly
  const copyVisibility = useTransform(p, (v) => (v >= 0.4 ? 'hidden' : 'visible'))
  const scene = useTransform(p, [0, 0.8], [0, 1])
  // exit: the hero recedes into a dimmed rounded card while the light Stats sheet slides over it
  const cardScale = useTransform(p, [0.7, 1], [1, 0.88])
  const cardRadius = useTransform(p, [0.7, 1], [0, 32])
  const cardDim = useTransform(p, [0.7, 1], [0, 0.55])
  // once the card has fully shrunk, freeze the 3D scene on its last frame
  const [settled, setSettled] = useState(false)
  useMotionValueEvent(p, 'change', (v) => setSettled(v >= 0.999))
  // the copy shows over black straight away; the 3D scene fades in once the truck and Earth have loaded
  const [sceneReady, setSceneReady] = useState(false)
  // creating the WebGL canvas while the intro animates took ~90 ms of main thread (measured on slow 4G; ~10 ms when
  // the page is quiet), a hitch right as the copy sweeps in. So if the chunk hadn't arrived by the time the curtain
  // lifts, the canvas waits for the intro to finish. On such a connection the models are still downloading anyway
  // It also starts held: the prerendered HTML has no canvas (three.js can't run on the server), and hydration needs
  // the first client render to match it, or React drops the boundary with error #419. Released right after mount
  const [holdScene, setHoldScene] = useState(true)
  useEffect(() => {
    if (!ready || sceneHere) { setHoldScene(false); return }
    setHoldScene(true)
    const t = setTimeout(() => setHoldScene(false), INTRO_MS)
    return () => clearTimeout(t)
  }, [ready])

  return (
    <section className="relative h-[220vh] pointer-fine:h-[260vh]" data-theme="dark" id="top" ref={ref}>
      <div className="sticky top-0 h-svh overflow-hidden bg-paper" data-theme="light">
        <m.div className="absolute inset-0 overflow-hidden bg-black" data-theme="dark" style={{ scale: cardScale, borderRadius: cardRadius }}>
        {/* black backing: the WebGL canvas has alpha, so sprites must composite over black, not the page */}
        <div data-scene className={`absolute inset-0 transition-opacity duration-1000 [&_canvas]:bg-black ${inView ? '' : 'invisible'} ${sceneReady ? '' : 'opacity-0'}`}>
          {!holdScene && <Suspense fallback={null}><Scene progress={scene} active={inView && !settled} onLoaded={() => setSceneReady(true)} /></Suspense>}
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,var(--color-ink),transparent_25%)]" />
        <m.div className="pointer-events-none absolute inset-x-4 bottom-[8svh] md:inset-x-[6vw] md:bottom-[10svh]" style={{ opacity: copyOpacity, y: copyY, visibility: copyVisibility }}>
          <m.div initial={{ opacity: 0, y: 30 }} animate={ready && { opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.9, ease }}>
            <m.h1 {...sweepIn(ready, 0.5)} className={`${sweep} [--sweep:var(--color-paper)] font-hero text-[12vw] leading-[0.93] font-extrabold tracking-[-0.02em] uppercase md:text-[6.4vw] lg:text-[clamp(3.2rem,4.8vw,5.8rem)]`}>
              {/* SEO: the visible line has no keyword, so the heading opens with a screen-reader-only one. Kept short,
                  true and in line with the page copy: hidden text stuffed with keywords is what Google penalises */}
              <span className="sr-only">Transuniverso, transportadora rodoviária para todo o Brasil: </span>Sua carga<br />no prazo<br />e segurada.
            </m.h1>
            <m.p {...sweepIn(ready, 0.9)} className={`${sweep} [--sweep:rgb(245_243_239/0.8)] mt-5 max-w-[38ch] text-[15px] md:max-w-[62ch] leading-relaxed md:mt-7 md:text-[17px]`}>Frete lotação e fracionada para todo o Brasil, com frota própria, rota planejada e seguro que cobre o valor total da sua carga.</m.p>
            <div className="mt-6 flex flex-wrap gap-2.5 md:mt-8 md:gap-3">
              <Magnetic {...wa()} className="pointer-events-auto inline-flex items-center gap-2.5 rounded-full bg-red px-4 py-3.5 text-sm font-semibold transition-colors hover:bg-paper hover:text-ink md:px-6 md:text-[15px]"><WaIcon />Faça sua cotação</Magnetic>
              {/* Lenis (anchors: true) turns this into a smooth scroll */}
              <m.a href="#rota" whileTap={tap} className="pointer-events-auto inline-flex items-center rounded-full border border-paper/40 px-4 py-3.5 text-sm font-semibold md:px-6 md:text-[15px] transition-colors hover:border-paper hover:bg-paper hover:text-ink">Nossos serviços</m.a>
            </div>
          </m.div>
        </m.div>
        <m.div className="pointer-events-none absolute inset-0 bg-ink" style={{ opacity: cardDim }} />
        </m.div>
      </div>
    </section>
  )
}

const stats = [
  { n: 15, l: 'Anos de operação' },
  { n: 99, s: '%', l: 'Das entregas no prazo' },
  { n: 50, l: 'Clientes ativos' },
  { n: 13500, l: 'Cargas entregues' },
  { n: 100, s: '%', l: 'Das cargas seguradas pelo valor total' },
]

// crawlers keep the final numbers: a render snapshot could otherwise catch the count at 0 or halfway
const BOT = typeof navigator !== 'undefined' && /bot|crawl|spider|lighthouse/i.test(navigator.userAgent)

// counts up from 0 the first time the number scrolls into view. The HTML (prerender, no JS, crawlers) has the
// final number; in a browser it drops to 0 right after hydration, so the count never starts from a visible total
function Counter({ n }) {
  const ref = useRef()
  const inView = useInView(ref, { once: true, margin: '-15% 0px' })
  useEffect(() => {
    if (BOT) return
    if (!inView) { ref.current.textContent = '0'; return }
    const c = animate(0, n, { duration: 2, ease: easeOut, onUpdate: (v) => { ref.current.textContent = Math.round(v).toLocaleString('pt-BR') } })
    return () => c.stop()
  }, [inView, n])
  return <span ref={ref}>{n.toLocaleString('pt-BR')}</span>
}

// photo-640.webp etc. sit next to each original in public/images (made with Pillow, webp q80), so phones don't
// download the 1600 px version for a ~350 px slot
const srcSet = (src, widths, full) => [...widths.map((w) => `${src.replace('.webp', `-${w}.webp`)} ${w}w`), `${src} ${full}w`].join(', ')

function Stats() {
  return (
    <section className="relative z-10 -mt-[40svh] rounded-t-[32px] bg-paper px-4 py-20 text-ink shadow-[0_-30px_60px_-20px_rgb(5_5_5/0.35)] [--color-line:rgb(5_5_5/0.12)] [--color-muted:rgb(5_5_5/0.55)] md:px-[6vw] md:py-32" data-theme="light" id="numeros">
      <div className="grid gap-10 md:grid-cols-2 md:items-end md:gap-[4vw]">
        <h2 className="font-display text-[2.6rem] leading-[0.95] font-bold tracking-[-0.035em] uppercase sm:text-6xl lg:text-[clamp(4rem,6vw,6.5rem)]"><span className="text-muted">Movemos cargas.</span><br />Entregamos resultados.</h2>
        <img src="/images/estrada.webp" srcSet={srcSet('/images/estrada.webp', [640, 1024, 1280], 1574)} sizes="(min-width: 768px) 46vw, 100vw" alt="Caminhão vermelho da transportadora Transuniverso em um viaduto" className="aspect-[4/3] w-full rounded-[22px] object-cover" loading="lazy" />
      </div>
      <p className="mt-16 border-b border-line pb-5 text-[15px] font-medium md:mt-24">Prazo e seguro, em números</p>
      <ul className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((s) => (
          <li key={s.l} className="border-b border-line py-8 sm:px-3 sm:text-center md:py-10">
            <p className="font-display text-[clamp(3.5rem,16vw,5rem)] leading-none font-[750] tracking-[-0.04em] tabular-nums sm:text-[6.5vw] lg:text-[min(3.4vw,4.5rem)] xl:text-[min(2.8vw,3.75rem)]">{s.s ? '' : '+'}<Counter n={s.n} />{s.s}</p>
            <p className="mt-3 text-[17px] font-semibold text-muted">{s.l}</p>
          </li>
        ))}
      </ul>
      <Magnetic {...wa()} className="mt-12 inline-flex items-center gap-2.5 rounded-full bg-red px-6 py-3.5 text-[15px] font-semibold text-paper transition-colors hover:bg-ink md:mt-16"><WaIcon />Faça sua cotação</Magnetic>
    </section>
  )
}

// red curtain with a loading bar; lifts only once every three.js asset (truck GLB, Earth textures) has loaded
const roadFeatures = [
  { t: 'Lotação', img: { src: '/images/lotacao.webp', alt: 'Caminhão vermelho da Transuniverso com carreta fechada fazendo frete lotação na estrada' }, icon: [['M2 5h12v11H2z'], ['M15 8h4l3 4v4h-7z'], ['M3.8 18a2.7 2.7 0 1 0 5.4 0a2.7 2.7 0 1 0-5.4 0', 1], ['M14.8 18a2.7 2.7 0 1 0 5.4 0a2.7 2.7 0 1 0-5.4 0', 1], ['M4.3 18a2.2 2.2 0 1 0 4.4 0a2.2 2.2 0 1 0-4.4 0'], ['M15.3 18a2.2 2.2 0 1 0 4.4 0a2.2 2.2 0 1 0-4.4 0']], d: 'No frete lotação, o caminhão inteiro é seu. Sai da coleta direto para o destino, sem dividir espaço.' },
  { t: 'Fracionada', img: { src: '/images/fracionada.webp', alt: 'Paletes de carga fracionada sendo levados até um caminhão da Transuniverso' }, icon: [['M12 2l9 5v10l-9 5-9-5V7z'], ['M3 7l9 5 9-5', 1.2], ['M12 12v10', 1.2]], d: 'Pouca carga? No frete fracionado, você divide o caminhão e paga só pelo espaço que ocupa. O seguro e o prazo continuam os mesmos.' },
  { t: 'Produtos especiais', img: { src: '/images/produtos-especiais.webp', alt: 'Empilhadeira carregando uma máquina embalada em um caminhão baú' }, icon: [['M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z'], ['m8.5 12 2.5 2.5 4.5-5', 1.8]], d: 'Transporte de medicamentos, cosméticos e produtos perigosos, com AFE da ANVISA e motoristas com curso MOPP.' },
]

// dot-matrix icon: shapes are a mask (white fills, black [d, width] strokes cut gaps) over a grid of dots
function DotIcon({ id, shapes }) {
  return (
    <span className="grid size-14 place-items-center rounded-xl border border-line bg-[radial-gradient(rgb(5_5_5/0.1)_1px,transparent_1.5px)] bg-size-[6px_6px] text-ink" aria-hidden>
      <svg viewBox="0 0 24 24" className="size-9">
        <defs>
          <pattern id={`${id}-dots`} width="2" height="2" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.75" fill="currentColor" /></pattern>
          <mask id={`${id}-mask`} strokeLinecap="round" strokeLinejoin="round">
            {shapes.map(([d, w]) => <path key={d} d={d} {...(w ? { fill: 'none', stroke: '#000', strokeWidth: w } : { fill: '#fff' })} />)}
          </mask>
        </defs>
        <rect width="24" height="24" fill={`url(#${id}-dots)`} mask={`url(#${id}-mask)`} />
      </svg>
    </span>
  )
}

// the truck image is sticky in the road column, so the dashed asphalt scrolls past it and it reads as driving down
function RoadSection() {
  const ref = useRef()
  // one smooth pass over the whole section: section top at the fold (0) to section bottom at the fold (1, page end).
  // f eases the truck's screen position: fastest while it's entering/leaving, slowest mid-screen, with no
  // sudden speed change (f' = 1 + k·cos 2πv is continuous). The road clips it above/below its edges
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start end', 'end end'] })
  const truck = useRef()
  const truckY = useTransform(p, (v) => {
    if (import.meta.env.SSR) return 0
    const vh = window.innerHeight, H = ref.current?.offsetHeight ?? vh, h = truck.current?.offsetHeight ?? 0, k = 0.6
    const f = v + (k * Math.sin(2 * Math.PI * v)) / (2 * Math.PI)
    const screenTop = -h + f * (vh + h) // from just above the screen to just below it
    return screenTop - (vh - v * H) // convert to the road's coordinates (road top is at vh - v·H on screen)
  })
  return (
    <section ref={ref} className="relative grid grid-cols-[4.5rem_minmax(0,1fr)] bg-paper text-ink [--color-line:rgb(5_5_5/0.12)] [--color-muted:rgb(5_5_5/0.55)] md:grid-cols-[minmax(0,1fr)_clamp(160px,14vw,240px)_minmax(0,1fr)]" data-theme="light" id="rota">
      <div className="relative col-start-1 row-span-2 row-start-1 overflow-clip bg-ink md:col-start-2 md:row-span-1" aria-hidden>
        <i className="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-[repeating-linear-gradient(to_bottom,rgb(245_243_239/0.3)_0_40px,transparent_40px_110px)]" />
        <i className="absolute inset-y-0 left-1.5 w-px bg-paper/15 md:left-3" />
        <i className="absolute inset-y-0 right-1.5 w-px bg-paper/15 md:right-3" />
        <m.div className="absolute inset-x-0 top-0 flex justify-center" style={{ y: truckY }}>
          <img ref={truck} src="/images/truck-top.webp" alt="" width={240} height={1200} className="h-auto max-h-[90svh] w-[74.8%] object-contain drop-shadow-[0_20px_25px_rgb(0_0_0/0.6)]" loading="lazy" />
        </m.div>
      </div>

      <div className="col-start-2 row-start-1 px-4 pt-20 md:col-start-1 md:px-[6vw] md:pt-0">
        <div className="flex flex-col gap-8 md:sticky md:top-0 md:h-svh md:justify-between md:py-[12svh]">
          <div>
            <p className="font-mono text-xs tracking-[0.14em] text-muted uppercase">Serviços</p>
            <h2 className="mt-5 font-display text-[2.2rem] leading-[0.95] font-bold tracking-[-0.035em] uppercase sm:text-5xl lg:text-[clamp(3rem,4.6vw,5.5rem)]"><span className="text-muted">Três rotas.</span><br />Um só padrão.</h2>
          </div>
          <p className="max-w-[42ch] text-base leading-relaxed md:text-[17px]">Frete lotação, carga fracionada ou carga que exige licença. Diga o que vai levar e nós indicamos o frete certo.</p>
        </div>
      </div>

      <ul className="col-start-2 row-start-2 px-4 pb-20 md:col-start-3 md:row-start-1 md:px-[6vw] md:pb-0">
        {roadFeatures.map((f, i) => (
          <li key={f.t} className="flex flex-col justify-center gap-5 border-b border-line py-16 md:min-h-[80svh] md:py-0">
            <DotIcon id={`road-${i}`} shapes={f.icon} />
            <p className="font-mono text-xs tracking-[0.14em] text-red">KM 0{i + 1}</p>
            <h3 className="font-display text-2xl leading-none font-bold tracking-[-0.03em] uppercase md:text-[clamp(1.25rem,2.3vw,2rem)]">{f.t}</h3>
            <p className="max-w-[40ch] text-[15px] leading-relaxed text-muted md:text-base">{f.d}</p>
            <img src={f.img.src} srcSet={srcSet(f.img.src, [560, 1040], 1600)} sizes="(min-width: 768px) min(520px, 40vw), calc(100vw - 104px)" alt={f.img.alt} width={1600} height={1000} loading="lazy" className="mt-3 aspect-[16/10] w-full max-w-[520px] rounded-[20px] object-cover" />
          </li>
        ))}
        <li className="py-16 md:py-[12svh]"><a {...wa('Olá! Quero ajuda para escolher o tipo de frete.')} className="inline-flex items-center gap-2.5 text-base font-semibold text-red transition-colors hover:text-ink md:text-[17px]"><WaIcon />Não sabe qual escolher? Fale com a gente</a></li>
      </ul>
    </section>
  )
}

const policies = [
  { code: 'RC-V', d: 'Danos a terceiros causados pelo veículo durante o transporte.' },
  { code: 'RCTR-C', d: 'Danos à sua carga em caso de acidente na estrada.' },
  { code: 'RC-DC', d: 'Roubo, furto ou desaparecimento da carga.' },
]

const credentials = [
  // dot versions of the agencies' marks (no lettering): ANVISA cross + eye, MOPP tanker, ANTT split triangle
  { t: 'Vigilância Sanitária', tag: 'ANVISA · AFE', icon: [['M7.6 1.5h2v8.1H1.5v-2h6.1z'], ['M14.4 1.5h2v6.1h6.1v2h-8.1z'], ['M1.5 14.4h8.1v8.1h-2v-6.1H1.5z'], ['M14.4 14.4h8.1v2h-6.1v6.1h-2z'], ['M1.5 11.6C7 5.2 17.5 5.6 22.5 12C17 8.2 8 8.2 1.5 11.6z'], ['M22.5 12.4C17 18.8 6.5 18.4 1.5 12C7 15.8 16 15.8 22.5 12.4z'], ['M8.4 12a3.6 3.6 0 1 0 7.2 0a3.6 3.6 0 1 0-7.2 0', 1.4], ['M9.8 12a2.2 2.2 0 1 0 4.4 0a2.2 2.2 0 1 0-4.4 0']], d: 'Autorização da ANVISA para transportar produtos sujeitos à vigilância sanitária, como medicamentos, cosméticos e saneantes.' },
  { t: 'Motoristas certificados', tag: 'MOPP', icon: [['M11 5.5h8a3.6 3.6 0 0 1 0 7.2h-8a3.6 3.6 0 0 1 0-7.2z'], ['M13.5 3.6h3v1.9h-3z'], ['M1.5 8.5h5.5v8.2H1.5z'], ['M7 13.6h15.5v3.1H7z'], ['M12 7.8h6M12 10.2h6', 1], ['M2.8 10h2.8v2.6', 1], ['M2 18.8a2.2 2.2 0 1 0 4.4 0a2.2 2.2 0 1 0-4.4 0', 1.3], ['M13 18.8a2.2 2.2 0 1 0 4.4 0a2.2 2.2 0 1 0-4.4 0', 1.3], ['M17.8 18.8a2.2 2.2 0 1 0 4.4 0a2.2 2.2 0 1 0-4.4 0', 1.3], ['M2.4 18.8a1.8 1.8 0 1 0 3.6 0a1.8 1.8 0 1 0-3.6 0'], ['M13.4 18.8a1.8 1.8 0 1 0 3.6 0a1.8 1.8 0 1 0-3.6 0'], ['M18.2 18.8a1.8 1.8 0 1 0 3.6 0a1.8 1.8 0 1 0-3.6 0']], d: 'Nossos motoristas têm o curso de Movimentação Operacional de Produtos Perigosos. Quem dirige sabe exatamente como transportar a sua carga.' },
  { t: 'Registro Nacional ANTT', tag: 'RNTRC', icon: [['M12 2.5 22.5 20.5h-21z'], ['M7.3 11.3 17.4 10.1 12 20.5z', 1.2]], d: 'Transportadora registrada na Agência Nacional de Transportes Terrestres. Operação 100% regularizada para levar sua carga por todo o Brasil.' },
]

// spec-sheet grid: hairline cells (the wrapper draws top/left, each cell right/bottom) with a dot in every corner
function Cell({ className = '', children }) {
  const dot = 'absolute size-[3px] rounded-full bg-ink/40'
  return (
    <div className={`relative border-r border-b border-line ${className}`}>
      <i className={`${dot} top-1.5 left-1.5`} /><i className={`${dot} top-1.5 right-1.5`} />
      <i className={`${dot} bottom-1.5 left-1.5`} /><i className={`${dot} right-1.5 bottom-1.5`} />
      {children}
    </div>
  )
}

// cols/head/span are full class names (Tailwind can't see built strings): body columns, header-row columns,
// and how far the meta cell spans
function SealGrid({ label, meta, children, cols = 'md:grid-cols-3', head = cols, span = 'md:col-span-2' }) {
  return (
    <div className="border-t border-l border-line">
      <div className={`grid grid-cols-[auto_minmax(0,1fr)] ${head}`}>
        <Cell className="flex items-center px-5 py-4 text-[15px] font-semibold md:px-6">{label}</Cell>
        <Cell className={`flex items-center justify-end px-5 py-4 font-mono text-[11px] tracking-[0.08em] whitespace-nowrap text-muted uppercase ${span} md:justify-start md:px-6 md:text-xs md:tracking-[0.14em]`}>{meta}</Cell>
      </div>
      <ul className={`grid ${cols}`}>{children}</ul>
    </div>
  )
}

function Guarantee() {
  const pct = useRef()
  const pctIn = useInView(pct, { once: true, margin: '-15% 0px' }) // same trigger as Counter
  return (
    <section className="relative border-t border-line bg-paper px-4 py-20 text-ink [--color-line:rgb(5_5_5/0.12)] [--color-muted:rgb(5_5_5/0.55)] md:px-[6vw] md:py-32" data-theme="light" id="garantia">
      <p className="font-mono text-xs tracking-[0.14em] text-muted uppercase">Garantia</p>
      <h2 className="mt-5 font-display text-[2.2rem] leading-[0.95] font-bold tracking-[-0.035em] uppercase sm:text-5xl lg:text-[clamp(3rem,4.6vw,5.5rem)]"><span className="text-muted">Se algo der errado,</span><br />o prejuízo não é seu.</h2>

      {/* seguro */}
      <div className="mt-14 grid gap-8 md:mt-20 md:grid-cols-2 md:items-end md:gap-[4vw]">
        <div>
          {/* hero colour sweep, synced to the count: same trigger, 2 s and easing as Counter, ends in ink */}
          <m.p ref={pct} {...sweepIn(pctIn, 0)} transition={{ duration: 2, ease: easeOut }} className={`${sweep} [--sweep:var(--color-ink)] pr-[0.12em] font-display text-[min(20vw,9rem)] leading-[0.85] font-extrabold tracking-[-0.05em] tabular-nums md:text-[min(9vw,12.5rem)]`}><Counter n={100} />%</m.p>
          <p className="mt-4 max-w-[26ch] text-lg font-semibold sm:max-w-none sm:whitespace-nowrap md:text-xl">do valor da sua carga coberto pelo seguro.</p>
        </div>
        <p className="max-w-[46ch] text-base leading-relaxed text-muted md:text-[17px]">Toda carga que sai com a Transuniverso viaja com seguro de carga. Acidente, roubo ou dano a terceiros: cada situação tem uma apólice própria, e você não precisa contratar nada à parte.</p>
      </div>
      <div className="mt-12 md:mt-16">
        <SealGrid label="Seguros" meta="3 apólices · incluso no frete">
          {policies.map((s) => (
            <li key={s.code} className="contents"><Cell className="flex flex-col gap-4 p-6 md:p-8">
              <span className="self-start rounded-full border border-red/60 px-3.5 py-1.5 font-mono text-sm font-medium tracking-[0.08em] text-red">{s.code}</span>
              <p className="text-[15px] leading-relaxed text-muted md:text-base">{s.d}</p>
            </Cell></li>
          ))}
        </SealGrid>
      </div>

      {/* credenciais */}
      <div className="my-16 flex items-center gap-4 md:my-24 md:gap-6">
        <i className="h-px flex-1 bg-line" />
        <p className="max-w-[24ch] text-center text-base font-medium md:max-w-none md:text-lg">Seguros ativos e regularizados.</p>
        <i className="h-px flex-1 bg-line" />
      </div>
      <h3 className="max-w-[22ch] font-display text-2xl leading-[1.05] font-bold tracking-[-0.03em] uppercase md:text-[clamp(1.75rem,2.8vw,2.75rem)]">Certificados que abrem portas.</h3>
      <div className="mt-10 md:mt-12">
        <SealGrid label="Credenciais" meta="ANVISA · MOPP · ANTT">
          {credentials.map((c, i) => (
            <li key={c.t} className="contents"><Cell className="flex flex-col gap-4 p-6 md:p-8">
              <DotIcon id={`cred-${i}`} shapes={c.icon} />
              <div>
                <p className="font-mono text-xs tracking-[0.14em] text-red uppercase">{c.tag}</p>
                <h4 className="mt-2 font-display text-xl leading-none font-bold tracking-[-0.02em] uppercase">{c.t}</h4>
              </div>
              <p className="text-[15px] leading-relaxed text-muted md:text-base">{c.d}</p>
            </Cell></li>
          ))}
        </SealGrid>
      </div>

      <div className="mt-14 flex flex-col items-start gap-3 md:mt-20">
        <Magnetic {...wa('Olá! Quero uma cotação de frete com seguro incluso.')} className="inline-flex items-center gap-2.5 rounded-full bg-red px-6 py-3.5 text-[15px] font-semibold text-paper transition-colors hover:bg-ink"><WaIcon />Cotar com seguro incluso</Magnetic>
        <p className="text-sm text-muted">O seguro já vem no frete, sem custo extra.</p>
      </div>
    </section>
  )
}

const faqs = [
  { q: 'Quanto tempo leva a cotação?', a: 'A cotação de frete sai em menos de 15 minutos, em horário comercial, pelo WhatsApp.' },
  { q: 'Minha carga tem seguro?', a: 'Sim. Toda carga sai segurada (RC-V, RCTR-C e RC-DC), com cobertura de 100% do valor da mercadoria.' },
  { q: 'Vocês atendem minha cidade?', a: 'Sim. Saímos de Mogi das Cruzes, no Alto Tietê (SP), atendemos todo o Brasil e já levamos cargas para mais de 300 cidades diferentes.' },
  { q: 'Qual a diferença entre lotação e fracionada?', a: 'Na lotação, um caminhão inteiro leva só a sua carga, direto ao destino. Na fracionada, sua carga divide o veículo com outras e você paga só pelo espaço que usa. Não sabe qual escolher? A gente indica na cotação.' },
  { q: 'Vocês transportam produtos perigosos ou farmacêuticos?', a: 'Sim. Somos credenciados pela ANVISA (AFE) e habilitados para produtos perigosos.' },
  { q: 'Consigo acompanhar minha carga?', a: 'Sim. Nossa equipe monitora o transporte e mantém você informado pelo WhatsApp do início ao fim.' },
  { q: 'A frota é própria?', a: 'Sim. Veículos próprios e motoristas preparados, sem intermediários.' },
]

// accordion, one answer open at a time; height animates via the grid-rows 0fr → 1fr trick
function Faq() {
  const [open, setOpen] = useState(0)
  return (
    <section className="relative bg-[#111111] px-4 py-20 text-paper md:px-[6vw] md:py-32" data-theme="dark" id="faq">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-[5vw]">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <p className="font-mono text-xs tracking-[0.14em] text-muted uppercase">Dúvidas</p>
          <h2 className="mt-5 font-display text-[2.2rem] leading-[0.95] font-bold tracking-[-0.035em] uppercase sm:text-5xl lg:text-[clamp(3rem,4.2vw,5rem)]"><span className="text-muted">Perguntas</span><br />frequentes.</h2>
          <p className="mt-6 max-w-[34ch] text-base leading-relaxed text-muted md:text-[17px]">Não achou o que procurava? Fale com a gente: respondemos tudo junto com a sua cotação.</p>
          <Magnetic {...wa()} className="mt-8 inline-flex items-center gap-2.5 rounded-full bg-red px-6 py-3.5 text-[15px] font-semibold text-paper transition-colors hover:bg-paper hover:text-ink"><WaIcon />Faça sua cotação</Magnetic>
        </div>
        <ul>
          {faqs.map((f, i) => {
            const isOpen = open === i
            return (
              <li key={f.q} className="group border-b border-line">
                <button type="button" id={`faq-q-${i}`} aria-expanded={isOpen} aria-controls={`faq-${i}`} onClick={() => setOpen(isOpen ? null : i)} className="flex w-full items-center justify-between gap-6 py-6 text-left md:py-7">
                  <span className={`font-display text-lg leading-tight font-bold tracking-[-0.02em] transition-colors md:text-[1.4rem] ${isOpen ? 'text-paper' : 'text-paper/70 group-hover:text-paper'}`}>{f.q}</span>
                  {/* plus that turns into a red × */}
                  <span className={`relative grid size-10 shrink-0 place-items-center rounded-full border transition-all duration-500 ${isOpen ? 'rotate-45 border-red bg-red' : 'border-line group-hover:border-paper/40'}`} aria-hidden>
                    <i className="absolute h-px w-3.5 bg-current" /><i className="absolute h-3.5 w-px bg-current" />
                  </span>
                </button>
                {/* inert while closed: the collapsed answer is only transparent, so keep it out of tab order and screen readers */}
                <div id={`faq-${i}`} role="region" aria-labelledby={`faq-q-${i}`} inert={!isOpen} className={`grid transition-[grid-template-rows,opacity] duration-500 ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <p className="overflow-hidden pr-14 text-[15px] leading-relaxed text-muted md:text-[17px]"><span className="block pb-7">{f.a}</span></p>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

const field = 'peer w-full rounded-2xl border border-line bg-transparent px-4 pt-6 pb-2 text-[15px] text-ink outline-none transition-colors hover:border-ink/30 focus:border-ink autofill:shadow-[inset_0_0_0_100px_#fcfbfa] autofill:[-webkit-text-fill-color:var(--color-ink)]' // autofill: paint over the browser's blue/yellow fill with the form card's own colour
// floating label: sits inside the field, shrinks to the top once focused or filled (placeholder=" " drives :placeholder-shown)
const float = 'pointer-events-none absolute left-4 text-[15px] text-muted transition-all peer-focus:top-2.5 peer-focus:translate-y-0 peer-focus:text-[11px] peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[11px]'

function Field({ label, name, type = 'text', required, area, error, className = '', ...rest }) {
  const Tag = area ? 'textarea' : 'input'
  return (
    <div className={className}>
      <label className="relative block">
        <Tag {...rest} name={name} type={area ? undefined : type} required={required} placeholder=" " rows={area ? 4 : undefined} aria-invalid={!!error} aria-describedby={error ? `${name}-err` : undefined} className={`${field} ${area ? 'resize-none' : ''} ${error ? 'border-red/40!' : ''}`} />
        <span className={`${float} ${area ? 'top-4' : 'top-1/2 -translate-y-1/2'}`}>{label}{required && <i className="not-italic text-red"> *</i>}</span>
      </label>
      {error && (
        <m.p id={`${name}-err`} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={ui} className="mt-1.5 flex items-center gap-1.5 pl-1 text-xs font-medium text-red">
          <span className="grid size-3.5 place-items-center rounded-full bg-red text-[9px] font-bold text-paper" aria-hidden>!</span>{error}
        </m.p>
      )}
    </div>
  )
}

const freightTypes = ['Lotação', 'Fracionada', 'Produtos especiais', 'Não sei ainda']
const errorFor = (el) => (el.validity.valueMissing ? 'Preencha este campo para continuar.' : 'Confira o formato, parece ter algo errado.')

// no backend: submitting opens WhatsApp with the quote already written out
function Quote() {
  const [sent, setSent] = useState(false)
  const [errors, setErrors] = useState({})
  const submit = (e) => {
    e.preventDefault()
    // our own messages instead of the browser bubble (the form is noValidate); focus the first bad field
    const bad = [...e.currentTarget.elements].filter((el) => el.name && !el.validity.valid)
    if (bad.length) {
      setErrors(Object.fromEntries(bad.map((el) => [el.name, errorFor(el)])))
      bad[0].focus()
      return
    }
    const f = Object.fromEntries(new FormData(e.currentTarget))
    const msg = [
      'Olá! Quero uma cotação de frete.',
      `Nome: ${f.nome}${f.empresa ? ` (${f.empresa})` : ''}`,
      `Telefone: ${f.telefone}`,
      f.email && `E-mail: ${f.email}`,
      `Frete: ${f.tipo}`,
      `Rota: ${f.origem} → ${f.destino}`,
      f.carga && `Carga: ${f.carga}`,
    ].filter(Boolean).join('\n')
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener')
    gtag('event', 'generate_lead', { method: 'form', cta_location: 'contato', freight_type: f.tipo }) // gtag: index.html
    setSent(true)
  }
  return (
    <section className="relative overflow-hidden border-t border-line bg-paper px-4 py-20 text-ink [--color-line:rgb(5_5_5/0.12)] [--color-muted:rgb(5_5_5/0.55)] md:px-[6vw] md:py-32" data-theme="light" id="contato">
      <div className="pointer-events-none absolute -bottom-40 -left-40 size-[80vw] rounded-full bg-[radial-gradient(closest-side,rgb(225_15_31/0.07),transparent)] md:size-[45vw]" aria-hidden />
      <div className="relative grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-[5vw]">
        <div className="lg:sticky lg:top-32 lg:self-start">
          <p className="font-mono text-xs tracking-[0.14em] text-muted uppercase">Cotação</p>
          <h2 className="mt-5 font-display text-[2.2rem] leading-[0.95] font-bold tracking-[-0.035em] uppercase sm:text-5xl lg:text-[clamp(3rem,4.2vw,5rem)]"><span className="text-muted">Diga o que vai levar.</span><br />A gente faz o resto.</h2>
          <p className="mt-6 max-w-[34ch] text-base leading-relaxed text-muted md:text-[17px]">Preencha e envie: sua cotação chega pelo WhatsApp em menos de 15 minutos, em horário comercial.</p>
          <ul className="mt-8 flex flex-col gap-3 text-[15px]">
            {['Seguro de 100% já incluso', 'Atendimento em todo o Brasil', 'Sem compromisso'].map((t) => (
              <li key={t} className="flex items-center gap-3"><span className="grid size-5 place-items-center rounded-full bg-red text-[10px] text-paper" aria-hidden>✓</span>{t}</li>
            ))}
          </ul>
        </div>

        {/* inline validation: a field you typed in is checked as you leave it (empty required fields wait for submit,
            so tapping through or scrolling past doesn't flag them), and its error clears as you type */}
        <form onSubmit={submit} noValidate onInput={(e) => errors[e.target.name] && setErrors(({ [e.target.name]: _, ...rest }) => rest)} onBlur={(e) => e.target.name && e.target.value && !e.target.validity.valid && setErrors((er) => ({ ...er, [e.target.name]: errorFor(e.target) }))} className="rounded-[28px] border border-line bg-white/70 p-5 shadow-[0_30px_60px_-40px_rgb(5_5_5/0.35)] sm:p-8 md:p-10">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nome" name="nome" error={errors.nome} autoComplete="name" required />
            <Field label="Empresa" name="empresa" error={errors.empresa} autoComplete="organization" />
            <Field label="Telefone/Celular" name="telefone" error={errors.telefone} type="tel" autoComplete="tel" required />
            <Field label="E-mail" name="email" error={errors.email} type="email" autoComplete="email" />
          </div>

          <fieldset className="mt-6">
            <legend className="font-mono text-[11px] tracking-[0.14em] text-muted uppercase">Tipo de frete</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {freightTypes.map((t, i) => (
                <label key={t} className="cursor-pointer rounded-full border border-line px-4 py-2.5 text-sm font-medium transition-colors select-none hover:border-ink/40 has-checked:border-ink has-checked:bg-ink has-checked:text-paper has-focus-visible:outline-2 has-focus-visible:outline-red">
                  <input type="radio" name="tipo" value={t} defaultChecked={i === 0} className="sr-only" />{t}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-start">
            <Field label="Origem (cidade/UF)" name="origem" error={errors.origem} required />
            <span className="mt-2.5 hidden size-9 place-items-center rounded-full border border-line text-muted sm:grid" aria-hidden>→</span>
            <Field label="Destino (cidade/UF)" name="destino" error={errors.destino} required />
          </div>
          <Field label="O que vai levar? Peso, volume, tipo de produto…" name="carga" error={errors.carga} area className="mt-3" />

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-[36ch] text-xs leading-relaxed text-muted">Seus dados são usados só para responder à sua cotação.</p>
            <m.button type="submit" whileTap={tap} className="inline-flex items-center justify-center gap-3 rounded-full bg-red px-7 py-4 text-[15px] font-semibold text-paper transition-colors hover:bg-ink">
<WaIcon />{sent ? 'Enviar de novo' : 'Enviar pelo WhatsApp'}
            </m.button>
          </div>
          {sent && <p className="mt-4 text-sm font-medium" role="status">Abrimos o WhatsApp com a sua cotação. É só tocar em enviar.</p>}
        </form>
      </div>
    </section>
  )
}

const footLabel = 'font-mono text-[11px] tracking-[0.14em] text-muted uppercase'
const footLink = 'transition-colors hover:text-red'
const socialBtn = 'grid size-12 shrink-0 place-items-center rounded-full border border-line transition-colors hover:border-red hover:bg-red'
// ponytail: placeholder until the company's LinkedIn page URL is provided (then add it to schema sameAs too)
const LINKEDIN = 'https://www.linkedin.com/'
const INSTAGRAM = 'https://www.instagram.com/transuniverso.transportadora/'

function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-line bg-ink px-4 pt-16 pb-6 text-paper md:px-[6vw] md:pt-24 md:pb-8" data-theme="dark" id="rodape">
      <div className="pointer-events-none absolute -top-40 right-[-20%] size-[70vw] rounded-full bg-[radial-gradient(closest-side,rgb(225_15_31/0.16),transparent)] md:size-[40vw]" aria-hidden />
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_auto]">
        <div className="flex flex-col gap-3">
          <p className={footLabel}>Empresa</p>
          <p className="font-semibold">Transuniverso Transportadora LTDA</p>
          <p className="text-muted">15 anos de mercado</p>
        </div>
        <div className="flex flex-col gap-3">
          <p className={footLabel}>Endereço</p>
          <p>R. Dr. Laércio da Silva, 99<br />Mogi das Cruzes/SP</p>
          <p className="text-muted">Atendimento em todo o Brasil</p>
        </div>
        <div className="flex flex-col gap-3">
          <p className={footLabel}>Fale com a gente</p>
          <a href="tel:+5511940134501" className={`w-fit ${footLink}`}>(11) 94013-4501</a>
          <a href="mailto:atendimento@transuniverso.com.br" className={`w-fit break-all ${footLink}`}>atendimento@transuniverso.com.br</a>
        </div>
        <div className="flex flex-col gap-3">
          <p className={footLabel}>Redes</p>
          <div className="flex items-center gap-3">
            <Magnetic {...wa()} aria-label="WhatsApp da Transuniverso" className={socialBtn}><WaIcon className="size-5" /></Magnetic>
            <Magnetic href={INSTAGRAM} target="_blank" rel="noopener noreferrer" aria-label="Instagram da Transuniverso" className={socialBtn}>
              <svg viewBox="0 0 24 24" className="size-5 fill-none stroke-current stroke-[1.8]" aria-hidden><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.4" cy="6.6" r="0.6" className="fill-current" /></svg>
            </Magnetic>
            <Magnetic href={LINKEDIN} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn da Transuniverso" className={socialBtn}>
              <svg viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden><rect x="3.5" y="9" width="3.6" height="11.5" rx="0.6" /><circle cx="5.3" cy="5.3" r="2.1" /><path d="M10.2 9h3.4v1.7c.6-1.1 1.9-2 3.8-2 3 0 3.9 1.9 3.9 4.8v7h-3.6v-6.2c0-1.6-.4-2.7-1.9-2.7s-2 1.2-2 2.7v6.2h-3.6z" /></svg>
            </Magnetic>
          </div>
          <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer" className={`hidden w-fit text-sm text-muted sm:block ${footLink}`}>@transuniverso.transportadora</a>
        </div>
      </div>

      {/* full-width wordmark fading into the bottom edge; Syne is ~14.5em wide for this word, so 6vw fills the content width */}
      <p className="pointer-events-none mt-16 bg-[linear-gradient(180deg,rgb(245_243_239/0.14),transparent_85%)] bg-clip-text text-center font-display text-[6vw] leading-[0.8] font-extrabold tracking-[-0.02em] whitespace-nowrap text-transparent select-none md:mt-24" aria-hidden>TRANSUNIVERSO</p>
      <div className="mt-6 flex flex-col gap-2 border-t border-line pt-5 text-xs text-muted sm:flex-row sm:justify-between">
        <p>© {new Date().getFullYear()} Transuniverso Transportadora LTDA. Todos os direitos reservados.</p>
        <a href="#top" className={`w-fit ${footLink}`}>Voltar ao topo ↑</a>
      </div>
    </footer>
  )
}

// client logos traced to SVG: CBFA and ANX from high-res files, Canedopel/MD/Íris/Antares from the commercial deck's
// vector paths, the rest from transuniverso.com.br's 120×40 px PNGs. Same set and order as the deck's partners slide.
// ponytail: swap for the companies' official SVGs when available
const partners = [
  ['amsted-rail', 'Amsted Rail'], ['anx', 'ANX'], ['cbfa', 'CBFA'], ['embalagens-santa-ines', 'Embalagens Santa Inês'],
  ['novakraft', 'Novakraft'], ['recriar', 'Recriar'], ['canedopel', 'Canedopel Papéis'],
  ['md', 'MD Inox e Serviços Industriais'], ['iris', 'Íris Papéis e Embalagens'], ['antares', 'Antares Embalagens'],
]

function Partners() {
  return (
    <section className="relative border-t border-line bg-paper px-4 py-20 text-ink [--color-line:rgb(5_5_5/0.12)] [--color-muted:rgb(5_5_5/0.55)] md:px-[6vw] md:py-32" data-theme="light" id="parceiros">
      <p className="font-mono text-xs tracking-[0.14em] text-muted uppercase">Parceiros</p>
      <h2 className="mt-5 max-w-[18ch] font-display text-[2.2rem] leading-[0.95] font-bold tracking-[-0.035em] uppercase sm:text-5xl lg:text-[clamp(3rem,4.6vw,5.5rem)]"><span className="text-muted">Alguns dos nossos</span><br />parceiros comerciais.</h2>
      <div className="mt-12 md:mt-16">
        <SealGrid label="Nossos parceiros" meta={<><span className="md:hidden">Marcas que confiam</span><span className="hidden md:inline">Empresas que confiam em nós</span></>} cols="grid-cols-2 lg:grid-cols-5" head="lg:grid-cols-5" span="lg:col-span-4">
          {partners.map(([file, name]) => (
            <li key={file} className="contents"><Cell className="group grid aspect-[3/2] place-items-center p-6">
              <img src={`/images/clientes/${file}.svg`} alt={name} width={120} height={40} loading="lazy" className="h-auto w-[min(120px,75%)] transition-transform group-hover:scale-110 md:w-[min(180px,60%)]" />
            </Cell></li>
          ))}
        </SealGrid>
      </div>
      <div className="mt-12 flex justify-center md:mt-16">
        {/* ponytail: no careers page yet, so it opens WhatsApp */}
        <Magnetic {...wa('Olá! Gostaria de trabalhar com a Transuniverso.')} className="inline-flex items-center gap-3 rounded-full border border-ink bg-ink px-7 py-4 text-[15px] font-semibold text-paper transition-colors hover:bg-transparent hover:text-ink">Trabalhe conosco <span aria-hidden>→</span></Magnetic>
      </div>
    </section>
  )
}

// the curtain waits only for the fonts, so their swap happens behind it; never for the 3D scene, which fades in on
// its own (Hero). Capped so a slow font CDN can't hold the page. onDone fires once the bar has visibly filled
const FONTS = ['800 1em Syne', '800 1em Archivo', '400 1em Manrope']

function Loader({ ready, onDone }) {
  const bar = useSpring(0, { stiffness: 60, damping: 20 })
  const pct = useTransform(bar, (v) => `${String(Math.round(v * 100)).padStart(3, '0')}%`)
  useMotionValueEvent(bar, 'change', (v) => v > 0.995 && onDone())
  useEffect(() => {
    bar.set(0.7)
    Promise.race([Promise.all(FONTS.map((f) => document.fonts.load(f))), new Promise((r) => setTimeout(r, 2500))]).then(() => bar.set(1), () => bar.set(1))
  }, [bar])
  return (
    <m.div className="fixed inset-0 z-90 grid place-items-center bg-red px-4" initial={{ y: 0 }} animate={{ y: ready ? '-100%' : 0 }} transition={{ duration: 1.1, ease }}>
      <m.div className="flex flex-col items-center gap-5 md:gap-7" animate={{ opacity: ready ? 0 : 1, y: ready ? -40 : 0 }} transition={{ duration: 0.6, ease }}>
        {/* the page's LCP element: visible from the first paint (slide only, no fade), so LCP lands with FCP */}
        <m.span initial={{ y: 20 }} animate={{ y: 0 }} className="pl-[0.2em] font-display text-[clamp(1rem,5vw,3rem)] font-extrabold tracking-[0.2em]" transition={{ duration: 0.6, ease: easeOut }}>TRANSUNIVERSO</m.span>
        <div className="flex w-[min(70vw,320px)] items-center gap-4 font-mono text-[11px] tracking-[0.14em]">
          <div className="relative h-0.5 flex-1 overflow-hidden rounded-full bg-paper/25">
            <m.i className="absolute inset-0 origin-left rounded-full bg-paper" style={{ scaleX: bar }} />
          </div>
          <m.span className="w-[4ch] text-right tabular-nums">{pct}</m.span>
        </div>
      </m.div>
    </m.div>
  )
}

// JSON-LD for Google, Bing and AI answers. Built from the same data the page shows (services, credentials, FAQ),
// so the two can't drift apart. Address and category match the Google Business Profile; CNPJ and founding date come
// from the Receita Federal record. No geo: Google places the business from the Business Profile pin.
// ponytail: no opening hours yet; add openingHoursSpecification once each day's hours are confirmed
const SITE = 'https://www.transuniverso.com.br/'
const ORG = { '@id': `${SITE}#empresa` }
const schema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'LocalBusiness',
      ...ORG,
      name: 'Transuniverso Transportadora',
      legalName: 'Transuniverso Transportadora LTDA',
      alternateName: 'Transuniverso Transportes',
      taxID: '15.721.580/0001-83',
      foundingDate: '2012-05-25',
      description: 'Transportadora rodoviária em Mogi das Cruzes/SP: frete lotação e fracionado para todo o Brasil, com frota própria e seguro de 100% do valor da carga.',
      url: SITE,
      logo: `${SITE}logo.png`,
      image: `${SITE}og-image.jpg`,
      telephone: `+${WHATSAPP}`,
      email: 'atendimento@transuniverso.com.br',
      address: { '@type': 'PostalAddress', streetAddress: 'R. Dr. Laércio da Silva, 99 - Chácara Cruzeiro do Sul', addressLocality: 'Mogi das Cruzes', addressRegion: 'SP', postalCode: '08740-650', addressCountry: 'BR' },
      areaServed: { '@type': 'Country', name: 'Brasil' },
      // sameAs: Instagram + the Business Profile's Knowledge Graph entry (kgmid from its share link)
      hasMap: 'https://www.google.com/maps/search/?api=1&query=Transuniverso+Transportadora+Mogi+das+Cruzes',
      sameAs: [INSTAGRAM, 'https://www.google.com/search?kgmid=/g/11m5hxvbg2'],
      contactPoint: { '@type': 'ContactPoint', telephone: `+${WHATSAPP}`, url: `https://wa.me/${WHATSAPP}`, contactType: 'sales', areaServed: 'BR', availableLanguage: 'Portuguese' },
      // MOPP is the drivers' course, not a company credential, so it stays out
      hasCredential: credentials.filter((c) => c.tag !== 'MOPP').map((c) => ({ '@type': 'EducationalOccupationalCredential', name: c.tag, credentialCategory: 'license', description: c.d })),
    },
    { '@type': 'WebSite', '@id': `${SITE}#site`, url: SITE, name: 'Transuniverso', inLanguage: 'pt-BR', publisher: ORG },
    ...roadFeatures.map((f) => ({ '@type': 'Service', name: f.t, serviceType: 'Transporte rodoviário de cargas', description: f.d, provider: ORG, areaServed: { '@type': 'Country', name: 'Brasil' }, url: `${SITE}#rota` })),
    { '@type': 'FAQPage', '@id': `${SITE}#faq`, mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
  ],
}

export default function App() {
  const [ready, setReady] = useState(false)
  const lenis = useRef()

  useEffect(() => {
    // anchor links ("Nossos serviços") scroll slowly with an ease-in-out instead of the default lerp
    const anchors = { duration: 2.2, easing: (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2) }
    lenis.current = new Lenis({ autoRaf: true, lerp: 0.055, wheelMultiplier: 0.9, anchors, respectReducedMotion: false })
    return () => lenis.current.destroy()
  }, [])

  // no scrolling under the curtain. Declared after the Lenis effect so it re-applies to any recreated
  // instance (HMR, StrictMode): a stopped Lenis sets overflow: clip on <html>, which breaks every sticky section
  useEffect(() => { ready ? lenis.current.start() : lenis.current.stop() }, [ready])

  return (
    // m.* + LazyMotion with only the DOM animation features instead of motion.*: leaves out layout/drag/projection,
    // which nothing here uses. strict: a stray motion.* would pull the full bundle back in, so it throws instead
    <LazyMotion features={domAnimation} strict>
      <Loader ready={ready} onDone={() => setReady(true)} />
      <Cursor />
      <Header />
      <main>
        <Hero ready={ready} />
        <Stats />
        <RoadSection />
        <Guarantee />
        <Partners />
        <Faq />
        <Quote />
      </main>
      <Footer />
      {/* in the prerendered HTML, so crawlers read it without running JS; "<" escaped so text can't close the tag */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} />
    </LazyMotion>
  )
}
