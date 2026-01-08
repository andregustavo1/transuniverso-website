import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SmoothScrollProvider from "./components/SmoothScrollProvider";
import CustomCursor from "./components/CustomCursor";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { useStableViewport } from "@/hooks/use-stable-viewport";

const queryClient = new QueryClient();

// Componente que inicializa as variáveis CSS de viewport globalmente
const ViewportProvider = ({ children }: { children: React.ReactNode }) => {
  // Este hook define as variáveis CSS --vh-stable, --vw-stable no document root
  useStableViewport();
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ViewportProvider>
        <SmoothScrollProvider>
        <CustomCursor />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </SmoothScrollProvider>
      </ViewportProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
