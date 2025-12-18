import Hero from "@/components/Hero";
import ClientsCarousel from "@/components/ClientsCarousel";
import JornadaCarga from "@/components/JornadaCarga";
import UniverseCTA from "@/components/UniverseCTA";
import ScrollIndicator from "@/components/ScrollIndicator";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <ScrollIndicator />
      <Hero />
      <ClientsCarousel />
      <JornadaCarga />
      <UniverseCTA />
    </div>
  );
};

export default Index;
