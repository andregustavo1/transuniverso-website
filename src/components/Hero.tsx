import { Button } from "@/components/ui/button";
import { motion, useInView, animate } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import logoHero from "@/assets/logo-hero.png";
import MagneticButton from "./MagneticButton";
const AnimatedNumber = ({
  value,
  prefix = "",
  suffix = ""
}: {
  value: number;
  prefix?: string;
  suffix?: string;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, {
    once: true
  });
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    if (isInView) {
      const controls = animate(0, value, {
        duration: 3.5,
        ease: "easeOut",
        onUpdate: latest => setDisplayValue(latest)
      });
      return () => controls.stop();
    }
  }, [isInView, value]);
  const formattedValue = Number.isInteger(value) ? Math.round(displayValue) : displayValue.toFixed(1);
  return <span ref={ref}>
      {prefix}
      {formattedValue}
      {suffix}
    </span>;
};
const Hero = () => {
  return <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Video Background */}
      <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
        <source src="/videos/hero-bg.mp4" type="video/mp4" />
      </video>

      {/* Dark Overlay */}
      <div className="absolute inset-0 video-overlay" />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Logo */}
          <motion.div initial={{
          opacity: 0,
          y: 30
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 0.8,
          ease: [0.22, 1, 0.36, 1]
        }} className="mt-28 mb-2 md:mb-4 md:mt-2">
            <img src={logoHero} alt="Transuniverso" className="h-16 md:h-20 w-auto mx-auto" />
          </motion.div>

          {/* Headline */}
          <motion.h1 initial={{
          opacity: 0,
          y: 40
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 1,
          delay: 0.2,
          ease: [0.22, 1, 0.36, 1]
        }} className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground mb-6 lg:text-6xl">
            A Transportadora Tecnológica que Molda o Futuro
          </motion.h1>

          {/* Subheadline */}
          <motion.p initial={{
          opacity: 0,
          y: 40
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 1,
          delay: 0.4,
          ease: [0.22, 1, 0.36, 1]
        }} className="text-lg md:text-xl max-w-2xl mx-auto mb-10 text-secondary-foreground">
            Aceleramos sua entrega através de rotas inteligentes, garantindo
            menor custo operacional
          </motion.p>

          {/* CTA Buttons */}
          <motion.div initial={{
          opacity: 0,
          y: 40
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 1,
          delay: 0.6,
          ease: [0.22, 1, 0.36, 1]
        }} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <MagneticButton strength={0.4}>
              <Button size="lg" variant="outline" className="rounded-full px-8 font-medium bg-white text-black border-transparent hover:bg-white/10 hover:text-white hover:border-white backdrop-blur-sm">
                Solicitar Cotação
              </Button>
            </MagneticButton>
          </motion.div>

          {/* Stats */}
          <motion.div initial={{
          opacity: 0,
          y: 50
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          duration: 1,
          delay: 0.8,
          ease: [0.22, 1, 0.36, 1]
        }} className="mt-12 mb-16 md:mt-16 md:mb-0 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
            {[{
            value: 15,
            prefix: "+",
            suffix: "",
            label: "Anos de Experiência"
          }, {
            value: 50,
            prefix: "+",
            suffix: "",
            label: "Clientes Ativos"
          }, {
            value: 13500,
            prefix: "+",
            suffix: "",
            label: "Cargas Transportadas"
          }, {
            value: 250,
            prefix: "+",
            suffix: "",
            label: "Cidades Atendidas"
          }].map((stat, index) => <motion.div key={stat.label} initial={{
            opacity: 0,
            scale: 0.8
          }} animate={{
            opacity: 1,
            scale: 1
          }} transition={{
            duration: 0.6,
            delay: 1 + index * 0.1,
            ease: [0.22, 1, 0.36, 1]
          }} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-foreground">
                  <AnimatedNumber value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {stat.label}
                </div>
              </motion.div>)}
          </motion.div>
        </div>
      </div>

    </section>;
};
export default Hero;