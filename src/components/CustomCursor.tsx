import { useEffect, useRef } from "react";
import gsap from "gsap";

const CustomCursor = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorDotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const cursorDot = cursorDotRef.current;
    
    if (!cursor || !cursorDot) return;

    // Mouse position
    const mouse = { x: 0, y: 0 };
    const cursorPos = { x: 0, y: 0 };
    const dotPos = { x: 0, y: 0 };

    // Track mouse position
    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    // Animate cursor with inertia
    const animate = () => {
      // Smooth follow for outer cursor (more lag)
      cursorPos.x += (mouse.x - cursorPos.x) * 0.15;
      cursorPos.y += (mouse.y - cursorPos.y) * 0.15;
      
      // Faster follow for inner dot
      dotPos.x += (mouse.x - dotPos.x) * 0.35;
      dotPos.y += (mouse.y - dotPos.y) * 0.35;

      gsap.set(cursor, {
        x: cursorPos.x,
        y: cursorPos.y,
      });

      gsap.set(cursorDot, {
        x: dotPos.x,
        y: dotPos.y,
      });

      requestAnimationFrame(animate);
    };

    // Handle hover states
    const handleMouseEnter = () => {
      gsap.to(cursor, {
        scale: 2,
        duration: 0.3,
        ease: "power2.out",
      });
      gsap.to(cursorDot, {
        opacity: 0,
        duration: 0.2,
      });
    };

    const handleMouseLeave = () => {
      gsap.to(cursor, {
        scale: 1,
        duration: 0.3,
        ease: "power2.out",
      });
      gsap.to(cursorDot, {
        opacity: 1,
        duration: 0.2,
      });
    };

    // Add event listeners
    window.addEventListener("mousemove", onMouseMove);
    animate();

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
      window.removeEventListener("mousemove", onMouseMove);
      document.body.style.cursor = "auto";
      interactiveElements.forEach((el) => {
        el.removeEventListener("mouseenter", handleMouseEnter);
        el.removeEventListener("mouseleave", handleMouseLeave);
      });
    };
  }, []);

  // Hide on mobile/touch devices
  if (typeof window !== "undefined" && "ontouchstart" in window) {
    return null;
  }

  return (
    <>
      {/* Outer cursor ring */}
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 w-10 h-10 pointer-events-none z-[9999] mix-blend-difference"
        style={{ transform: "translate(-50%, -50%)" }}
      >
        <div className="w-full h-full rounded-full border-2 border-white opacity-80" />
      </div>
      
      {/* Inner cursor dot */}
      <div
        ref={cursorDotRef}
        className="fixed top-0 left-0 w-2 h-2 pointer-events-none z-[9999] mix-blend-difference"
        style={{ transform: "translate(-50%, -50%)" }}
      >
        <div className="w-full h-full rounded-full bg-white" />
      </div>
    </>
  );
};

export default CustomCursor;
