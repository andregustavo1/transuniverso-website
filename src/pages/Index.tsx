import Hero from "@/components/Hero";
import ClientsCarousel from "@/components/ClientsCarousel";
import CargaTypes from "@/components/CargaTypes";
import JornadaCarga from "@/components/JornadaCarga";
import BenefitsSection from "@/components/BenefitsSection";
import UniverseCTA from "@/components/UniverseCTA";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Hero />
      <ClientsCarousel />
      <CargaTypes />
      <JornadaCarga />
      <BenefitsSection />
      <UniverseCTA />
    </div>
  );
};

export default Index;
