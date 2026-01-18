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
import { CustomStatsProvider } from "@/contexts/CustomStatsContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { TradeModal } from "@/components/trades/TradeModal";
import Dashboard from "./pages/Dashboard";
import Trades from "./pages/Trades";
import Strategies from "./pages/Strategies";
import StrategyDetail from "./pages/StrategyDetail";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Drawdown from "./pages/chartroom/Drawdown";
import ExitAnalysis from "./pages/chartroom/ExitAnalysis";
import HoldingTime from "./pages/chartroom/HoldingTime";
import PerformanceByInstrument from "./pages/chartroom/PerformanceByInstrument";
import PerformanceBySetup from "./pages/chartroom/PerformanceBySetup";
import PerformanceByTime from "./pages/chartroom/PerformanceByTime";
import PerformanceRatio from "./pages/chartroom/PerformanceRatio";
import RiskDistribution from "./pages/chartroom/RiskDistribution";
import TradeManagement from "./pages/chartroom/TradeManagement";

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
                <CustomStatsProvider>
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
                          <Route path="/chart-room/drawdown" element={<Drawdown />} />
                          <Route path="/chart-room/exit-analysis" element={<ExitAnalysis />} />
                          <Route path="/chart-room/holding-time" element={<HoldingTime />} />
                          <Route path="/chart-room/performance-by-instrument" element={<PerformanceByInstrument />} />
                          <Route path="/chart-room/performance-by-setup" element={<PerformanceBySetup />} />
                          <Route path="/chart-room/performance-by-time" element={<PerformanceByTime />} />
                          <Route path="/chart-room/performance-ratio" element={<PerformanceRatio />} />
                          <Route path="/chart-room/risk-distribution" element={<RiskDistribution />} />
                          <Route path="/chart-room/trade-management" element={<TradeManagement />} />
                          <Route path="/settings" element={<Settings />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </AppLayout>
                      <TradeModal />
                    </BrowserRouter>
                  </TradeModalProvider>
                </CustomStatsProvider>
              </GlobalFiltersProvider>
            </AccountsProvider>
          </TradesProvider>
        </StrategiesProvider>
      </TagsProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
