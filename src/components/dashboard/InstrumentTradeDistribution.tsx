import { useMemo } from 'react';
import { PieChart } from '@mui/x-charts/PieChart';
import { motion } from 'framer-motion';
import { useFilteredTrades } from '@/hooks/useFilteredTrades';
import { useCustomColorGradientFill } from '@/components/charts/ChartGradientDefs';

const COLORS = [
  'hsl(174, 32%, 50%)',
  'hsl(140, 20%, 55%)',
  'hsl(260, 25%, 60%)',
  'hsl(0, 40%, 60%)',
  'hsl(160, 30%, 45%)',
  'hsl(200, 25%, 55%)',
  'hsl(30, 35%, 55%)',
  'hsl(280, 20%, 50%)',
  'hsl(50, 30%, 50%)',
  'hsl(220, 30%, 55%)',
];

interface SymbolEntry {
  symbol: string;
  count: number;
  percentage: number;
  color: string;
}

export const InstrumentTradeDistribution = () => {
  const { filteredTrades: trades } = useFilteredTrades();

  const { entries, totalTrades, uniqueCount } = useMemo(() => {
    if (trades.length === 0) return { entries: [], totalTrades: 0, uniqueCount: 0 };

    const map = new Map<string, number>();
    trades.forEach(t => {
      const s = t.symbol?.toUpperCase();
      if (s) map.set(s, (map.get(s) || 0) + 1);
    });

    const total = trades.length;
    const sorted = Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([symbol, count], i): SymbolEntry => ({
        symbol,
        count,
        percentage: (count / total) * 100,
        color: COLORS[i % COLORS.length],
      }));

    return { entries: sorted, totalTrades: total, uniqueCount: sorted.length };
  }, [trades]);

  if (entries.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="glass-card rounded-xl p-4 h-full flex flex-col min-h-[300px]"
      >
        <div className="mb-2">
          <h3 className="text-sm font-medium text-foreground">Instrument Trade Distribution</h3>
        </div>
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          No trade data available
        </div>
      </motion.div>
    );
  }

  const maxCount = entries[0]?.count || 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-card rounded-xl p-4 h-full flex flex-col min-h-[300px]"
    >
      <div className="mb-1">
        <h3 className="text-sm font-medium text-foreground">Instrument Trade Distribution</h3>
        <p className="text-xs text-muted-foreground">
          {totalTrades} total trades across {uniqueCount} instrument{uniqueCount !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="flex-1 flex flex-col md:flex-row items-center gap-4 min-h-0">
        {/* Left: Donut chart */}
        <div className="relative flex items-center justify-center shrink-0" style={{ width: 180, height: 180 }}>
          <PieChart
            series={[
              {
                data: entries.map((e, i) => ({
                  id: i,
                  value: e.count,
                  label: e.symbol,
                  color: e.color,
                })),
                innerRadius: 45,
                outerRadius: 80,
                paddingAngle: 2,
                cornerRadius: 3,
                cx: 85,
                cy: 85,
                arcLabel: () => '',
                highlightScope: { fade: 'global', highlight: 'item' },
              },
            ]}
            width={180}
            height={180}
            hideLegend
            skipAnimation={false}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-foreground">{uniqueCount}</span>
            <span className="text-[9px] font-semibold tracking-widest text-muted-foreground uppercase">
              Instruments
            </span>
          </div>
        </div>

        {/* Right: Ranked bar list */}
        <div className="flex-1 min-w-0 w-full overflow-y-auto max-h-[200px] md:max-h-full">
          <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase mb-2">
            Most Traded Instruments
          </p>
          <div className="space-y-1.5">
            {entries.map((entry, idx) => (
              <div key={entry.symbol} className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground w-4 text-right shrink-0">{idx + 1}</span>
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="font-medium text-foreground w-16 truncate shrink-0">{entry.symbol}</span>
                <div className="flex-1 h-4 bg-muted/40 rounded overflow-hidden">
                  <motion.div
                    className="h-full rounded"
                    style={{ backgroundColor: entry.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(entry.count / maxCount) * 100}%` }}
                    transition={{ duration: 0.6, delay: idx * 0.05 }}
                  />
                </div>
                <span className="font-mono font-medium text-foreground w-5 text-right shrink-0">{entry.count}</span>
                <span className="text-muted-foreground w-10 text-right shrink-0">{entry.percentage.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
