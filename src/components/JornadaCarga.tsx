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

  // ScrollTrigger apenas para DESKTOP
  useEffect(() => {
    if (isMobile) return;

    const section = sectionRef.current;
    const container = containerRef.current;
    const cards = cardsRef.current;

    if (!section || !container || !cards) return;

    const getScrollAmount = () => cards.scrollWidth - window.innerWidth;

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
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const progress = self.progress;
            const cardIndex = Math.min(
              Math.floor(progress * journeyCards.length),
              journeyCards.length - 1
            );

            if (cardIndex !== lastActiveIndex) {
              lastActiveIndex = cardIndex;
              section.style.backgroundColor = journeyCards[cardIndex].bgColor;
              setActiveIndex(cardIndex);
            }
          },
        },
      });
    }, section);

    return () => ctx.revert();
  }, [isMobile]);

  // MOBILE: Layout vertical simples
  if (isMobile) {
    return (
      <section className="relative bg-[#0a0a0f] py-16">
        <div className="px-5 mb-8">
          <span className="text-[10px] tracking-[0.3em] text-gray-500 uppercase">
            Jornada da Carga
          </span>
        </div>

        <div className="flex flex-col gap-12 px-5">
          {journeyCards.map((card, index) => (
            <div
              key={card.id}
              className="relative"
              style={{ backgroundColor: card.bgColor }}
            >
              <div className="py-8 px-4 rounded-xl">
                <span className="tracking-[0.2em] text-[#ff0000]/80 font-medium mb-2 block text-xs">
                  {card.title}
                </span>

                <h2 className="font-extrabold text-white mb-3 leading-[1.1] tracking-tight text-2xl">
                  {card.subtitle}
                </h2>

                <p className="text-gray-400 leading-relaxed tracking-wide text-sm mb-4">
                  {card.description}
                </p>

                <div className="h-[2px] bg-gradient-to-r from-[#ff0000] to-transparent w-[40%] mb-6" />

                {/* Image placeholder - Mobile */}
                <div className="flex justify-center">
                  <div className="w-36 h-36 rounded-2xl border-2 border-dashed border-white/20 flex items-center justify-center bg-white/5">
                    <div className="text-center text-white/40">
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className="mx-auto mb-1 w-8 h-8"
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="block text-[10px]">Imagem {index + 1}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // DESKTOP: Layout horizontal com scroll
  return (
    <section 
      ref={sectionRef}
      className="relative"
      style={{ 
        backgroundColor: journeyCards[0].bgColor,
        transition: 'background-color 0.5s ease-out',
      }}
    >
      <div className="absolute top-8 left-8 z-20">
        <span className="text-xs tracking-[0.3em] text-gray-500 uppercase">
          Jornada da Carga
        </span>
      </div>

      <div 
        ref={containerRef} 
        className="h-screen overflow-hidden"
      >
        <div 
          ref={cardsRef}
          className="flex h-full"
          style={{ width: `${journeyCards.length * 100}vw` }}
        >
          {journeyCards.map((card, index) => (
            <div
              key={card.id}
              className="relative flex-shrink-0 flex items-center h-screen w-screen"
            >
              {/* Decorative background */}
              <div className="absolute pointer-events-none right-[10%] top-1/2 -translate-y-1/2 w-[40vw] h-[40vw] opacity-20">
                <div 
                  className="w-full h-full rounded-full"
                  style={{
                    background: `radial-gradient(circle, ${card.bgColor === '#0a0a0f' ? 'rgba(249,115,22,0.3)' : 'rgba(147,51,234,0.2)'} 0%, transparent 70%)`,
                    filter: 'blur(60px)',
                  }}
                />
              </div>

              {/* Image placeholder */}
              <div 
                className="absolute pointer-events-none right-[12%] top-1/2 -translate-y-1/2 w-[30vw] h-[30vw] max-w-[500px] max-h-[500px]"
                style={{ zIndex: 1 }}
              >
                <div className="w-full h-full rounded-2xl border-2 border-dashed border-white/20 flex items-center justify-center bg-white/5 backdrop-blur-sm">
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
                    <span className="block text-sm">Imagem {index + 1}</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="relative z-10 px-8 md:px-16 lg:px-24">
                <motion.div
                  className="max-w-[40%]"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span className="tracking-[0.2em] text-[#ff0000] font-medium mb-4 block text-sm">
                    {card.title}
                  </span>

                  <h2 className="font-extrabold text-white mb-8 leading-[1.1] tracking-tight text-4xl md:text-5xl lg:text-6xl">
                    {card.subtitle}
                  </h2>

                  <p className="text-gray-400 leading-relaxed tracking-wide text-lg md:text-xl max-w-lg">
                    {card.description}
                  </p>

                  <motion.div
                    className="mt-12 h-[2px] bg-gradient-to-r from-[#ff0000] to-transparent"
                    initial={{ width: 0 }}
                    whileInView={{ width: '60%' }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  />
                </motion.div>
              </div>
            </div>
          ))}
        </div>

        {/* Progress indicator - Desktop only */}
        <div className="absolute bottom-12 left-8 md:left-16 lg:left-24 flex items-center gap-3 z-50">
          {journeyCards.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === activeIndex ? 'bg-[#ff0000] w-8' : 'bg-gray-600 w-2'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default JornadaCarga;