import { motion } from 'framer-motion';

interface WinRateGaugeProps {
  value: number;
  label: string;
  winners?: number;
  losers?: number;
  size?: number;
}

export const WinRateGauge = ({ value, label, winners, losers, size = 180 }: WinRateGaugeProps) => {
  const clampedValue = Math.min(100, Math.max(0, value));
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const centerX = size / 2;
  const centerY = size / 2;
  
  // Semi-circle arc (from -110° to 110°, so 220° total)
  const startAngle = -110;
  const endAngle = 110;
  const totalAngle = endAngle - startAngle;
  
  // Calculate the arc path
  const polarToCartesian = (cx: number, cy: number, r: number, angle: number) => {
    const rad = (angle - 90) * Math.PI / 180;
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad)
    };
  };
  
  const describeArc = (cx: number, cy: number, r: number, start: number, end: number) => {
    const startPoint = polarToCartesian(cx, cy, r, start);
    const endPoint = polarToCartesian(cx, cy, r, end);
    const largeArcFlag = Math.abs(end - start) > 180 ? 1 : 0;
    
    return `M ${startPoint.x} ${startPoint.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${endPoint.x} ${endPoint.y}`;
  };
  
  // Background arc (full semi-circle)
  const backgroundPath = describeArc(centerX, centerY, radius, startAngle, endAngle);
  
  // Value arc (portion based on percentage)
  const valueAngle = startAngle + (totalAngle * clampedValue / 100);
  const valuePath = clampedValue > 0 ? describeArc(centerX, centerY, radius, startAngle, valueAngle) : '';
  
  const getValueColor = () => {
    if (clampedValue >= 50) return 'hsl(142, 76%, 36%)'; // green
    if (clampedValue > 0) return 'hsl(0, 84%, 60%)'; // red
    return 'hsl(var(--muted-foreground))';
  };

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 0.65} viewBox={`0 0 ${size} ${size * 0.7}`}>
        {/* Background arc */}
        <path
          d={backgroundPath}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        
        {/* Value arc with animation */}
        {clampedValue > 0 && (
          <motion.path
            d={valuePath}
            fill="none"
            stroke={getValueColor()}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          />
        )}
        
        {/* Center text - lighter color */}
        <text
          x={centerX}
          y={centerY + 8}
          textAnchor="middle"
          className="fill-muted-foreground font-mono font-bold"
          style={{ fontSize: size * 0.16 }}
        >
          {clampedValue.toFixed(1)}%
        </text>
      </svg>
      <span className="text-sm text-muted-foreground -mt-2">{label}</span>
      {winners !== undefined && losers !== undefined && (
        <div className="flex items-center gap-2 mt-1 text-xs">
          <span className="profit-text font-medium">{winners}W</span>
          <span className="text-muted-foreground">/</span>
          <span className="loss-text font-medium">{losers}L</span>
        </div>
      )}
    </div>
  );
};
