import { PieChart } from '@mui/x-charts/PieChart';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface WinRateGaugeProps {
  value: number;
  label: string;
  winners?: number;
  losers?: number;
  breakeven?: number;
}

export const WinRateGauge = ({ value, label, winners = 0, losers = 0, breakeven = 0 }: WinRateGaugeProps) => {
  const total = winners + losers + breakeven;

  const pieData = [
    { id: 0, value: winners, label: 'Win', color: 'hsl(var(--profit))' },
    { id: 1, value: breakeven, label: 'Breakeven', color: 'hsl(var(--muted-foreground))' },
    { id: 2, value: losers, label: 'Loss', color: 'hsl(var(--loss))' },
  ].filter(d => d.value > 0);

  if (pieData.length === 0) {
    pieData.push({ id: 0, value: 1, label: 'No Data', color: 'hsl(var(--muted))' });
  }

  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <TooltipProvider>
      <div className="flex flex-col items-center w-full">
        <span className="text-xs text-muted-foreground mb-1">{label}</span>
        
        <div className="relative overflow-visible" style={{ width: 120, height: 70 }}>
          <PieChart
            series={[
              {
                data: pieData.map(d => ({
                  ...d,
                  label: `${d.label}: ${d.value} (${total > 0 ? ((d.value / total) * 100).toFixed(1) : 0}%)`,
                })),
                innerRadius: 24,
                outerRadius: 46,
                startAngle: -90,
                endAngle: 90,
                paddingAngle: 2,
                cornerRadius: 4,
                cx: 55,
                cy: 58,
                arcLabel: () => '',
                highlightScope: { fade: 'global', highlight: 'item' },
              },
            ]}
            width={120}
            height={75}
            hideLegend
            skipAnimation={false}
          />
          {/* Percentage overlay */}
          <div className="absolute inset-0 flex items-end justify-center pb-0 pointer-events-none">
            <span className="font-bold font-mono" style={{ fontSize: 13 }}>{clampedValue.toFixed(2)}%</span>
          </div>
        </div>
        
        {/* Numbers below gauge */}
        <div className="flex items-center justify-between w-full mt-1 text-xs font-medium" style={{ maxWidth: 110 }}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="profit-text cursor-help bg-profit/15 px-2 py-0.5 rounded-full">{winners}</span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Winners
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-muted-foreground cursor-help bg-muted/50 px-2 py-0.5 rounded-full">{breakeven}</span>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Breakeven
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="loss-text cursor-help bg-loss/15 px-2 py-0.5 rounded-full">{losers}</span>
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
