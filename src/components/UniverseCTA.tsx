import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Star {
  x: number;
  y: number;
  z: number;
  originalX: number;
  originalY: number;
  size: number;
  speed: number;
  vx: number;
  vy: number;
}

const UniverseCTA = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const starsRef = useRef<Star[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, active: false });
  const animationRef = useRef<number>();
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const buttonPosRef = useRef({ x: 0, y: 0, width: 0, height: 0 });

  const isButtonHoveredRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.scale(dpr, dpr);
      initStars(rect.width, rect.height);

      if (buttonRef.current) {
        const buttonRect = buttonRef.current.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        buttonPosRef.current = {
          x: buttonRect.left - containerRect.left,
          y: buttonRect.top - containerRect.top,
          width: buttonRect.width,
          height: buttonRect.height,
        };
      }
    };

    const initStars = (width: number, height: number) => {
      const isMobile = width < 768;
      const starCount = isMobile ? 150 : 300;
      starsRef.current = [];

      for (let i = 0; i < starCount; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        starsRef.current.push({
          x,
          y,
          z: Math.random() * 3,
          originalX: x,
          originalY: y,
          size: Math.random() * 2 + 0.5,
          speed: Math.random() * 0.3 + 0.1,
          vx: 0,
          vy: 0,
        });
      }
    };

    const animate = () => {
      const rect = container.getBoundingClientRect();
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, rect.width, rect.height);

      const mouse = mouseRef.current;
      const buttonHovered = isButtonHoveredRef.current;
      const buttonPos = buttonPosRef.current;

      starsRef.current.forEach((star) => {
        // Gravitational effect from mouse
        if (mouse.active) {
          const dx = mouse.x - star.x;
          const dy = mouse.y - star.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const maxDistance = 200;

          if (distance < maxDistance && distance > 0) {
            const force = (1 - distance / maxDistance) * 0.8;
            star.vx += (dx / distance) * force;
            star.vy += (dy / distance) * force;
          }
        }

        // Button orbit effect
        const buttonCenterX = buttonPos.x + buttonPos.width / 2;
        const buttonCenterY = buttonPos.y + buttonPos.height / 2;
        const dx = buttonCenterX - star.x;
        const dy = buttonCenterY - star.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const orbitRadius = 200;

        if (distance < orbitRadius && distance > 30) {
          const angle = Math.atan2(dy, dx);
          const orbitSpeed = (1 - distance / orbitRadius) * 0.15;
          star.vx += Math.cos(angle + Math.PI / 2) * orbitSpeed;
          star.vy += Math.sin(angle + Math.PI / 2) * orbitSpeed;
        }

        // Apply velocity with damping
        star.x += star.vx;
        star.y += star.vy;
        star.vx *= 0.95;
        star.vy *= 0.95;

        // Slow drift back to original position
        star.x += (star.originalX - star.x) * 0.01;
        star.y += (star.originalY - star.y) * 0.01;

        // Star movement (traveling through space)
        star.y += star.speed;
        star.originalY += star.speed;

        // Wrap around
        if (star.y > rect.height + 10) {
          star.y = -10;
          star.originalY = -10;
          star.x = Math.random() * rect.width;
          star.originalX = star.x;
        }

        // Draw star with glow
        const alpha = 0.4 + star.z * 0.2;
        const size = star.size * (0.5 + star.z * 0.3);

        ctx.beginPath();
        ctx.arc(star.x, star.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();

        // Add glow to larger stars
        if (star.size > 1.5) {
          ctx.beginPath();
          ctx.arc(star.x, star.y, size * 2, 0, Math.PI * 2);
          const gradient = ctx.createRadialGradient(
            star.x, star.y, 0,
            star.x, star.y, size * 3
          );
          gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.3})`);
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = gradient;
          ctx.fill();
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    resizeCanvas();
    animate();

    window.addEventListener('resize', resizeCanvas);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const handleButtonMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    isButtonHoveredRef.current = true;
    setIsButtonHovered(true);
  };

  const handleButtonMouseLeave = () => {
    isButtonHoveredRef.current = false;
    setIsButtonHovered(false);
  };

  return (
    <section
      ref={containerRef}
      className="relative w-screen h-screen overflow-hidden bg-black"
      style={{ marginLeft: 'calc(-50vw + 50%)', marginRight: 'calc(-50vw + 50%)' }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />

      <div className="relative z-10 flex flex-col items-center justify-center h-full px-6">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          viewport={{ once: true }}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white text-center tracking-[0.15em] md:tracking-[0.2em] leading-tight"
        >
          LOGÍSTICA SEM FRONTEIRAS.
        </motion.h2>

        <motion.button
          ref={buttonRef}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
          viewport={{ once: true }}
          onMouseEnter={handleButtonMouseEnter}
          onMouseLeave={handleButtonMouseLeave}
          className={`
            mt-10 md:mt-14 px-8 md:px-12 py-4 md:py-5
            border border-white/60 text-white text-sm md:text-base
            font-medium tracking-[0.2em] uppercase
            bg-transparent transition-all duration-500 ease-out
            hover:border-white hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]
            focus:outline-none focus:ring-2 focus:ring-white/30
          `}
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
