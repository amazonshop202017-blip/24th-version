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
  size = 70 
}: ProfitFactorRingProps) => {
  const strokeWidth = size * 0.1;
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
    <div className="flex flex-col items-center gap-2">
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
      
      <div className="flex flex-col items-center">
        <span className="text-xs text-muted-foreground">Profit Factor</span>
        <span className="text-xl font-bold font-mono text-foreground">
          {profitFactor === Infinity ? '∞' : profitFactor.toFixed(2)}
        </span>
      </div>
    </div>
  );
};
