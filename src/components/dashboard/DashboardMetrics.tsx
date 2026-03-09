import { useState, useEffect, ReactNode } from 'react';
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
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { WinRateGauge } from '@/components/dashboard/WinRateGauge';
import { ProfitFactorRing } from '@/components/dashboard/ProfitFactorRing';
import { AvgWinLossRatio } from '@/components/dashboard/AvgWinLossRatio';
import { AddWidgetPlaceholder } from '@/components/dashboard/AddWidgetPlaceholder';
import { MetricsLibraryModal } from '@/components/dashboard/MetricsLibraryModal';
import { useFilteredTrades } from '@/hooks/useFilteredTrades';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { usePrivacyMode } from '@/hooks/usePrivacyMode';

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
  const { stats } = useFilteredTrades();
  const { formatCurrency } = useGlobalFilters();
  const { isPrivacyMode, maskCurrency } = usePrivacyMode();
  const [isMetricsLibraryOpen, setIsMetricsLibraryOpen] = useState(false);

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
      default:
        return null;
    }
  };

  // Dynamic grid columns based on metric count
  const count = metricsOrder.length + (isEditMode && metricsOrder.length < MAX_METRICS ? 1 : 0);
  const gridColsClass =
    count <= 1 ? 'grid-cols-1' :
    count === 2 ? 'grid-cols-2' :
    count === 3 ? 'grid-cols-3' :
    count === 4 ? 'grid-cols-2 md:grid-cols-4' :
    'grid-cols-2 md:grid-cols-3 lg:grid-cols-5';

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleMetricDragEnd}>
        <SortableContext items={metricsOrder} strategy={horizontalListSortingStrategy}>
          <div className={`grid ${gridColsClass} gap-3`}>
            {metricsOrder.map((metricId, index) => (
              <SortableMetric key={metricId} id={metricId} isEditMode={isEditMode} onRemove={handleRemoveMetric}>
                {renderMetric(metricId, index)}
              </SortableMetric>
            ))}
            {isEditMode && metricsOrder.length < MAX_METRICS && (
              <AddWidgetPlaceholder onClick={() => setIsMetricsLibraryOpen(true)} />
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
