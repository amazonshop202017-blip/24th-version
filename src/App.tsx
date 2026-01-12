import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TradeModalProvider } from "@/contexts/TradeModalContext";
import { TradesProvider } from "@/contexts/TradesContext";
import { TagsProvider } from "@/contexts/TagsContext";
import { StrategiesProvider } from "@/contexts/StrategiesContext";
import { AccountsProvider } from "@/contexts/AccountsContext";
import { GlobalFiltersProvider } from "@/contexts/GlobalFiltersContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { TradeModal } from "@/components/trades/TradeModal";
import Dashboard from "./pages/Dashboard";
import Trades from "./pages/Trades";
import Strategies from "./pages/Strategies";
import StrategyDetail from "./pages/StrategyDetail";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// App component with all providers properly nested
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <TagsProvider>
        <StrategiesProvider>
          <TradesProvider>
            <AccountsProvider>
              <GlobalFiltersProvider>
                <TradeModalProvider>
                  <BrowserRouter>
                    <Toaster />
                    <Sonner />
                    <AppLayout>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/trades" element={<Trades />} />
                        <Route path="/strategies" element={<Strategies />} />
                        <Route path="/strategies/:id" element={<StrategyDetail />} />
                        <Route path="/reports/*" element={<Reports />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </AppLayout>
                    <TradeModal />
                  </BrowserRouter>
                </TradeModalProvider>
              </GlobalFiltersProvider>
            </AccountsProvider>
          </TradesProvider>
        </StrategiesProvider>
      </TagsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
