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
  subtitle: "Solicitação",
  description: "As informações da carga são registradas e nossa equipe analisa e retorna com uma proposta clara.",
  bgColor: "#0f172a",
},
{
  id: 2,
  title: "Etapa 02",
  subtitle: "Planejamento Operacional",
  description: "Antes de qualquer movimentação, a Transuniverso planeja cada detalhe: a melhor rota, o veículo adequado para o tipo de carga e o motorista responsável pelo serviço.",
  bgColor: "#070836",
},
{
  id: 3,
  title: "Etapa 03",
  subtitle: "Coleta e Início do Transporte",
  description: "Com o planejamento definido, a coleta acontece no tempo certo. A carga inicia seu percurso com controle operacional, comunicação clara e processos bem definidos desde a origem.",
  bgColor: "#163B49",
},
{
  id: 4,
  title: "Etapa 04",
  subtitle: "Seguro de Carga e Monitoramento",
  description: "Durante o percurso, a carga é acompanhada com monitoramento e conta com os seguros: RC-V, RCTR-C e RC-DC, garantindo proteção e tranquilidade.",
  bgColor: "#16222E",
},
{
  id: 5,
  title: "Etapa 05",
  subtitle: "Entrega Confirmada",
  description: "A jornada se encerra com a entrega confirmada e registrada. Você tem acesso ao histórico completo do transporte.",
  bgColor: "#0f172a",
}
];

const JornadaCarga = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewportHeight, setViewportHeight] = useState<string | null>(null);
  const isMobile = useIsMobile();

  // Captura altura apenas uma vez no mount (para mobile)
  useEffect(() => {
    if (isMobile) {
      setViewportHeight(`${window.innerHeight}px`);
    }
  }, [isMobile]);

  // ScrollTrigger para DESKTOP e MOBILE
  useEffect(() => {
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
          scrub: isMobile ? 0.5 : 0.8, // Mais responsivo no mobile
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

  return (
    <section 
      ref={sectionRef}
      className="relative"
      style={{ 
        backgroundColor: journeyCards[0].bgColor,
        transition: 'background-color 0.5s ease-out',
      }}
    >
      {/* Header label - alinhado com o conteúdo */}
      <div className="absolute mt-10 top-6 md:top-8 left-0 right-0 z-20 px-5 md:px-0">
        <div className="max-w-7xl mx-auto">
          <span className="text-[10px] md:text-xs tracking-[0.3em] text-gray-500 uppercase">
            Jornada da Carga
          </span>
        </div>
      </div>

      <div 
        ref={containerRef} 
        className="overflow-hidden"
        style={{ height: isMobile && viewportHeight ? viewportHeight : '100vh' }}
      >
        <div 
          ref={cardsRef}
          className="flex h-full"
          style={{ width: `${journeyCards.length * 100}vw` }}
        >
          {journeyCards.map((card, index) => (
            <div
              key={card.id}
              className="relative flex-shrink-0 flex items-center justify-center w-screen"
              style={{ height: isMobile && viewportHeight ? viewportHeight : '100vh' }}
            >
              
              {/* Content */}
              <div className="relative z-10 md:mt-[-6rem] flex flex-col items-center justify-center text-center px-5 w-full">
                {/* Número grande centralizado */}
                <motion.div
                  className="relative flex items-center justify-center w-full"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  style={{ minHeight: '1em' }}
                >
                  {/* Número com máscara de gradiente para corte */}
                  <span
                    className="text-[15rem] md:text-[20rem] font-medium text-white/10 leading-none select-none block w-full"
                    style={{
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      WebkitMaskImage: 'linear-gradient(to bottom, #fff 70%, transparent 71%)',
                      maskImage: 'linear-gradient(to bottom, #fff 70%, transparent 71%)',
                    }}
                  >
                    {String(card.id).padStart(2, '0')}
                  </span>
                  {/* Linha gradient sobreposta */}
                  <span
                    className="mx-auto pointer-events-none absolute left-0 right-0"
                    style={{
                      top: '70%',
                      width: '300px',
                      height: '2px',
                      background: 'linear-gradient(90deg, transparent 0%, #fff 50%, transparent 100%)',
                      opacity: 0.5,
                    }}
                  />
                </motion.div>

                  {/* Texto centralizado abaixo do número */}
                  <motion.div
                    className="max-w-3xl h-[8rem] md:h-0 mt-[-4rem]"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <h2 className="font-bold text-white mb-3 md:mb-4 leading-tight text-xl md:text-3xl lg:text-4xl">
                      {card.subtitle}
                    </h2>

                    <p className="text-gray-400 leading-relaxed text-sm md:text-base max-w-xl mx-auto">
                      {card.description}
                    </p>
                  </motion.div>
              </div>
            </div>
          ))}
        </div>

        {/* Progress indicator - alinhado com o conteúdo */}
        <div className="absolute bottom-8 md:bottom-12 left-0 right-0 z-50 px-5 md:px-0">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 md:gap-3">
              {journeyCards.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 md:h-2 rounded-full transition-all duration-300 ${
                    i === activeIndex ? 'bg-[#ff0000] w-6 md:w-8' : 'bg-gray-600 w-1.5 md:w-2'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default JornadaCarga;