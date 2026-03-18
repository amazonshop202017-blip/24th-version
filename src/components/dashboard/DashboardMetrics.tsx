import { useState, useEffect, useMemo, ReactNode } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { WinRateGauge } from '@/components/dashboard/WinRateGauge';
import { ProfitFactorRing } from '@/components/dashboard/ProfitFactorRing';
import { AvgWinLossRatio } from '@/components/dashboard/AvgWinLossRatio';
import { CurrentStreakMetric } from '@/components/dashboard/CurrentStreakMetric';
import { TradeExpectancyMetric } from '@/components/dashboard/TradeExpectancyMetric';
import { AccountBalancePnLMetric } from '@/components/dashboard/AccountBalancePnLMetric';
import { AddWidgetPlaceholder } from '@/components/dashboard/AddWidgetPlaceholder';
import { MetricsLibraryModal } from '@/components/dashboard/MetricsLibraryModal';
import { useFilteredTrades } from '@/hooks/useFilteredTrades';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { usePrivacyMode } from '@/hooks/usePrivacyMode';
import { calculateTradeMetrics } from '@/types/trade';
import { parseISO, format } from 'date-fns';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';

const DEFAULT_METRICS_ORDER = ['netPnl', 'tradeWinRate', 'profitFactor', 'dayWinRate', 'avgWinLoss'];
const METRICS_STORAGE_KEY = 'dashboard-metrics-order';
const MAX_METRICS = 5;

interface SortableMetricProps {
  id: string;
  isEditMode: boolean;
  onRemove: (id: string) => void;
  children: ReactNode;
}

const SortableMetric = ({ id, isEditMode, onRemove, children }: SortableMetricProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${isDragging ? 'z-50 opacity-90' : ''} ${isEditMode ? 'ring-2 ring-primary/20 ring-dashed rounded-xl' : ''}`}
    >
      {isEditMode && (
        <>
          <div
            {...attributes}
            {...listeners}
            className="absolute -top-2 -left-2 z-10 p-1 bg-primary text-primary-foreground rounded-md cursor-grab active:cursor-grabbing shadow-lg hover:bg-primary/90 transition-colors"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </div>
          <button
            onClick={() => onRemove(id)}
            className="absolute -top-2 -right-2 z-10 p-1 bg-destructive text-destructive-foreground rounded-md shadow-lg hover:bg-destructive/90 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </>
      )}
      {children}
    </div>
  );
};

interface DashboardMetricsProps {
  isEditMode: boolean;
}

export const DashboardMetrics = ({ isEditMode }: DashboardMetricsProps) => {
  const { stats, filteredTrades } = useFilteredTrades();
  const { formatCurrency } = useGlobalFilters();
  const { isPrivacyMode, maskCurrency } = usePrivacyMode();
  const [isMetricsLibraryOpen, setIsMetricsLibraryOpen] = useState(false);

  const microChartData = useMemo(() => {
    if (filteredTrades.length === 0) return [];
    const dailyPnL = new Map<string, number>();
    filteredTrades.forEach(t => {
      const m = calculateTradeMetrics(t);
      if (m.openDate) {
        const d = format(parseISO(m.openDate), 'yyyy-MM-dd');
        dailyPnL.set(d, (dailyPnL.get(d) || 0) + m.netPnl);
      }
    });
    let cum = 0;
    return Array.from(dailyPnL.keys()).sort().map(d => {
      cum += dailyPnL.get(d) || 0;
      return { v: cum };
    });
  }, [filteredTrades]);

  const [metricsOrder, setMetricsOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem(METRICS_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length <= MAX_METRICS) {
          return parsed;
        }
      } catch {}
    }
    return DEFAULT_METRICS_ORDER;
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    localStorage.setItem(METRICS_STORAGE_KEY, JSON.stringify(metricsOrder));
  }, [metricsOrder]);

  const handleMetricDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setMetricsOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleAddMetric = (metricId: string) => {
    if (!metricsOrder.includes(metricId) && metricsOrder.length < MAX_METRICS) {
      setMetricsOrder([...metricsOrder, metricId]);
    }
  };

  const handleRemoveMetric = (metricId: string) => {
    setMetricsOrder((items) => items.filter((id) => id !== metricId));
  };

  const renderMetric = (metricId: string, index: number) => {
    const delay = index * 0.1;
    switch (metricId) {
      case 'netPnl':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay }} className="glass-card rounded-xl px-4 py-3 h-full">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs text-muted-foreground">Net P&L</span>
              <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">{stats.totalTrades}</span>
            </div>
            <p className={`text-2xl font-bold font-mono ${isPrivacyMode ? 'text-foreground' : stats.netPnl >= 0 ? 'profit-text' : 'loss-text'}`}>
              {maskCurrency(stats.netPnl, formatCurrency)}
            </p>
            {microChartData.length > 1 && (
              <div className="h-8 mt-1 -mx-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={microChartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="microPnlGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={stats.netPnl >= 0 ? 'hsl(var(--profit))' : 'hsl(var(--loss))'} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={stats.netPnl >= 0 ? 'hsl(var(--profit))' : 'hsl(var(--loss))'} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="v"
                      stroke={stats.netPnl >= 0 ? 'hsl(var(--profit))' : 'hsl(var(--loss))'}
                      strokeWidth={1.5}
                      fill="url(#microPnlGradient)"
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </motion.div>
        );
      case 'tradeWinRate':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay }} className="glass-card rounded-xl px-4 py-3 h-full">
            <WinRateGauge value={stats.tradeWinRate} label="Trade Win %" winners={stats.winningTrades} losers={stats.losingTrades} breakeven={stats.breakevenTrades} />
          </motion.div>
        );
      case 'profitFactor':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay }} className="glass-card rounded-xl px-4 py-3 h-full">
            <ProfitFactorRing profitFactor={stats.profitFactor} totalProfits={stats.totalProfits} totalLosses={stats.totalLosses} />
          </motion.div>
        );
      case 'dayWinRate':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay }} className="glass-card rounded-xl px-4 py-3 h-full">
            <WinRateGauge value={stats.dayWinRate} label="Day Win %" winners={stats.winningDays} losers={stats.losingDays} breakeven={stats.breakevenDays} />
          </motion.div>
        );
      case 'avgWinLoss':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay }} className="glass-card rounded-xl px-4 py-3 h-full">
            <AvgWinLossRatio avgWin={stats.avgWin} avgLoss={stats.avgLoss} />
          </motion.div>
        );
      case 'currentStreak':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay }} className="glass-card rounded-xl px-4 py-3 h-full">
            <CurrentStreakMetric />
          </motion.div>
        );
      case 'tradeExpectancy':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay }} className="glass-card rounded-xl px-4 py-3 h-full">
            <TradeExpectancyMetric />
          </motion.div>
        );
      case 'accountBalancePnl':
        return (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay }} className="glass-card rounded-xl px-4 py-3 h-full">
            <AccountBalancePnLMetric />
          </motion.div>
        );
      default:
        return null;
    }
  };

  // Clean responsive grid: last partial row cards stretch to fill
  // Mobile (2 cols): 5 items → 2+2+1, last one spans full width
  // Tablet (md 3 cols via 6-col subgrid): 5 → 3+2, last 2 each get col-span-3
  // Desktop (lg): all 5 in 1 row
  const totalItems = metricsOrder.length + (isEditMode && metricsOrder.length < MAX_METRICS ? 1 : 0);

  const getItemClasses = (index: number) => {
    // --- Mobile: 2-column grid ---
    const mobileRemainder = totalItems % 2;
    const isLastMobileItem = mobileRemainder === 1 && index === totalItems - 1;
    const mobileClass = isLastMobileItem ? 'col-span-2' : 'col-span-1';

    // --- Tablet (md): 6-column subgrid, normally span-2 = 3 per row ---
    const tabletItemsPerRow = 3;
    const tabletRemainder = totalItems % tabletItemsPerRow;
    let mdClass = 'md:col-span-2';
    if (tabletRemainder !== 0 && index >= totalItems - tabletRemainder) {
      if (tabletRemainder === 1) mdClass = 'md:col-span-6';
      else if (tabletRemainder === 2) mdClass = 'md:col-span-3';
    }

    return `${mobileClass} ${mdClass} lg:col-span-1`;
  };

  const lgGridCols = totalItems <= 1 ? 'lg:grid-cols-1' :
    totalItems === 2 ? 'lg:grid-cols-2' :
    totalItems === 3 ? 'lg:grid-cols-3' :
    totalItems === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-5';

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleMetricDragEnd}>
        <SortableContext items={metricsOrder} strategy={horizontalListSortingStrategy}>
          <div className={`grid grid-cols-2 md:grid-cols-6 ${lgGridCols} gap-3`}>
            {metricsOrder.map((metricId, index) => (
              <SortableMetric key={metricId} id={metricId} isEditMode={isEditMode} onRemove={handleRemoveMetric}>
                <div className={getItemClasses(index)}>
                  {renderMetric(metricId, index)}
                </div>
              </SortableMetric>
            ))}
            {isEditMode && metricsOrder.length < MAX_METRICS && (
              <div className={getItemClasses(metricsOrder.length)}>
                <AddWidgetPlaceholder onClick={() => setIsMetricsLibraryOpen(true)} />
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>

      <MetricsLibraryModal
        open={isMetricsLibraryOpen}
        onOpenChange={setIsMetricsLibraryOpen}
        activeMetrics={metricsOrder}
        onAddMetric={handleAddMetric}
      />
    </>
  );
};
