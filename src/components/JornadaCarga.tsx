import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useIsMobile } from '@/hooks/use-mobile';

gsap.registerPlugin(ScrollTrigger);

interface JourneyCard {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  bgColor: string;
}

// Placeholder content - will be replaced with actual content
const journeyCards: JourneyCard[] = [
  {
    id: 1,
    title: "Etapa 01",
    subtitle: "Título da Primeira Etapa",
    description: "Descrição detalhada da primeira etapa da jornada da carga. Texto explicativo sobre o processo.",
    bgColor: "#0a0a0f",
  },
  {
    id: 2,
    title: "Etapa 02",
    subtitle: "Título da Segunda Etapa",
    description: "Descrição detalhada da segunda etapa da jornada da carga. Texto explicativo sobre o processo.",
    bgColor: "#0d1b2a",
  },
  {
    id: 3,
    title: "Etapa 03",
    subtitle: "Título da Terceira Etapa",
    description: "Descrição detalhada da terceira etapa da jornada da carga. Texto explicativo sobre o processo.",
    bgColor: "#1a1a2e",
  },
  {
    id: 4,
    title: "Etapa 04",
    subtitle: "Título da Quarta Etapa",
    description: "Descrição detalhada da quarta etapa da jornada da carga. Texto explicativo sobre o processo.",
    bgColor: "#16213e",
  },
  {
    id: 5,
    title: "Etapa 05",
    subtitle: "Título da Quinta Etapa",
    description: "Descrição detalhada da quinta etapa da jornada da carga. Texto explicativo sobre o processo.",
    bgColor: "#0f0f23",
  },
];

const JornadaCarga = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const [currentBgColor, setCurrentBgColor] = useState(journeyCards[0].bgColor);
  const [activeIndex, setActiveIndex] = useState(0);
  const isMobile = useIsMobile();

  useEffect(() => {
    const section = sectionRef.current;
    const container = containerRef.current;
    const cards = cardsRef.current;

    if (!section || !container || !cards) return;

    // Calculate total scroll width based on device
    const cardWidth = isMobile ? window.innerWidth * 0.85 : window.innerWidth;
    const gap = isMobile ? 16 : 0; // gap between cards on mobile
    const totalCards = journeyCards.length;
    const totalWidth = (cardWidth + gap) * totalCards - window.innerWidth;

    const ctx = gsap.context(() => {
      gsap.to(cards, {
        x: -totalWidth,
        ease: "none",
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: () => `+=${totalWidth}`,
          pin: true,
          scrub: isMobile ? 0.5 : 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          refreshPriority: 1,
          onUpdate: (self) => {
            const progress = self.progress;
            const cardIndex = Math.min(
              Math.floor(progress * journeyCards.length),
              journeyCards.length - 1
            );
            
            setActiveIndex(cardIndex);
            
            const nextIndex = Math.min(cardIndex + 1, journeyCards.length - 1);
            const localProgress = (progress * journeyCards.length) % 1;
            
            const currentColor = journeyCards[cardIndex].bgColor;
            const nextColor = journeyCards[nextIndex].bgColor;
            
            const interpolatedColor = interpolateColor(currentColor, nextColor, localProgress);
            setCurrentBgColor(interpolatedColor);
          },
        },
      });
    }, section);

    return () => ctx.revert();
  }, [isMobile]);

  const interpolateColor = (color1: string, color2: string, factor: number): string => {
    const hex1 = color1.replace('#', '');
    const hex2 = color2.replace('#', '');
    
    const r1 = parseInt(hex1.substring(0, 2), 16);
    const g1 = parseInt(hex1.substring(2, 4), 16);
    const b1 = parseInt(hex1.substring(4, 6), 16);
    
    const r2 = parseInt(hex2.substring(0, 2), 16);
    const g2 = parseInt(hex2.substring(2, 4), 16);
    const b2 = parseInt(hex2.substring(4, 6), 16);
    
    const r = Math.round(r1 + (r2 - r1) * factor);
    const g = Math.round(g1 + (g2 - g1) * factor);
    const b = Math.round(b1 + (b2 - b1) * factor);
    
    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <section 
      ref={sectionRef}
      className="relative"
      style={{ 
        backgroundColor: currentBgColor, 
        transition: 'background-color 0.1s ease-out',
        overscrollBehavior: 'none',
      }}
    >
      <div className="absolute top-6 md:top-8 left-6 md:left-8 z-20">
        <span className="text-[10px] md:text-xs tracking-[0.3em] text-gray-500 uppercase">Jornada da Carga</span>
      </div>

      <div 
        ref={containerRef} 
        className="h-screen overflow-hidden"
        style={{ touchAction: 'pan-y pinch-zoom' }}
      >
        <div 
          ref={cardsRef}
          className={`flex h-full ${isMobile ? 'gap-4 pl-4' : ''}`}
          style={{ width: 'fit-content' }}
        >
          {/* Horizontal line decoration - only on desktop */}
          {!isMobile && (
            <div className="fixed top-1/2 left-0 right-0 h-[1px] z-10 pointer-events-none">
              <div className="w-full h-full bg-gradient-to-r from-transparent via-orange-500/40 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/30 to-transparent blur-sm animate-pulse" />
            </div>
          )}

          {journeyCards.map((card, index) => (
            <div
              key={card.id}
              className={`relative flex-shrink-0 flex items-center ${
                isMobile 
                  ? 'w-[85vw] h-screen rounded-2xl overflow-hidden' 
                  : 'w-full h-screen'
              }`}
              style={isMobile ? { backgroundColor: card.bgColor } : undefined}
            >
              {/* Decorative background element */}
              <div className={`absolute ${isMobile ? 'right-4 top-1/4' : 'right-[10%] top-1/2 -translate-y-1/2'} ${isMobile ? 'w-32 h-32' : 'w-[40vw] h-[40vw]'} opacity-20`}>
                <div 
                  className="w-full h-full rounded-full"
                  style={{
                    background: `radial-gradient(circle, ${card.bgColor === '#0a0a0f' ? 'rgba(249,115,22,0.3)' : 'rgba(147,51,234,0.2)'} 0%, transparent 70%)`,
                    filter: isMobile ? 'blur(30px)' : 'blur(60px)',
                  }}
                />
                {!isMobile && (
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `conic-gradient(from ${index * 72}deg, transparent, rgba(249,115,22,0.1), transparent)`,
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  />
                )}
              </div>

              {/* Content */}
              <div className={`relative z-10 w-full ${isMobile ? 'px-5 py-8' : 'px-8 md:px-16 lg:px-24'}`}>
                <motion.div
                  className={isMobile ? 'max-w-full' : 'max-w-[40%]'}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.5 }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span className={`tracking-[0.2em] text-orange-500/80 font-medium mb-3 md:mb-4 block ${isMobile ? 'text-xs' : 'text-sm'}`}>
                    {card.title}
                  </span>

                  <h2 className={`font-extrabold text-white mb-4 md:mb-8 leading-[1.1] tracking-tight ${isMobile ? 'text-2xl' : 'text-4xl md:text-5xl lg:text-7xl'}`}>
                    {card.subtitle}
                  </h2>

                  <p className={`text-gray-400 leading-relaxed tracking-wide ${isMobile ? 'text-sm max-w-[90%]' : 'text-lg md:text-xl max-w-lg'}`}>
                    {card.description}
                  </p>

                  <motion.div
                    className={`mt-6 md:mt-12 h-[2px] bg-gradient-to-r from-orange-500 to-transparent`}
                    initial={{ width: 0 }}
                    whileInView={{ width: isMobile ? '40%' : '60%' }}
                    viewport={{ once: false, amount: 0.5 }}
                    transition={{ duration: 1, delay: 0.3 }}
                  />
                </motion.div>
              </div>

              {/* Card indicator on mobile */}
              {isMobile && (
                <div className="absolute bottom-8 left-5 text-xs text-gray-500">
                  {String(index + 1).padStart(2, '0')} / {String(journeyCards.length).padStart(2, '0')}
                </div>
              )}
            </div>
          ))}
          
          {/* Extra padding at the end for mobile */}
          {isMobile && <div className="w-4 flex-shrink-0" />}
        </div>
      </div>

      {/* Progress indicator */}
      <div className={`absolute ${isMobile ? 'bottom-8 right-5' : 'bottom-12 left-8 md:left-16 lg:left-24'} flex items-center gap-2 md:gap-3 z-20`}>
        {journeyCards.map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === activeIndex 
                ? 'bg-orange-500 w-6 md:w-8' 
                : 'bg-gray-600 w-2'
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default JornadaCarga;
