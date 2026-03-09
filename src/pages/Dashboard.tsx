import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { Pencil, Check } from 'lucide-react';
import { AddWidgetPlaceholder } from '@/components/dashboard/AddWidgetPlaceholder';
import { ChartLibraryModal } from '@/components/dashboard/ChartLibraryModal';
import { DashboardMetrics } from '@/components/dashboard/DashboardMetrics';
import { RecentTrades } from '@/components/dashboard/RecentTrades';
import { DailyCumulativePnLChart } from '@/components/dashboard/DailyCumulativePnLChart';
import { NetDailyPnLChart } from '@/components/dashboard/NetDailyPnLChart';
import { TradeTimePerformanceChart } from '@/components/dashboard/TradeTimePerformanceChart';
import { TradeDurationPerformanceChart } from '@/components/dashboard/TradeDurationPerformanceChart';
import { MonthlyPerformanceCalendar } from '@/components/dashboard/MonthlyPerformanceCalendar';
import { SymbolAnalysisChart } from '@/components/dashboard/InstrumentAnalysisChart';
import { LongShortAnalysisChart } from '@/components/dashboard/LongShortAnalysisChart';
import { ExternalLinksWidget } from '@/components/dashboard/ExternalLinksWidget';
import { DraggableChartWrapper } from '@/components/dashboard/DraggableChartWrapper';
import { useFilteredTrades } from '@/hooks/useFilteredTrades';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { usePrivacyMode } from '@/hooks/usePrivacyMode';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface ChartConfig {
  id: string;
  component: React.ComponentType;
  colSpan: number;
  rowSpan: number;
}

const DEFAULT_CHART_ORDER = [
  'recentTrades',
  'dailyCumulativePnL',
  'netDailyPnL',
  'calendar',
  'tradeTime',
  'tradeDuration',
  'symbolAnalysis',
  'longShortAnalysis',
  'externalLinks',
];

const CHART_CONFIGS: Record<string, Omit<ChartConfig, 'id'>> = {
  recentTrades: { component: RecentTrades, colSpan: 1, rowSpan: 1 },
  dailyCumulativePnL: { component: DailyCumulativePnLChart, colSpan: 1, rowSpan: 1 },
  netDailyPnL: { component: NetDailyPnLChart, colSpan: 1, rowSpan: 1 },
  calendar: { component: MonthlyPerformanceCalendar, colSpan: 2, rowSpan: 2 },
  tradeTime: { component: TradeTimePerformanceChart, colSpan: 1, rowSpan: 1 },
  tradeDuration: { component: TradeDurationPerformanceChart, colSpan: 1, rowSpan: 1 },
  symbolAnalysis: { component: SymbolAnalysisChart, colSpan: 2, rowSpan: 1 },
  longShortAnalysis: { component: LongShortAnalysisChart, colSpan: 1, rowSpan: 1 },
  externalLinks: { component: ExternalLinksWidget, colSpan: 1, rowSpan: 1 },
};

const STORAGE_KEY = 'dashboard-chart-order';

const Dashboard = () => {
  const { stats } = useFilteredTrades();
  const { formatCurrency } = useGlobalFilters();
  const { isPrivacyMode, maskCurrency } = usePrivacyMode();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [chartOrder, setChartOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Validate that all charts exist
        if (Array.isArray(parsed) && parsed.every(id => CHART_CONFIGS[id])) {
          return parsed;
        }
      } catch {}
    }
    return DEFAULT_CHART_ORDER;
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chartOrder));
  }, [chartOrder]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setChartOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleAddChart = (chartId: string) => {
    if (!chartOrder.includes(chartId)) {
      setChartOrder([...chartOrder, chartId]);
    }
  };

  const handleRemoveChart = (chartId: string) => {
    setChartOrder((items) => items.filter((id) => id !== chartId));
  };

  const renderChart = (chartId: string) => {
    const config = CHART_CONFIGS[chartId];
    if (!config) return null;
    const ChartComponent = config.component;
    return <ChartComponent />;
  };

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <PageHeader title="Dashboard" tooltip="Your trading overview — track net P&L, win rates, and key metrics at a glance." />
          <Button
            variant={isEditMode ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsEditMode(!isEditMode)}
          >
            {isEditMode ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
          </Button>
          {isEditMode && (
            <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
              Drag charts to reorder
            </span>
          )}
        </div>
      </motion.div>

      {/* Top 5 metrics - NOT draggable */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Net P&L with Total Trades */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0 }}
          className="glass-card rounded-xl px-4 py-3"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs text-muted-foreground">Net P&L</span>
            <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
              {stats.totalTrades}
            </span>
          </div>
          <p className={`text-2xl font-bold font-mono ${isPrivacyMode ? 'text-foreground' : stats.netPnl >= 0 ? 'profit-text' : 'loss-text'}`}>
            {maskCurrency(stats.netPnl, formatCurrency)}
          </p>
        </motion.div>

        {/* Trade Win Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="glass-card rounded-xl px-4 py-3"
        >
          <WinRateGauge 
            value={stats.tradeWinRate} 
            label="Trade Win %"
            winners={stats.winningTrades}
            losers={stats.losingTrades}
            breakeven={stats.breakevenTrades}
          />
        </motion.div>

        {/* Profit Factor */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="glass-card rounded-xl px-4 py-3"
        >
          <ProfitFactorRing 
            profitFactor={stats.profitFactor}
            totalProfits={stats.totalProfits}
            totalLosses={stats.totalLosses}
          />
        </motion.div>

        {/* Day Win Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="glass-card rounded-xl px-4 py-3"
        >
          <WinRateGauge 
            value={stats.dayWinRate} 
            label="Day Win %"
            winners={stats.winningDays}
            losers={stats.losingDays}
            breakeven={stats.breakevenDays}
          />
        </motion.div>

        {/* Avg Win/Loss Ratio */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="glass-card rounded-xl px-4 py-3"
        >
          <AvgWinLossRatio 
            avgWin={stats.avgWin}
            avgLoss={stats.avgLoss}
          />
        </motion.div>
      </div>

      {/* Draggable charts section */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={chartOrder} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {chartOrder.map((chartId) => {
              const config = CHART_CONFIGS[chartId];
              if (!config) return null;
              return (
                <DraggableChartWrapper
                  key={chartId}
                  id={chartId}
                  isEditMode={isEditMode}
                  colSpan={config.colSpan}
                  rowSpan={config.rowSpan}
                  onRemove={handleRemoveChart}
                >
                  {renderChart(chartId)}
                </DraggableChartWrapper>
              );
            })}
            {isEditMode && (
              <>
                <AddWidgetPlaceholder onClick={() => setIsLibraryOpen(true)} />
                <AddWidgetPlaceholder onClick={() => setIsLibraryOpen(true)} />
              </>
            )}
          </div>
        </SortableContext>
      </DndContext>

      <ChartLibraryModal
        open={isLibraryOpen}
        onOpenChange={setIsLibraryOpen}
        activeCharts={chartOrder}
        onAddChart={handleAddChart}
      />
    </div>
  );
};

export default Dashboard;
