import { motion } from 'framer-motion';

interface AvgWinLossRatioProps {
  avgWin: number;
  avgLoss: number;
}

export const AvgWinLossRatio = ({ avgWin, avgLoss }: AvgWinLossRatioProps) => {
  const absLoss = Math.abs(avgLoss);
  const ratio = absLoss > 0 ? avgWin / absLoss : avgWin > 0 ? Infinity : 0;
  const total = avgWin + absLoss;
  
  // Calculate percentages for the bar
  const winPercent = total > 0 ? (avgWin / total) * 100 : 50;
  const lossPercent = total > 0 ? (absLoss / total) * 100 : 50;

  const formatRatio = (value: number) => {
    if (!isFinite(value)) return '∞';
    return value.toFixed(2);
  };

  const formatCurrency = (value: number) => {
    return `$${Math.abs(value).toFixed(1)}`;
  };

  return (
    <div className="flex flex-col items-center w-full">
      <p className="text-xs text-muted-foreground mb-2">Avg Win/Loss</p>
      
      {/* Ratio Value */}
      <motion.p
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-xl font-bold font-mono mb-3"
      >
        {formatRatio(ratio)}
      </motion.p>

      {/* Bar Chart */}
      <div className="w-full space-y-1.5">
        <div className="flex h-2.5 rounded-full overflow-hidden bg-secondary">
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

        {/* Labels */}
        <div className="flex justify-between text-[10px]">
          <span className="profit-text font-mono font-medium">
            {formatCurrency(avgWin)}
          </span>
          <span className="loss-text font-mono font-medium">
            -{formatCurrency(absLoss)}
          </span>
        </div>
      </div>
    </div>
  );
};
