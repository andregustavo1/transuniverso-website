import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useIsMobile } from '@/hooks/use-mobile';
import caminhaoImg from '@/assets/caminhao.png';

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
  subtitle: "Solicitação Inteligente",
  description: "Tudo começa de forma simples, digital e organizada. As informações da carga são registradas em um fluxo único, eliminando ruídos, retrabalho e incertezas já no primeiro contato.",
  bgColor: "#0f172a",
},
{
  id: 2,
  title: "Etapa 02",
  subtitle: "Planejamento Operacional",
  description: "Antes da carga sair, cada detalhe é analisado. Capacidade operacional, tipo de carga e rotas são avaliados para que o transporte aconteça de forma previsível, segura e eficiente.",
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
  subtitle: "Gestão de Risco e Monitoramento",
  description: "Durante todo o percurso, a carga é acompanhada com monitoramento e protocolos de segurança. A operação conta com seguros obrigatórios: RC-V (Responsabilidade Civil do Veículo), RCTR-C (Responsabilidade Civil do Transportador Rodoviário de Carga) e RC-DC (Responsabilidade Civil por Desaparecimento de Carga), garantindo proteção, conformidade e tranquilidade.",
  bgColor: "#16222E",
},
{
  id: 5,
  title: "Etapa 05",
  subtitle: "Entrega Confirmada",
  description: "A jornada se encerra com a entrega confirmada e registrada. Informações organizadas, histórico disponível e indicadores que reforçam pontualidade, confiabilidade e performance operacional.",
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
              {/* Decorative background - hidden on mobile */}
              <div className="absolute pointer-events-none right-[15%] top-1/2 -translate-y-1/2 w-[40vw] h-[40vw] opacity-20 hidden md:block">
                <div 
                  className="w-full h-full rounded-full"
                  style={{
                    background: `radial-gradient(circle, ${card.bgColor === '#0a0a0f' ? 'rgba(249,115,22,0.3)' : 'rgba(147,51,234,0.2)'} 0%, transparent 70%)`,
                    filter: 'blur(60px)',
                  }}
                />
              </div>

              {/* Content */}
              <div className="relative flex z-10 px-5 md:px-0 w-full max-w-7xl mx-auto items-center justify-between">
                <motion.div
                  className="max-w-full md:max-w-[45%]"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                  <span className="tracking-[0.2em] text-[#ff0000] font-medium mb-2 md:mb-4 block text-xs md:text-sm">
                    {card.title}
                  </span>

                  <h2 className="font-extrabold text-white mb-4 md:mb-8 leading-[1.1] tracking-tight text-2xl md:text-5xl lg:text-6xl">
                    {card.subtitle}
                  </h2>

                  <p className="text-gray-400 leading-relaxed tracking-wide text-sm md:text-xl max-w-lg">
                    {card.description}
                  </p>

                  <motion.div
                    className="mt-6 md:mt-12 h-[2px] bg-gradient-to-r from-[#ff0000] to-transparent"
                    initial={{ width: 0 }}
                    whileInView={{ width: '60%' }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  />

                  {/* Image placeholder - Mobile (below text) */}
                  <div className="mt-8 flex justify-center md:hidden">
                    {index === 0 ? (
                      <img 
                        src={caminhaoImg} 
                        alt="Caminhão - Etapa 01" 
                        className="w-40 h-40 rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="w-40 h-40 rounded-2xl border-2 border-dashed border-white/20 flex items-center justify-center bg-white/5">
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
                    )}
                  </div>
                </motion.div>

                {/* Image placeholder - Desktop (dentro do container para respeitar margens) */}
                <div className="hidden md:flex w-[380px] lg:w-[420px] xl:w-[450px] h-[380px] lg:h-[420px] xl:h-[450px] flex-shrink-0">
                  {index === 0 ? (
                    <img 
                      src={caminhaoImg} 
                      alt="Caminhão - Etapa 01" 
                      className="w-full h-full rounded-2xl object-cover"
                    />
                  ) : (
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
                  )}
                </div>
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