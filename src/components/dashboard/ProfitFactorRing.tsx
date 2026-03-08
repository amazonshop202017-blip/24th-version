import { PieChart } from '@mui/x-charts/PieChart';
import { usePrivacyMode } from '@/hooks/usePrivacyMode';

interface ProfitFactorRingProps {
  profitFactor: number;
  totalProfits: number;
  totalLosses: number;
}

export const ProfitFactorRing = ({ 
  profitFactor, 
  totalProfits, 
  totalLosses
}: ProfitFactorRingProps) => {
  const { isPrivacyMode, maskProfitFactor } = usePrivacyMode();
  
  const total = totalProfits + Math.abs(totalLosses);
  const profitPercent = total > 0 ? totalProfits : 1;
  const lossPercent = total > 0 ? Math.abs(totalLosses) : 1;

  const pieData = [
    { id: 0, value: profitPercent, label: 'Profits', color: 'hsl(142, 76%, 45%)' },
    { id: 1, value: lossPercent, label: 'Losses', color: 'hsl(0, 84%, 60%)' },
  ].filter(d => d.value > 0);

  if (pieData.length === 0) {
    pieData.push({ id: 0, value: 1, label: 'No Data', color: 'hsl(var(--muted))' });
  }

  return (
    <div className="flex items-center justify-between w-full gap-2">
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">Profit Factor</span>
        <span className="text-2xl font-bold font-mono">
          {maskProfitFactor(profitFactor)}
        </span>
      </div>
      <div style={{ width: 60, height: 60 }}>
        <PieChart
          series={[
            {
              data: pieData,
              innerRadius: 16,
              outerRadius: 27,
              paddingAngle: 2,
              cornerRadius: 3,
              cx: 26,
              cy: 26,
            },
          ]}
          width={60}
          height={60}
          skipAnimation={false}
        />
      </div>
    </div>
  );
};
