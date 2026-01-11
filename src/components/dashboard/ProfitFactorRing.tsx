import { motion } from 'framer-motion';

interface ProfitFactorRingProps {
  profitFactor: number;
  totalProfits: number;
  totalLosses: number;
  size?: number;
}

export const ProfitFactorRing = ({ 
  profitFactor, 
  totalProfits, 
  totalLosses, 
  size = 80 
}: ProfitFactorRingProps) => {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const centerX = size / 2;
  const centerY = size / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate the proportion (profits vs total)
  const total = totalProfits + Math.abs(totalLosses);
  const profitPercent = total > 0 ? (totalProfits / total) * 100 : 50;
  const lossPercent = 100 - profitPercent;
  
  // SVG arc calculations
  const profitDash = (profitPercent / 100) * circumference;
  const lossDash = (lossPercent / 100) * circumference;

  return (
    <div className="flex items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Loss arc (red) - starts where profit ends */}
          <circle
            cx={centerX}
            cy={centerY}
            r={radius}
            fill="none"
            stroke="hsl(0, 84%, 60%)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${lossDash} ${circumference}`}
            strokeDashoffset={-profitDash}
            strokeLinecap="round"
          />
          
          {/* Profit arc (green) - starts at top */}
          <motion.circle
            cx={centerX}
            cy={centerY}
            r={radius}
            fill="none"
            stroke="hsl(142, 76%, 36%)"
            strokeWidth={strokeWidth}
            strokeDasharray={`${profitDash} ${circumference}`}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: 0 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          />
        </svg>
      </div>
      
      <div className="flex flex-col">
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground">Profit factor</span>
          <span className="text-muted-foreground/50 text-xs cursor-help" title="Total profits ÷ Total losses">ⓘ</span>
        </div>
        <span className="text-2xl font-bold font-mono text-foreground">
          {profitFactor === Infinity ? '∞' : profitFactor.toFixed(2)}
        </span>
      </div>
    </div>
  );
};
