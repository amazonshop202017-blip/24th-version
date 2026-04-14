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
      <div className="flex items-center justify-between w-full h-full">
        {/* LEFT: Title + Percentage */}
        <div className="flex flex-col items-start justify-start">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className="text-2xl font-bold font-mono mt-0.5">{clampedValue.toFixed(2)}%</span>
        </div>

        {/* RIGHT: Chart + Bubbles */}
        <div className="flex flex-col items-center">
          <div className="relative overflow-visible" style={{ width: 100, height: 56 }}>
            <PieChart
              series={[
                {
                  data: pieData.map(d => ({
                    ...d,
                    label: `${d.label}: ${d.value} (${total > 0 ? ((d.value / total) * 100).toFixed(1) : 0}%)`,
                  })),
                  innerRadius: 20,
                  outerRadius: 38,
                  startAngle: -90,
                  endAngle: 90,
                  paddingAngle: 2,
                  cornerRadius: 4,
                  cx: 46,
                  cy: 46,
                  arcLabel: () => '',
                  highlightScope: { fade: 'global', highlight: 'item' },
                },
              ]}
              width={100}
              height={58}
              hideLegend
              skipAnimation={false}
            />
          </div>
          
          {/* Bubbles below chart */}
          <div className="flex items-center gap-1.5 -mt-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="profit-text cursor-help bg-profit/15 px-1.5 py-0.5 rounded-full text-[10px] font-medium">{winners}</span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Winners</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-muted-foreground cursor-help bg-muted/50 px-1.5 py-0.5 rounded-full text-[10px] font-medium">{breakeven}</span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Breakeven</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="loss-text cursor-help bg-loss/15 px-1.5 py-0.5 rounded-full text-[10px] font-medium">{losers}</span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Losers</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};
