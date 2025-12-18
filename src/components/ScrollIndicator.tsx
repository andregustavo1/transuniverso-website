import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const ScrollIndicator = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollHeight > 0 ? window.scrollY / scrollHeight : 0;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col items-center">
      {/* Vertical line */}
      <div className="relative w-[2px] h-40 bg-muted-foreground/20 rounded-full">
        {/* Progress indicator dot */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 w-3 h-3 bg-foreground rounded-full shadow-lg"
          style={{
            top: `${scrollProgress * 100}%`,
            transform: `translate(-50%, -50%)`,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      </div>
    </div>
  );
};

export default ScrollIndicator;
