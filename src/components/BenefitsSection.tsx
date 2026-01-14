import { motion, useInView } from 'framer-motion';
import { Clock, Shield, Truck, Headphones } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

// Lista de benefícios conforme especificação
const benefits = [
  {
    icon: Clock,
    title: "Entrega no prazo",
    description: "Compromisso com pontualidade e cumprimento rigoroso dos prazos acordados.",
  },
  {
    icon: Shield,
    title: "Seguro completo da carga",
    description: "Proteção total da sua mercadoria durante todo o trajeto.",
    floating: true,
  },
  {
    icon: Truck,
    title: "Frota profissional e coordenada",
    description: "Veículos modernos e equipe treinada para sua operação.",
  },
  {
    icon: Headphones,
    title: "Atendimento rápido e transparente",
    description: "Suporte dedicado e comunicação clara em todas as etapas.",
  },
];

const BenefitsSection = () => {
  // Estado para altura fixa no mobile (evita jump igual ao UniverseCTA)
  const [viewportHeight, setViewportHeight] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // Ref no container do conteúdo (não na seção toda) para detectar melhor
  const contentRef = useRef<HTMLDivElement>(null);
  // margin negativo faz a detecção acontecer mais tarde (quando o conteúdo está mais centralizado)
  const isInView = useInView(contentRef, { 
    once: true, 
    amount: 0.2,
    margin: "-50px 0px -50px 0px"
  });

  // Captura altura apenas uma vez no mount
  useEffect(() => {
    const mobile = window.innerWidth < 768;
    setIsMobile(mobile);
    setViewportHeight(`${window.innerHeight}px`);
  }, []);

  return (
    <section 
      className={`relative w-screen overflow-hidden flex items-center ${isMobile ? 'bg-[#0a0a0f]' : 'bg-slate-900/50'}`}
      style={{ 
        marginLeft: 'calc(-50vw + 50%)', 
        marginRight: 'calc(-50vw + 50%)',
        ...(isMobile 
          ? { height: viewportHeight || '100svh' }
          : { minHeight: '100vh' }
        )
      }}
    >
      <div className="w-full px-5 md:px-8 lg:px-16 xl:px-24 py-16 md:py-0">
        {/* Ref no container do conteúdo para detecção mais precisa */}
        <div ref={contentRef} className="relative overflow-visible max-w-7xl mx-auto">
          <div className="grid md:flex gap-16 justify-between items-center">
            {/* Lado esquerdo - Conteúdo */}
            <motion.div 
              className="space-y-3 md:space-y-6"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="text-[10px] md:text-xs tracking-[0.3em]  uppercase font-medium">
                Texto
              </span>
              
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground leading-[1.1] tracking-tight">
                Seu transporte com{' '}
                <span className="">garantia</span> de:
              </h2>
              
              <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-md">
                Oferecemos soluções completas em transporte rodoviário, com tecnologia e compromisso para atender sua operação.
              </p>
            </motion.div>

            {/* Lado direito - Grid de cards com animação sequencial */}
            <div className="grid grid-cols-2 gap-4 md:gap-5 relative">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 40, scale: 0.95 }}
                  animate={isInView 
                    ? { opacity: 1, y: 0, scale: 1 } 
                    : { opacity: 0, y: 40, scale: 0.95 }
                  }
                  transition={{ 
                    duration: 0.5,
                    delay: 0.1 + index * 0.08, // Sequencial: 0.1s, 0.18s, 0.26s, 0.34s
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className={`
                    group relative p-5 md:p-6 rounded-2xl 
                    bg-slate-900 border border-white/5
                    hover:border-slate-50/30
                    transition-colors duration-300
                    ${benefit.floating ? 'lg:-translate-y-6 shadow-2xl shadow-black/50' : ''}
                  `}
                >
                  {/* Ícone */}
                  <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-gray-900 border border-white/20 flex items-center justify-center mb-4 group-hover:bg-white/15 transition-colors duration-300">
                    <benefit.icon className="w-5 h-5 md:w-6 md:h-6 text-[#fff]" strokeWidth={1.5} />
                  </div>

                  {/* Título */}
                  <h3 className="text-sm md:text-base font-semibold text-foreground mb-2 leading-tight">
                    {benefit.title}
                  </h3>

                  {/* Descrição */}
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                    {benefit.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;