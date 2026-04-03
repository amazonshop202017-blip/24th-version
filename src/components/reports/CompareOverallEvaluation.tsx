import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { CompareGroupStats } from '@/lib/compareUtils';

interface CompareOverallEvaluationProps {
  groupNumber: 1 | 2;
  stats: CompareGroupStats;
}

export const CompareOverallEvaluation = ({ groupNumber, stats }: CompareOverallEvaluationProps) => {
  const chartData = useMemo(() => {
    const wins = stats.winningTradesCount;
    const losses = stats.losingTradesCount;
    
    if (wins === 0 && losses === 0) {
      return [{ name: 'No Data', value: 1, color: 'hsl(var(--muted))' }];
    }
    
    return [
      { name: 'Winners', value: wins, color: 'hsl(var(--profit))' },
      { name: 'Losers', value: losses, color: 'hsl(var(--loss))' },
    ];
  }, [stats.winningTradesCount, stats.losingTradesCount]);

  const winRateDisplay = stats.winRate.toFixed(0);

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h3 className="text-sm font-semibold uppercase tracking-wide mb-1">
        OVERALL EVALUATION (GROUP #{groupNumber})
      </h3>
      <p className="text-xs text-muted-foreground mb-4">({stats.dateRangeLabel})</p>
      
      <div className="flex items-center justify-between">
        {/* Donut Chart */}
        <div className="relative w-40 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                startAngle={90}
                endAngle={-270}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          
          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold profit-text">
              {winRateDisplay}
              <span className="text-lg">%</span>
            </span>
            <span className="text-xs profit-text uppercase tracking-wider">
              WINRATE
            </span>
          </div>
        </div>
        
        {/* Legend */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(var(--profit))' }} />
            <div>
              <span className="text-2xl font-bold text-foreground">{stats.winningTradesCount}</span>
              <p className="text-xs profit-text">winners</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(var(--loss))' }} />
            <div>
              <span className="text-2xl font-bold text-foreground">{stats.losingTradesCount}</span>
              <p className="text-xs loss-text">losers</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
