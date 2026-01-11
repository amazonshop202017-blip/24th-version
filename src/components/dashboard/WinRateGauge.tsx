import { Gauge, gaugeClasses } from '@mui/x-charts/Gauge';

interface WinRateGaugeProps {
  value: number;
}

export const WinRateGauge = ({ value }: WinRateGaugeProps) => {
  const clampedValue = Math.min(100, Math.max(0, value));
  
  const getValueColor = () => {
    if (clampedValue >= 50) return 'hsl(142, 76%, 36%)'; // profit green
    if (clampedValue > 0) return 'hsl(0, 84%, 60%)'; // loss red
    return 'hsl(215, 20%, 65%)'; // neutral
  };

  return (
    <div className="flex flex-col items-center">
      <Gauge
        width={180}
        height={120}
        value={clampedValue}
        startAngle={-110}
        endAngle={110}
        text={({ value: currentValue }) => `${currentValue?.toFixed(1)}%`}
        sx={{
          [`& .${gaugeClasses.valueText}`]: {
            fontSize: 24,
            fontFamily: 'ui-monospace, monospace',
            fontWeight: 'bold',
            fill: 'hsl(var(--foreground))',
          },
          [`& .${gaugeClasses.valueArc}`]: {
            fill: getValueColor(),
          },
          [`& .${gaugeClasses.referenceArc}`]: {
            fill: 'hsl(var(--muted))',
          },
        }}
        valueMax={100}
      />
      <span className="text-sm text-muted-foreground -mt-2">Win Rate</span>
    </div>
  );
};
