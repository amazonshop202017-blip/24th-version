import { motion } from 'framer-motion';

interface WinRateGaugeProps {
  value: number;
  size?: number;
}

export const WinRateGauge = ({ value, size = 160 }: WinRateGaugeProps) => {
  const clampedValue = Math.min(100, Math.max(0, value));
  const strokeWidth = 12;
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
  const valuePath = describeArc(centerX, centerY, radius, startAngle, valueAngle);
  
  // Calculate arc length for animation
  const circumference = 2 * Math.PI * radius;
  const arcLength = (totalAngle / 360) * circumference;
  const valueArcLength = (clampedValue / 100) * arcLength;
  
  const getTrendColor = () => {
    if (clampedValue >= 50) return 'hsl(var(--profit))';
    if (clampedValue > 0) return 'hsl(var(--loss))';
    return 'hsl(var(--muted-foreground))';
  };

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 0.7} viewBox={`0 0 ${size} ${size * 0.75}`}>
        {/* Background arc */}
        <path
          d={backgroundPath}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        
        {/* Value arc with animation */}
        <motion.path
          d={valuePath}
          fill="none"
          stroke={getTrendColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
        />
        
        {/* Center text */}
        <text
          x={centerX}
          y={centerY + 5}
          textAnchor="middle"
          className="fill-foreground font-mono font-bold"
          style={{ fontSize: size * 0.18 }}
        >
          {clampedValue.toFixed(1)}%
        </text>
        
        {/* Label */}
        <text
          x={centerX}
          y={centerY + size * 0.18}
          textAnchor="middle"
          className="fill-muted-foreground"
          style={{ fontSize: size * 0.08 }}
        >
          Win Rate
        </text>
      </svg>
    </div>
  );
};
