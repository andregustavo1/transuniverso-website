import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// Interface simplificada - removida física complexa
interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  alpha: number;
}

const UniverseCTA = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const starsRef = useRef<Star[]>([]);
  const animationRef = useRef<number>();
  const isMobileRef = useRef(false);
  const dimensionsRef = useRef({ width: 0, height: 0 });
  
  // Estado para altura fixa no mobile (evita jump)
  const [viewportHeight, setViewportHeight] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Captura altura apenas uma vez no mount
  useEffect(() => {
    const mobile = window.innerWidth < 768;
    setIsMobile(mobile);
    setViewportHeight(`${window.innerHeight}px`);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Detectar mobile uma vez
    isMobileRef.current = window.innerWidth < 768 || 'ontouchstart' in window;

    const resizeCanvas = () => {
      // Usar DPR menor em mobile para performance
      const dpr = isMobileRef.current ? 1 : Math.min(window.devicePixelRatio || 1, 2);
      const rect = container.getBoundingClientRect();
      
      dimensionsRef.current = { width: rect.width, height: rect.height };
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      
      initStars(rect.width, rect.height);
    };

    const initStars = (width: number, height: number) => {
      // MUITO menos estrelas - 30 mobile / 60 desktop
      const starCount = isMobileRef.current ? 60 : 120;
      starsRef.current = [];

      for (let i = 0; i < starCount; i++) {
        starsRef.current.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 1.5 + 0.5,
          speed: Math.random() * 0.3 + 0.1,
          alpha: Math.random() * 0.5 + 0.3,
        });
      }
    };

    // Animação simplificada - sem física, sem gradientes
    const animate = () => {
      const { width, height } = dimensionsRef.current;
      
      // Limpar canvas
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      // Pré-definir estilo uma vez (evita mudança de estado por estrela)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';

      const stars = starsRef.current;
      const len = stars.length;
      
      for (let i = 0; i < len; i++) {
        const star = stars[i];
        
        // Movimento simples vertical
        star.y += star.speed;

        // Wrap around
        if (star.y > height + 5) {
          star.y = -5;
          star.x = Math.random() * width;
        }

        // Desenhar estrela simples (sem glow, sem gradiente)
        ctx.globalAlpha = star.alpha;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.globalAlpha = 1;

      animationRef.current = requestAnimationFrame(animate);
    };

    // Throttled resize handler - apenas no desktop
    let resizeTimeout: number;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(resizeCanvas, 150);
    };

    resizeCanvas();
    animate();

    // No mobile, não escuta resize para evitar reset das estrelas quando barras do navegador mudam
    if (!isMobileRef.current) {
      window.addEventListener('resize', handleResize, { passive: true });
    }

    return () => {
      if (!isMobileRef.current) {
        window.removeEventListener('resize', handleResize);
      }
      clearTimeout(resizeTimeout);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative w-screen overflow-hidden bg-black flex items-center justify-center"
      style={{ 
        marginLeft: 'calc(-50vw + 50%)', 
        marginRight: 'calc(-50vw + 50%)',
        ...(isMobile 
          ? { height: viewportHeight || '100svh' }  // Mobile: altura fixa para evitar jump
          : { minHeight: '100vh' }                   // Desktop: min-height para permitir expansão
        )
      }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ willChange: 'transform' }}
      />

      <div className="relative z-10 flex flex-col items-center justify-center px-6">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white text-center tracking-[0.15em] md:tracking-[0.2em] leading-tight"
        >
          COTE AGORA O SEU FRETE!
        </motion.h2>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
          viewport={{ once: true }}
          className="
            mt-10 md:mt-14 px-8 md:px-12 py-4 md:py-5
            border border-white/60 text-white text-sm md:text-base
            font-medium tracking-[0.2em] uppercase
            bg-transparent
            transition-[border-color,box-shadow] duration-500 ease-out
            hover:border-white hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]
            focus:outline-none focus:ring-2 focus:ring-white/30
          "
        >
          Solicitar Cotação
        </motion.button>
      </div>

      {/* Watermark footer */}
      <div
        aria-hidden
        className="absolute left-1/2 bottom-4 z-50 pointer-events-none text-foreground text-xs w-full text-center mb-2"
        style={{
          transform: 'translateX(-50%)',
          fontFamily: '"Roboto Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, monospace',
          letterSpacing: '0.35em',
          textTransform: 'uppercase',
          userSelect: 'none',
        }}
      >
        @2026 Transuniverso.
      </div>
    </section>
  );
};

export default UniverseCTA;
