import { ReactLenis, useLenis } from 'lenis/react';
import { ReactNode, useState, useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Registrar ScrollTrigger uma vez
gsap.registerPlugin(ScrollTrigger);

interface SmoothScrollProviderProps {
  children: ReactNode;
}

// Componente interno que sincroniza Lenis com GSAP ScrollTrigger
const ScrollTriggerSync = ({ children }: { children: ReactNode }) => {
  // A cada frame do Lenis, atualiza o ScrollTrigger
  useLenis(() => {
    ScrollTrigger.update();
  });

  return <>{children}</>;
};

const SmoothScrollProvider = ({ children }: SmoothScrollProviderProps) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Renderiza apenas no desktop, permitindo scroll nativo no mobile
  if (isMobile) {
    return <>{children}</>;
  }

  return (
    <ReactLenis
      root={true}
      options={{
        lerp: 0.1,
        duration: 1.2,
        smoothWheel: true,
        syncTouch: true, // Melhor sincronização em dispositivos touch
      }}
    >
      <ScrollTriggerSync>
        {children}
      </ScrollTriggerSync>
    </ReactLenis>
  );
};

export default SmoothScrollProvider;
