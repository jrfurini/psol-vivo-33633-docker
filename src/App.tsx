import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./contexts/AppContext";
import { MainLayout } from "./layouts/MainLayout";
import Home from "./pages/Home";
import Controle from "./pages/Controle";
import MascaraFornecedor from "./pages/MascaraFornecedor";
import Rateio from "./pages/Rateio";
import ResumoFinanceiro from "./pages/ResumoFinanceiro";
import Contatos from "./pages/Contatos";
import Administracao from "./pages/Administracao";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AppProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route element={<MainLayout />}>
              <Route path="/controle" element={<Controle />} />
              <Route path="/mascara-fornecedor" element={<MascaraFornecedor />} />
              <Route path="/rateio" element={<Rateio />} />
              <Route path="/resumo-financeiro" element={<ResumoFinanceiro />} />
              <Route path="/contatos" element={<Contatos />} />
              <Route path="/administracao" element={<Administracao />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
