import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface WinRateGaugeProps {
  value: number;
  label: string;
  winners?: number;
  losers?: number;
  breakeven?: number;
}

export const WinRateGauge = ({ value, label, winners = 0, losers = 0, breakeven = 0 }: WinRateGaugeProps) => {
  const clampedValue = Math.min(100, Math.max(0, value));
  const size = 90;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const centerX = size / 2;
  const centerY = size / 2;
  
  // Semi-circle arc (from 180° to 0°, left to right)
  const startAngle = 180;
  const endAngle = 0;
  const totalAngle = 180;
  
  const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
    const rad = (angle) * Math.PI / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy - r * Math.sin(rad)
    };
  };
  
  const describeArc = (cx: number, cy: number, r: number, start: number, end: number) => {
    const startPoint = polarToCartesian(cx, cy, r, start);
    const endPoint = polarToCartesian(cx, cy, r, end);
    const largeArcFlag = Math.abs(start - end) > 180 ? 1 : 0;
    const sweepFlag = start > end ? 1 : 0;
    
    return `M ${startPoint.x} ${startPoint.y} A ${r} ${r} 0 ${largeArcFlag} ${sweepFlag} ${endPoint.x} ${endPoint.y}`;
  };
  
  // Calculate angles for win and loss portions
  const winAngle = startAngle - (totalAngle * clampedValue / 100);
  const lossAngle = endAngle;
  
  // Win arc (green) - from left side
  const winPath = clampedValue > 0 ? describeArc(centerX, centerY, radius, startAngle, winAngle) : '';
  
  // Loss arc (red) - from right side to where win ends
  const lossPath = clampedValue < 100 ? describeArc(centerX, centerY, radius, winAngle, lossAngle) : '';

  return (
    <TooltipProvider>
      <div className="flex flex-col items-center w-full">
        <span className="text-xs text-muted-foreground mb-1">{label}</span>
        
        <div className="relative">
          <svg width={size} height={size * 0.55} viewBox={`0 0 ${size} ${size * 0.55}`}>
            {/* Loss arc (red) - background/right side */}
            {clampedValue < 100 && (
              <path
                d={lossPath}
                fill="none"
                stroke="hsl(0, 84%, 60%)"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />
            )}
            
            {/* Win arc (green) - left side with animation */}
            {clampedValue > 0 && (
              <motion.path
                d={winPath}
                fill="none"
                stroke="hsl(142, 76%, 36%)"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
              />
            )}
          </svg>
          
          {/* Percentage in center */}
          <div className="absolute inset-0 flex items-end justify-center pb-0">
            <span className="text-xl font-bold font-mono">{clampedValue.toFixed(2)}%</span>
          </div>
        </div>
        
        {/* Numbers below gauge */}
        <div className="flex items-center justify-center gap-4 mt-1 text-xs font-medium">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="profit-text cursor-help">{winners}</span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Winners
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-muted-foreground cursor-help">{breakeven}</span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Breakeven
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="loss-text cursor-help">{losers}</span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Losers
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
};
