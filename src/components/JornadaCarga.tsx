import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useIsMobile } from '@/hooks/use-mobile';

gsap.registerPlugin(ScrollTrigger);

ScrollTrigger.config({
  ignoreMobileResize: true // Evita que a barra de endereços do mobile recalcule tudo ao sumir/aparecer
});

// REMOVIDO: ScrollTrigger.normalizeScroll(true) - muito pesado em mobile

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
    subtitle: "Solicitação de Transporte",
    description: "A solicitação acontece de forma simples e digital. As informações da carga são centralizadas e tratadas com inteligência para dar agilidade desde o primeiro contato.",
    bgColor: "#0a0a0f",
  },
  {
    id: 2,
    title: "Etapa 02",
    subtitle: "Planejamento Operacional",
    description: "Cada transporte é planejado com base em dados, rotas e capacidade operacional. A tecnologia garante decisões mais precisas, reduzindo riscos e aumentando a eficiência da operação.",
    bgColor: "#0d1b2a",
  },
  {
    id: 3,
    title: "Etapa 03",
    subtitle: "Coleta e Início do Transporte",
    description: "A coleta é realizada conforme o planejamento definido. A carga inicia o transporte com controle operacional e comunicação clara entre todos os envolvidos.",
    bgColor: "#1a1a2e",
  },
  {
    id: 4,
    title: "Etapa 04",
    subtitle: "Gestão de Risco e Monitoramento",
    description: "Durante todo o percurso, a carga é monitorada em tempo real. Protocolos de segurança, rastreamento e gestão de risco garantem mais proteção, previsibilidade e tranquilidade.",
    bgColor: "#16213e",
  },
  {
    id: 5,
    title: "Etapa 05",
    subtitle: "Entrega",
    description: "A entrega é concluída com confirmação e registro. O processo se encerra com visibilidade total do transporte e indicadores que reforçam pontualidade e performance.",
    bgColor: "#0f0f23",
  },
];

const JornadaCarga = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const isMobile = useIsMobile();

  useEffect(() => {
    const section = sectionRef.current;
    const container = containerRef.current;
    const cards = cardsRef.current;

    if (!section || !container || !cards) return;

    // Use actual DOM measurements for precise scrolling.
    // Horizontal scroll should END exactly when the last card is fully in view.
    const getScrollAmount = () => Math.max(0, cards.scrollWidth - window.innerWidth);

    let lastActiveIndex = 0;

    const ctx = gsap.context(() => {
      gsap.to(cards, {
        x: () => -getScrollAmount(),
        ease: "none",
        scrollTrigger: {
          trigger: container,
          start: "top top",
          end: () => `+=${getScrollAmount()}`,
          pin: true,
          pinSpacing: true,
          scrub: isMobile ? 1 : true, // Mobile: valor maior = menos recálculos, mais suave
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const progress = self.progress;
            const cardIndex = Math.min(
              Math.floor(progress * journeyCards.length),
              journeyCards.length - 1
            );

            // Apenas atualiza quando realmente muda de card
            if (cardIndex !== lastActiveIndex) {
              lastActiveIndex = cardIndex;
              
              // Usar CSS transition em vez de GSAP (mais leve)
              section.style.backgroundColor = journeyCards[cardIndex].bgColor;
              
              // Atualizar state apenas para o indicador de progresso
              setActiveIndex(cardIndex);
            }
          },
        },
      });
    }, section);

    return () => ctx.revert();
  }, [isMobile]);


  

  return (
    <section 
      ref={sectionRef}
      className="relative"
      style={{ 
        backgroundColor: journeyCards[0].bgColor,
        overscrollBehavior: 'none',
        transition: 'background-color 0.5s ease-out', // CSS transition em vez de GSAP
      }}
    >
      <div className="absolute top-6 md:top-8 left-6 md:left-8 z-20">
        <span className="text-[10px] md:text-xs tracking-[0.3em] text-gray-500 uppercase">Jornada da Carga</span>
      </div>

      <div 
        ref={containerRef} 
        className="h-screen-stable overflow-hidden"
        style={{ touchAction: 'pan-y pinch-zoom' }}
      >
        <div 
          ref={cardsRef}
          className={`flex h-full ${isMobile ? 'gap-0 pl-4' : ''}`}
          style={{ 
            width: isMobile ? 'fit-content' : `${journeyCards.length * 100}vw`,
            willChange: isMobile ? 'auto' : 'transform', // Mobile: desabilitar para economizar memória GPU
            backfaceVisibility: 'hidden',
            transform: 'translateZ(0)', // Força layer de composição
          }}
        >

          {journeyCards.map((card, index) => (
            <div
              key={card.id}
              className={`relative flex-shrink-0 flex items-center ${
                isMobile 
                  ? 'w-[93vw] h-screen-stable rounded-2xl overflow-hidden' 
                  : 'w-screen h-screen-stable'
              }`}
            >
              {/* Decorative background element - z-0 (mais atrás) */}
              <div 
                className={`absolute pointer-events-none ${
                  isMobile 
                    ? 'right-4 top-1/4 w-48 h-48 opacity-15' 
                    : 'right-[10%] top-1/2 -translate-y-1/2 w-[40vw] h-[40vw] opacity-20'
                }`}
                style={{ zIndex: 0 }}
              >
                <div 
                  className="w-full h-full rounded-full"
                  style={{
                    background: `radial-gradient(circle, ${card.bgColor === '#0a0a0f' ? 'rgba(249,115,22,0.3)' : 'rgba(147,51,234,0.2)'} 0%, transparent 70%)`,
                    filter: isMobile ? 'blur(40px)' : 'blur(60px)',
                  }}
                />
              </div>

              {/* Image placeholder - z-1 (meio) - APENAS DESKTOP */}
              {!isMobile && (
                <div 
                  className="absolute pointer-events-none right-[12%] top-1/2 -translate-y-1/2 w-[30vw] h-[30vw] max-w-[500px] max-h-[500px]"
                  style={{ zIndex: 1 }}
                >
                  {/* Placeholder - substitua pelo componente de imagem real */}
                  <div 
                    className="w-full h-full rounded-2xl border-2 border-dashed border-white/20 flex items-center justify-center bg-white/5 backdrop-blur-sm hover:border-white/40 transition-colors"
                  >
                    <div className="text-center text-white/40">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="mx-auto mb-2 w-16 h-16"
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="block text-sm">
                        Imagem {index + 1}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Content - z-10 (frente) */}
              <div className={`relative z-10 w-full overflow-hidden ${isMobile ? 'px-5 py-8' : 'px-8 md:px-16 lg:px-24'}`}>
                {/* Removido motion.div no mobile - usar CSS simples */}
                {isMobile ? (
                  <div className="w-full flex flex-col items-center">
                    <div className="w-full">
                      <span className="tracking-[0.2em] text-[#ff0000]/80 font-medium mb-3 block text-xs">
                        {card.title}
                      </span>

                      <h2 className="font-extrabold text-white mb-4 leading-[1.1] tracking-tight text-2xl">
                        {card.subtitle}
                      </h2>

                      <p className="text-gray-400 leading-relaxed tracking-wide text-sm w-full break-words">
                        {card.description}
                      </p>

                      <div 
                        className="mt-6 h-[2px] bg-gradient-to-r from-[#ff0000] to-transparent"
                        style={{ width: '40%' }}
                      />
                    </div>

                    {/* Image placeholder - MOBILE - centralizado abaixo do texto */}
                    <div className="mt-8 w-44 h-44">
                      <div 
                        className="w-full h-full rounded-2xl border-2 border-dashed border-white/20 flex items-center justify-center bg-white/5"
                      >
                        <div className="text-center text-white/40">
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="mx-auto mb-2 w-10 h-10"
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="block text-xs">
                            Imagem {index + 1}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <motion.div
                    className="max-w-[40%] overflow-hidden"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <span className="tracking-[0.2em] text-[#ff0000] font-medium mb-3 md:mb-4 block text-sm">
                      {card.title}
                    </span>

                    <h2 className="font-extrabold text-white mb-4 md:mb-8 leading-[1.1] tracking-tight text-4xl md:text-5xl lg:text-6xl">
                      {card.subtitle}
                    </h2>

                    <p className="text-gray-400 leading-relaxed tracking-wide text-lg md:text-xl max-w-lg">
                      {card.description}
                    </p>

                    <motion.div
                      className="mt-6 md:mt-12 h-[2px] bg-gradient-to-r from-[#ff0000] to-transparent"
                      initial={{ width: 0 }}
                      whileInView={{ width: '60%' }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                    />
                  </motion.div>
                )}
              </div>
            </div>
          ))}
          
          {/* Extra padding at the end for mobile */}
          {isMobile && <div className="w-4 flex-shrink-0" />}
        </div>

        {/* Progress indicator - moved inside container so it stays visible during pinned scroll */}
        <div className={`absolute ${isMobile ? 'bottom-8 right-5' : 'bottom-12 left-8 md:left-16 lg:left-24'} flex items-center gap-2 md:gap-3 z-50 pointer-events-none`}>
          {journeyCards.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === activeIndex 
                  ? 'bg-[#ff0000] w-6 md:w-8' 
                  : 'bg-gray-600 w-2'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default JornadaCarga;