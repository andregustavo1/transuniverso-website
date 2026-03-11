import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const cargaTypes = [
  {
    title: "Carga Lotação",
    description:
      "Um veículo exclusivo para a sua carga, do ponto de coleta ao destino final. Sem paradas intermediárias, com mais agilidade e total controle da operação.",
    image:
      "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=800&q=80",
  },
  {
    title: "Carga Fracionada",
    description:
      "Transporte para quem precisa de agilidade e economia. Sua carga segue junto com as outras, reduzindo custos e garantindo segurança e eficiência na entrega.",
    image:
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80",
  },
];

const CargaTypes = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section className="w-full bg-[#110d22] py-16 md:py-24">
      <div ref={ref} className="max-w-6xl mx-auto px-5 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {cargaTypes.map((carga, index) => (
            <motion.div
              key={carga.title}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
              transition={{
                duration: 0.6,
                delay: index * 0.15,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="group rounded-2xl overflow-hidden bg-[#120e2c] shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              {/* Imagem */}
              <div className="relative h-56 md:h-64 overflow-hidden">
                <img
                  src={carga.image}
                  alt={carga.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Conteúdo */}
              <div className="p-6 md:p-8">
                <h3 className="text-xl md:text-2xl font-extrabold text-white mb-3">
                  {carga.title}
                </h3>
                <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-6">
                  {carga.description}
                </p>
                <a
                  href="https://api.whatsapp.com/send/?phone=5511940134501&text&type=phone_number&app_absent=0"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-[#fff] hover:bg-white/10 border border-[#fff] text-black hover:text-white text-sm font-bold uppercase tracking-wide px-6 py-3 rounded-full transition-colors duration-200"
                >
                  Fale com um especialista
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CargaTypes;
