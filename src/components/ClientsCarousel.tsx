import { motion } from "framer-motion";
import client1 from "@/assets/clients/client-1.png";
import client2 from "@/assets/clients/client-2.png";
import client3 from "@/assets/clients/client-3.png";
import client4 from "@/assets/clients/client-4.png";
import client5 from "@/assets/clients/client-5.png";
import client6 from "@/assets/clients/client-6.png";
import client7 from "@/assets/clients/client-7.png";
import client8 from "@/assets/clients/client-8.png";

const ClientsCarousel = () => {
  const clients = [
    { name: "Cliente 1", logo: client1 },
    { name: "Cliente 2", logo: client2 },
    { name: "Cliente 3", logo: client3 },
    { name: "Cliente 4", logo: client4 },
    { name: "Cliente 5", logo: client5 },
    { name: "Cliente 6", logo: client6 },
    { name: "Cliente 7", logo: client7 },
    { name: "Cliente 8", logo: client8 },
  ];

  // Duplicate for infinite scroll effect
  const duplicatedClients = [...clients, ...clients];

  return (
    <motion.section
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="py-12 bg-background/50 border-y border-border/30 overflow-hidden"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="container mx-auto px-4 mb-8"
      >
        <p className="text-center text-muted-foreground text-sm uppercase tracking-widest">
          Empresas que confiam em nós
        </p>
      </motion.div>

      <div className="relative">
        {/* Gradient overlays for smooth edges */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />

        {/* Scrolling container */}
        <div className="flex animate-scroll w-max">
          {duplicatedClients.map((client, index) => (
            <div
              key={index}
              className="flex-shrink-0 mx-4 md:mx-12 flex items-center justify-center h-16 min-w-[100px] md:min-w-[150px]"
            >
              <img
                src={client.logo}
                alt={client.name}
                className="h-10 w-auto object-contain opacity-60 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
              />
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
};

export default ClientsCarousel;
