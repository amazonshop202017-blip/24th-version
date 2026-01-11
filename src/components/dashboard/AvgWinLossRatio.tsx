import { motion } from 'framer-motion';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';

interface AvgWinLossRatioProps {
  avgWin: number;
  avgLoss: number;
}

export const AvgWinLossRatio = ({ avgWin, avgLoss }: AvgWinLossRatioProps) => {
  const { currencyConfig } = useGlobalFilters();
  
  const absLoss = Math.abs(avgLoss);
  const ratio = absLoss > 0 ? avgWin / absLoss : avgWin > 0 ? Infinity : 0;
  const total = avgWin + absLoss;
  
  const winPercent = total > 0 ? (avgWin / total) * 100 : 50;
  const lossPercent = total > 0 ? (absLoss / total) * 100 : 50;

  const formatRatio = (value: number) => {
    if (!isFinite(value)) return '∞';
    return value.toFixed(2);
  };

  const formatCurrency = (value: number) => {
    return `${currencyConfig.symbol}${Math.abs(value).toFixed(1)}`;
  };

  return (
    <div className="flex flex-col w-full gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Avg Win/Loss</span>
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="font-bold font-mono"
          style={{ fontSize: 20 }}
        >
          {formatRatio(ratio)}
        </motion.span>
      </div>

      <div className="flex h-2 rounded-full overflow-hidden bg-secondary">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${winPercent}%` }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="bg-profit h-full"
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${lossPercent}%` }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="bg-loss h-full"
        />
      </div>

      <div className="flex justify-between text-[10px]">
        <span className="profit-text font-mono font-medium">
          {formatCurrency(avgWin)}
        </span>
        <span className="loss-text font-mono font-medium">
          -{formatCurrency(absLoss)}
        </span>
      </div>
    </div>
  );
};
