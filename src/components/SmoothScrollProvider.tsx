import { ReactLenis } from 'lenis/react';
import { ReactNode, useState, useEffect } from 'react';

interface SmoothScrollProviderProps {
  children: ReactNode;
}

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
      }}
    >
      {children}
    </ReactLenis>
  );
};

export default SmoothScrollProvider;
