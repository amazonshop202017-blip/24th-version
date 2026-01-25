import { CompareGroupStats } from '@/lib/compareUtils';

interface CompareStatisticsTableProps {
  groupNumber: 1 | 2;
  stats: CompareGroupStats;
}

export const CompareStatisticsTable = ({ groupNumber, stats }: CompareStatisticsTableProps) => {
  const formatCurrency = (value: number) => {
    const formatted = Math.abs(value).toFixed(2);
    return value < 0 ? `-$${formatted}` : `$${formatted}`;
  };

  const formatNumber = (value: number, decimals: number = 2) => {
    return value.toFixed(decimals);
  };

  const rows = [
    { label: 'Total P&L', value: formatCurrency(stats.totalPnL), isPositive: stats.totalPnL >= 0 },
    { label: 'Average daily volume', value: formatNumber(stats.avgDailyVolume) },
    { label: 'Average winning trade', value: formatCurrency(stats.avgWinningTrade), isPositive: true },
    { label: 'Average losing trade', value: formatCurrency(stats.avgLosingTrade), isPositive: false },
    { label: 'Number of winning trades', value: stats.winningTradesCount.toString(), isPositive: true },
    { label: 'Number of losing trades', value: stats.losingTradesCount.toString(), isPositive: false },
    { label: 'Total commissions', value: formatCurrency(stats.totalCommissions) },
    { label: 'Max consecutive wins', value: stats.maxConsecutiveWins.toString() },
    { label: 'Max consecutive losses', value: stats.maxConsecutiveLosses.toString() },
  ];

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wide mb-1">
        STATISTICS (Group #{groupNumber})
      </h3>
      <p className="text-xs text-muted-foreground mb-4">({stats.dateRangeLabel})</p>
      
      <div className="space-y-3">
        {rows.map((row, index) => (
          <div key={index} className="flex justify-between items-center py-1 border-b border-border/50 last:border-0">
            <span className={`text-sm ${
              row.isPositive === true ? 'text-emerald-500' : 
              row.isPositive === false ? 'text-red-500' : 
              'text-muted-foreground'
            }`}>
              {row.label}
            </span>
            <span className={`text-sm font-medium ${
              row.isPositive === true ? 'text-emerald-500' : 
              row.isPositive === false ? 'text-red-500' : 
              'text-foreground'
            }`}>
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
