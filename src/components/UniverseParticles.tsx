import { useRef, useEffect, useCallback } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  pulsePhase: number;
  pulseSpeed: number;
  brightness: number;
  type: "city" | "cargo"; // city = larger & brighter, cargo = smaller & moving faster
}

const CONNECTION_DISTANCE = 160;
const PARTICLE_DENSITY = 0.00008; // particles per square pixel
const MIN_PARTICLES = 40;
const MAX_PARTICLES = 180;

const UniverseParticles = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);
  const isVisibleRef = useRef<boolean>(true);
  const drawFnRef = useRef<(() => void) | null>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });

  const createParticle = useCallback(
    (width: number, height: number): Particle => {
      const isCity = Math.random() < 0.3;
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * (isCity ? 0.15 : 0.4),
        vy: (Math.random() - 0.5) * (isCity ? 0.15 : 0.4),
        radius: isCity ? 2 + Math.random() * 1.5 : 1 + Math.random() * 1,
        baseRadius: isCity ? 2 + Math.random() * 1.5 : 1 + Math.random() * 1,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.005 + Math.random() * 0.015,
        brightness: isCity ? 0.8 + Math.random() * 0.2 : 0.4 + Math.random() * 0.3,
        type: isCity ? "city" : "cargo",
      };
    },
    []
  );

  const initParticles = useCallback(
    (width: number, height: number) => {
      const count = Math.min(
        MAX_PARTICLES,
        Math.max(MIN_PARTICLES, Math.floor(width * height * PARTICLE_DENSITY))
      );
      particlesRef.current = Array.from({ length: count }, () =>
        createParticle(width, height)
      );
    },
    [createParticle]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (particlesRef.current.length === 0) {
        initParticles(rect.width, rect.height);
      }
    };

    resize();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    let time = 0;

    const draw = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;

      const w = rect.width;
      const h = rect.height;

      // Dark space background
      ctx.fillStyle = "#050a14";
      ctx.fillRect(0, 0, w, h);

      // Subtle radial gradient overlay for depth
      const gradient = ctx.createRadialGradient(
        w * 0.5,
        h * 0.4,
        0,
        w * 0.5,
        h * 0.4,
        w * 0.7
      );
      gradient.addColorStop(0, "rgba(15, 30, 60, 0.3)");
      gradient.addColorStop(0.5, "rgba(8, 15, 35, 0.1)");
      gradient.addColorStop(1, "rgba(3, 5, 12, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      time += 1;

      const particles = particlesRef.current;
      const mouse = mouseRef.current;

      // Update particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        // Pulse
        p.pulsePhase += p.pulseSpeed;
        p.radius =
          p.baseRadius * (1 + 0.3 * Math.sin(p.pulsePhase));

        // Wrap around edges with margin
        const margin = 20;
        if (p.x < -margin) p.x = w + margin;
        if (p.x > w + margin) p.x = -margin;
        if (p.y < -margin) p.y = h + margin;
        if (p.y > h + margin) p.y = -margin;

        // Subtle mouse interaction — particles gently drift away
        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 200 && dist > 0) {
            const force = (200 - dist) / 200;
            p.vx += (dx / dist) * force * 0.02;
            p.vy += (dy / dist) * force * 0.02;
          }
        }

        // Speed damping
        const maxSpeed = p.type === "city" ? 0.3 : 0.6;
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > maxSpeed) {
          p.vx = (p.vx / speed) * maxSpeed;
          p.vy = (p.vy / speed) * maxSpeed;
        }
      }

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONNECTION_DISTANCE) {
            const opacity =
              (1 - dist / CONNECTION_DISTANCE) * 0.25;

            // Animated dash effect for "route" look
            const isRoute =
              a.type === "city" && b.type === "city";

            if (isRoute) {
              // Solid brighter line between cities
              ctx.strokeStyle = `rgba(100, 180, 255, ${opacity * 1.2})`;
              ctx.lineWidth = 0.8;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            } else {
              // Subtle dotted line for cargo routes
              ctx.strokeStyle = `rgba(80, 140, 220, ${opacity * 0.8})`;
              ctx.lineWidth = 0.4;
              ctx.setLineDash([2, 4]);
              ctx.lineDashOffset = -time * 0.3;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
              ctx.setLineDash([]);
            }
          }
        }
      }

      // Draw particles
      for (const p of particles) {
        // Outer glow
        const glowRadius = p.radius * (p.type === "city" ? 6 : 3);
        const glow = ctx.createRadialGradient(
          p.x,
          p.y,
          0,
          p.x,
          p.y,
          glowRadius
        );

        if (p.type === "city") {
          glow.addColorStop(
            0,
            `rgba(140, 200, 255, ${p.brightness * 0.4})`
          );
          glow.addColorStop(
            0.4,
            `rgba(80, 150, 255, ${p.brightness * 0.15})`
          );
          glow.addColorStop(1, "rgba(40, 80, 200, 0)");
        } else {
          glow.addColorStop(
            0,
            `rgba(180, 220, 255, ${p.brightness * 0.3})`
          );
          glow.addColorStop(
            0.5,
            `rgba(100, 160, 255, ${p.brightness * 0.08})`
          );
          glow.addColorStop(1, "rgba(60, 100, 200, 0)");
        }

        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle =
          p.type === "city"
            ? `rgba(200, 230, 255, ${p.brightness})`
            : `rgba(160, 200, 255, ${p.brightness * 0.9})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Mouse pointer glow
      if (mouse.active) {
        const mouseGlow = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          120
        );
        mouseGlow.addColorStop(0, "rgba(100, 180, 255, 0.06)");
        mouseGlow.addColorStop(0.5, "rgba(60, 120, 220, 0.02)");
        mouseGlow.addColorStop(1, "rgba(30, 60, 150, 0)");
        ctx.fillStyle = mouseGlow;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 120, 0, Math.PI * 2);
        ctx.fill();
      }

      if (isVisibleRef.current) {
        animFrameRef.current = requestAnimationFrame(draw);
      }
    };

    // Store draw function so the observer can restart the loop
    drawFnRef.current = draw;

    animFrameRef.current = requestAnimationFrame(draw);

    const resizeObserver = new ResizeObserver(() => {
      resize();
    });
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    // IntersectionObserver: pause animation when hero is fully off-screen
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        const wasVisible = isVisibleRef.current;
        isVisibleRef.current = entry.isIntersecting;

        // Restart animation loop when becoming visible again
        if (!wasVisible && entry.isIntersecting && drawFnRef.current) {
          cancelAnimationFrame(animFrameRef.current);
          animFrameRef.current = requestAnimationFrame(drawFnRef.current);
        }

        // Stop loop when leaving viewport
        if (!entry.isIntersecting) {
          cancelAnimationFrame(animFrameRef.current);
        }
      },
      { threshold: 0 } // fires when even 1px leaves/enters
    );

    if (canvas.parentElement) {
      intersectionObserver.observe(canvas.parentElement);
    }

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, [initParticles]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ display: "block" }}
    />
  );
};

export default UniverseParticles;
