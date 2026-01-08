import { useEffect, useState, useCallback } from 'react';

/**
 * Hook para obter uma altura de viewport estável em dispositivos móveis.
 * 
 * PROBLEMA: Em mobile, quando o usuário rola a página, a barra de endereços
 * do navegador (Chrome/Safari) some, causando recálculo de 100vh e layout shift.
 * 
 * SOLUÇÃO: Capturamos a altura inicial (com a barra visível) e mantemos fixa.
 * Também definimos variáveis CSS globais para uso em qualquer componente.
 */

const MOBILE_BREAKPOINT = 768;

interface ViewportDimensions {
  height: number;
  width: number;
  isMobile: boolean;
}

// Armazena o valor inicial para evitar recálculos
let initialHeight: number | null = null;
let initialWidth: number | null = null;

export function useStableViewport(): ViewportDimensions {
  const [dimensions, setDimensions] = useState<ViewportDimensions>({
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    isMobile: typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false,
  });

  const updateCSSVariables = useCallback((height: number, width: number) => {
    // Define variáveis CSS globais para uso em qualquer lugar
    document.documentElement.style.setProperty('--vh-stable', `${height}px`);
    document.documentElement.style.setProperty('--vw-stable', `${width}px`);
    document.documentElement.style.setProperty('--vh-unit', `${height * 0.01}px`);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isMobile = window.innerWidth < MOBILE_BREAKPOINT;

    // Em mobile: captura altura UMA VEZ e mantém fixa
    // Em desktop: permite atualizações normais
    if (isMobile) {
      if (initialHeight === null) {
        initialHeight = window.innerHeight;
        initialWidth = window.innerWidth;
      }
      
      setDimensions({
        height: initialHeight,
        width: initialWidth!,
        isMobile: true,
      });
      
      updateCSSVariables(initialHeight, initialWidth!);
    } else {
      // Desktop: comportamento normal
      const height = window.innerHeight;
      const width = window.innerWidth;
      
      setDimensions({
        height,
        width,
        isMobile: false,
      });
      
      updateCSSVariables(height, width);
    }

    // Handler para resize - só atualiza em desktop ou em mudança significativa de orientação
    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newIsMobile = newWidth < MOBILE_BREAKPOINT;
      
      if (newIsMobile) {
        // Em mobile: só atualiza se houver mudança de orientação (width muda muito)
        if (initialWidth !== null && Math.abs(newWidth - initialWidth) > 100) {
          // Mudança de orientação detectada - recaptura
          initialHeight = window.innerHeight;
          initialWidth = newWidth;
          
          setDimensions({
            height: initialHeight,
            width: initialWidth,
            isMobile: true,
          });
          
          updateCSSVariables(initialHeight, initialWidth);
        }
      } else {
        // Desktop: atualiza normalmente
        const height = window.innerHeight;
        
        // Reset valores mobile quando volta para desktop
        initialHeight = null;
        initialWidth = null;
        
        setDimensions({
          height,
          width: newWidth,
          isMobile: false,
        });
        
        updateCSSVariables(height, newWidth);
      }
    };

    // Usa debounce para evitar muitas atualizações
    let timeoutId: ReturnType<typeof setTimeout>;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', debouncedResize);
    
    // Handler para orientação - sempre recaptura
    const handleOrientationChange = () => {
      // Espera a animação de orientação terminar
      setTimeout(() => {
        initialHeight = window.innerHeight;
        initialWidth = window.innerWidth;
        
        const isMob = initialWidth < MOBILE_BREAKPOINT;
        
        setDimensions({
          height: initialHeight,
          width: initialWidth,
          isMobile: isMob,
        });
        
        updateCSSVariables(initialHeight, initialWidth);
      }, 150);
    };

    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', debouncedResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      clearTimeout(timeoutId);
    };
  }, [updateCSSVariables]);

  return dimensions;
}

/**
 * Hook simplificado que retorna apenas a altura estável
 */
export function useStableHeight(): number {
  const { height } = useStableViewport();
  return height;
}

/**
 * Reset manual dos valores (útil para testes ou casos especiais)
 */
export function resetViewportCache() {
  initialHeight = null;
  initialWidth = null;
}
