import { useEffect, useRef, useState } from "react";

const CustomCursor = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState<boolean | null>(null); // null = ainda não verificou

  // Primeiro effect: apenas detectar se é mobile
  useEffect(() => {
    const checkMobile = () => {
      return (
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        window.innerWidth < 768
      );
    };
    setIsMobile(checkMobile());
  }, []);

  // Segundo effect: inicializar cursor apenas quando não for mobile E refs existirem
  useEffect(() => {
    // Aguardar detecção de mobile
    if (isMobile === null || isMobile === true) return;

    const cursor = cursorRef.current;
    const cursorDot = cursorDotRef.current;

    if (!cursor || !cursorDot) return;

    // Mouse position
    let mouseX = -100;
    let mouseY = -100;
    let cursorX = -100;
    let cursorY = -100;
    let dotX = -100;
    let dotY = -100;
    let animationId: number | null = null;
    let isMoving = false;
    let idleTimeout: number | null = null;

    // Animate cursor with inertia - só roda quando necessário
    const animate = () => {
      // Calcular diferença
      const dxCursor = mouseX - cursorX;
      const dyCursor = mouseY - cursorY;
      const dxDot = mouseX - dotX;
      const dyDot = mouseY - dotY;

      // Só atualizar se a diferença for significativa (> 0.1px)
      const threshold = 0.1;
      const needsUpdate =
        Math.abs(dxCursor) > threshold ||
        Math.abs(dyCursor) > threshold ||
        Math.abs(dxDot) > threshold ||
        Math.abs(dyDot) > threshold;

      if (needsUpdate) {
        // Smooth follow for outer cursor (more lag)
        cursorX += dxCursor * 0.15;
        cursorY += dyCursor * 0.15;

        // Faster follow for inner dot
        dotX += dxDot * 0.35;
        dotY += dyDot * 0.35;

        // Usar transform direto (mais rápido que gsap.set)
        cursor.style.transform = `translate(${cursorX - 20}px, ${cursorY - 20}px)`;
        cursorDot.style.transform = `translate(${dotX - 4}px, ${dotY - 4}px)`;

        animationId = requestAnimationFrame(animate);
      } else {
        // Parar animação quando cursor parou
        isMoving = false;
        animationId = null;
      }
    };

    // Iniciar animação apenas quando mouse move
    const startAnimation = () => {
      if (!isMoving) {
        isMoving = true;
        if (animationId === null) {
          animationId = requestAnimationFrame(animate);
        }
      }

      // Reset idle timeout
      if (idleTimeout) clearTimeout(idleTimeout);
      idleTimeout = window.setTimeout(() => {
        isMoving = false;
      }, 100);
    };

    // Track mouse position
    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      startAnimation();
    };

    // Handle hover states - usando CSS transitions em vez de GSAP
    const handleMouseEnter = () => {
      cursor.style.transform = `translate(${cursorX - 20}px, ${cursorY - 20}px) scale(2)`;
      cursorDot.style.opacity = "0";
    };

    const handleMouseLeave = () => {
      cursor.style.transform = `translate(${cursorX - 20}px, ${cursorY - 20}px) scale(1)`;
      cursorDot.style.opacity = "1";
    };

    // Add event listeners com passive para melhor performance
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    // Add hover listeners to interactive elements
    const interactiveElements = document.querySelectorAll(
      'a, button, [data-magnetic], input, textarea, [role="button"]'
    );

    interactiveElements.forEach((el) => {
      el.addEventListener("mouseenter", handleMouseEnter);
      el.addEventListener("mouseleave", handleMouseLeave);
    });

    // Hide default cursor
    document.body.style.cursor = "none";

    return () => {
      if (animationId !== null) {
        cancelAnimationFrame(animationId);
      }
      if (idleTimeout) clearTimeout(idleTimeout);
      window.removeEventListener("mousemove", onMouseMove);
      document.body.style.cursor = "auto";
      interactiveElements.forEach((el) => {
        el.removeEventListener("mouseenter", handleMouseEnter);
        el.removeEventListener("mouseleave", handleMouseLeave);
      });
    };
  }, [isMobile]); // Re-executar quando isMobile mudar

  // Não renderizar nada no mobile ou enquanto ainda não detectou
  if (isMobile === null || isMobile === true) return null;

  return (
    <>
      {/* Outer cursor ring */}
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 w-10 h-10 pointer-events-none z-[9999] mix-blend-difference"
        style={{
          transform: "translate(-100px, -100px)",
          transition: "transform 0.1s ease-out",
          willChange: "transform",
        }}
      >
        <div className="w-full h-full rounded-full border-2 border-white opacity-80" />
      </div>

      {/* Inner cursor dot */}
      <div
        ref={cursorDotRef}
        className="fixed top-0 left-0 w-2 h-2 pointer-events-none z-[9999] mix-blend-difference"
        style={{
          transform: "translate(-100px, -100px)",
          transition: "opacity 0.2s ease-out",
          willChange: "transform",
        }}
      >
        <div className="w-full h-full rounded-full bg-white" />
      </div>
    </>
  );
};

export default CustomCursor;
