import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useFilteredTrades } from '@/hooks/useFilteredTrades';
import { prepareExitTrades, computeHeatmap, HeatmapCell } from '@/lib/exitAnalyzerCalc';
import { Crosshair, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, ReferenceLine, Cell as RechartsCell
} from 'recharts';

// ─── Inputs Section ───
const InputField = ({ label, value, onChange, min }: {
  label: string; value: number; onChange: (v: number) => void; min?: number;
}) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
    <input
      type="number"
      value={value}
      min={min ?? 1}
      onChange={e => onChange(Number(e.target.value))}
      className="h-9 w-24 rounded-md border border-border bg-secondary px-2 text-sm text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-ring"
    />
  </div>
);

// ─── Color helper ───
function cellColor(expectancy: number): string {
  if (expectancy > 0.5) return 'hsl(142 76% 35%)';
  if (expectancy > 0.2) return 'hsl(142 76% 25%)';
  if (expectancy > 0) return 'hsl(142 76% 18%)';
  if (expectancy === 0) return 'hsl(222 47% 14%)';
  if (expectancy > -0.2) return 'hsl(0 84% 18%)';
  if (expectancy > -0.5) return 'hsl(0 84% 25%)';
  return 'hsl(0 84% 35%)';
}

function cellTextColor(expectancy: number): string {
  if (Math.abs(expectancy) > 0.2) return 'hsl(210 40% 98%)';
  return 'hsl(215 20% 55%)';
}

const ExitAnalyzer = () => {
  const { filteredTrades } = useFilteredTrades();

  // Inputs
  const [minSL, setMinSL] = useState(5);
  const [maxSL, setMaxSL] = useState(30);
  const [minTP, setMinTP] = useState(5);
  const [maxTP, setMaxTP] = useState(30);
  const [slStep, setSlStep] = useState(5);
  const [tpStep, setTpStep] = useState(5);
  const [treatMissingAsZero, setTreatMissingAsZero] = useState(true);

  // Selection
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [activeModel, setActiveModel] = useState<{ sl: number; tp: number } | null>(null);

  // Prepare trades
  const exitTrades = useMemo(
    () => prepareExitTrades(filteredTrades, treatMissingAsZero),
    [filteredTrades, treatMissingAsZero]
  );

  // Check for zoom
  const zoomedRange = useMemo(() => {
    if (selectedCells.size === 0) return null;
    const selected = Array.from(selectedCells).map(k => {
      const [s, t] = k.split(':').map(Number);
      return { sl: s, tp: t };
    });
    const sls = selected.map(s => s.sl);
    const tps = selected.map(s => s.tp);
    const margin = 2;
    return {
      minSL: Math.max(1, Math.min(...sls) - margin * slStep),
      maxSL: Math.max(...sls) + margin * slStep,
      minTP: Math.max(1, Math.min(...tps) - margin * tpStep),
      maxTP: Math.max(...tps) + margin * tpStep,
      slStep: Math.max(1, Math.round(slStep / 2)),
      tpStep: Math.max(1, Math.round(tpStep / 2)),
    };
  }, [selectedCells, slStep, tpStep]);

  // Compute heatmap
  const heatmapRange = zoomedRange || { minSL, maxSL, minTP, maxTP, slStep, tpStep };
  const isValidRange = heatmapRange.minSL > 0 && heatmapRange.maxSL >= heatmapRange.minSL &&
    heatmapRange.minTP > 0 && heatmapRange.maxTP >= heatmapRange.minTP &&
    heatmapRange.slStep > 0 && heatmapRange.tpStep > 0;

  const heatmapCells = useMemo(() => {
    if (!isValidRange || exitTrades.length === 0) return [];
    return computeHeatmap(
      exitTrades,
      heatmapRange.minSL, heatmapRange.maxSL, heatmapRange.slStep,
      heatmapRange.minTP, heatmapRange.maxTP, heatmapRange.tpStep
    );
  }, [exitTrades, heatmapRange, isValidRange]);

  // Build grid structure
  const { tpValues, slValues, cellMap } = useMemo(() => {
    const tpSet = new Set<number>();
    const slSet = new Set<number>();
    const map = new Map<string, HeatmapCell>();
    for (const c of heatmapCells) {
      tpSet.add(c.tp);
      slSet.add(c.sl);
      map.set(`${c.sl}:${c.tp}`, c);
    }
    return {
      tpValues: Array.from(tpSet).sort((a, b) => a - b),
      slValues: Array.from(slSet).sort((a, b) => a - b),
      cellMap: map,
    };
  }, [heatmapCells]);

  const toggleCell = useCallback((key: string) => {
    setSelectedCells(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedCells(new Set());
    setActiveModel(null);
  }, []);

  // Selected cells for comparison table
  const comparisonRows = useMemo(() => {
    return Array.from(selectedCells).map(key => cellMap.get(key)!).filter(Boolean);
  }, [selectedCells, cellMap]);

  // Scatter data
  const scatterData = useMemo(() => {
    return exitTrades.map((t, i) => ({ x: t.mae, y: t.mfe, id: i }));
  }, [exitTrades]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3">
          <Crosshair className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Exit Analyzer</h1>
            <p className="text-muted-foreground mt-1">Discover optimal SL/TP exits using historical MFE/MAE behavior</p>
          </div>
        </div>
      </motion.div>

      {/* Inputs Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="glass-card rounded-2xl p-5"
      >
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-wrap items-end gap-3">
            <InputField label="Min SL" value={minSL} onChange={setMinSL} />
            <InputField label="Max SL" value={maxSL} onChange={setMaxSL} />
            <InputField label="SL Step" value={slStep} onChange={setSlStep} />
          </div>
          <div className="w-px h-9 bg-border" />
          <div className="flex flex-wrap items-end gap-3">
            <InputField label="Min TP" value={minTP} onChange={setMinTP} />
            <InputField label="Max TP" value={maxTP} onChange={setMaxTP} />
            <InputField label="TP Step" value={tpStep} onChange={setTpStep} />
          </div>
          <div className="w-px h-9 bg-border" />
          <label className="flex items-center gap-2 cursor-pointer select-none pb-0.5">
            <input
              type="checkbox"
              checked={treatMissingAsZero}
              onChange={e => setTreatMissingAsZero(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <span className="text-sm text-muted-foreground">Treat missing as 0</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-[200px] text-xs">When enabled, trades without MFE/MAE data are treated as 0 ticks movement. When disabled, they are excluded.</p>
              </TooltipContent>
            </Tooltip>
          </label>
        </div>
        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="font-mono">{exitTrades.length} trades</span>
          {selectedCells.size > 0 && (
            <button onClick={clearSelection} className="text-primary hover:underline">
              Clear selection ({selectedCells.size})
            </button>
          )}
          {zoomedRange && (
            <span className="text-primary">🔍 Zoomed view</span>
          )}
        </div>
      </motion.div>

      {/* Empty state */}
      {exitTrades.length === 0 && (
        <div className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center min-h-[300px]">
          <p className="text-muted-foreground text-lg">No trades with MFE/MAE data available.</p>
          <p className="text-muted-foreground text-sm mt-1">Add MFE/MAE tick values to your trades to use the Exit Analyzer.</p>
        </div>
      )}

      {/* Invalid range */}
      {exitTrades.length > 0 && !isValidRange && (
        <div className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center min-h-[200px]">
          <p className="text-muted-foreground">Invalid SL/TP ranges. Please adjust the inputs.</p>
        </div>
      )}

      {/* Heatmap */}
      {heatmapCells.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-5 overflow-x-auto"
        >
          <h2 className="text-lg font-semibold mb-4">SL / TP Performance Heatmap</h2>
          <div className="overflow-auto" style={{ maxWidth: `${16*4 + 15 * 82}px`, maxHeight: `${10 + 10 * 82}px` }}>
          <div className="inline-block">
            {/* Header row */}
            <div className="flex">
              <div className="w-16 h-10 flex items-center justify-center text-xs text-muted-foreground font-medium">
                SL\TP
              </div>
              {tpValues.map(tp => (
                <div key={tp} className="w-20 h-10 flex items-center justify-center text-xs font-mono text-muted-foreground">
                  {tp}
                </div>
              ))}
            </div>
            {/* Data rows */}
            {slValues.map(sl => (
              <div key={sl} className="flex">
                <div className="w-16 h-20 flex items-center justify-center text-xs font-mono text-muted-foreground">
                  {sl}
                </div>
                {tpValues.map(tp => {
                  const key = `${sl}:${tp}`;
                  const cell = cellMap.get(key);
                  if (!cell) return <div key={key} className="w-20 h-20" />;
                  const isSelected = selectedCells.has(key);
                  return (
                    <Tooltip key={key}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => toggleCell(key)}
                          className="w-20 h-20 m-0.5 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all duration-150 hover:scale-105 cursor-pointer"
                          style={{
                            backgroundColor: cellColor(cell.expectancy),
                            color: cellTextColor(cell.expectancy),
                            outline: isSelected ? '2px solid hsl(199 89% 48%)' : 'none',
                            outlineOffset: isSelected ? '-2px' : '0',
                          }}
                        >
                          <span className="text-sm font-bold font-mono">
                            {cell.expectancy >= 0 ? '+' : ''}{cell.expectancy.toFixed(2)}R
                          </span>
                          <span className="text-[10px] opacity-80">
                            {cell.winRate.toFixed(0)}% win
                          </span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="font-mono text-xs space-y-0.5">
                        <p>SL: {cell.sl} | TP: {cell.tp}</p>
                        <p>Expectancy: {cell.expectancy.toFixed(3)}R</p>
                        <p>Win Rate: {cell.winRate.toFixed(1)}%</p>
                        <p>Trades: {cell.tradesCount}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </div>
          </div>
          {/* Legend */}
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <span>Negative</span>
            <div className="flex gap-0.5">
              {['hsl(0 84% 35%)', 'hsl(0 84% 25%)', 'hsl(0 84% 18%)', 'hsl(222 47% 14%)', 'hsl(142 76% 18%)', 'hsl(142 76% 25%)', 'hsl(142 76% 35%)'].map((c, i) => (
                <div key={i} className="w-6 h-3 rounded-sm" style={{ backgroundColor: c }} />
              ))}
            </div>
            <span>Positive</span>
          </div>
        </motion.div>
      )}

      {/* Comparison Table */}
      {comparisonRows.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-5"
        >
          <h2 className="text-lg font-semibold mb-4">Model Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">SL</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">TP</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Expectancy</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Win Rate</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Avg R</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Trades</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map(row => {
                  const isActive = activeModel?.sl === row.sl && activeModel?.tp === row.tp;
                  return (
                    <tr
                      key={`${row.sl}:${row.tp}`}
                      onClick={() => setActiveModel({ sl: row.sl, tp: row.tp })}
                      className={`cursor-pointer transition-colors border-b border-border/50 hover:bg-secondary/50 ${isActive ? 'bg-primary/10' : ''}`}
                    >
                      <td className="py-2.5 px-3 font-mono">{row.sl}</td>
                      <td className="py-2.5 px-3 font-mono">{row.tp}</td>
                      <td className={`py-2.5 px-3 text-right font-mono font-semibold ${row.expectancy > 0 ? 'profit-text' : row.expectancy < 0 ? 'loss-text' : ''}`}>
                        {row.expectancy >= 0 ? '+' : ''}{row.expectancy.toFixed(3)}R
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">{row.winRate.toFixed(1)}%</td>
                      <td className="py-2.5 px-3 text-right font-mono">{row.avgR.toFixed(3)}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{row.tradesCount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* MFE/MAE Scatter Chart */}
      {exitTrades.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="glass-card rounded-2xl p-5"
        >
          <h2 className="text-lg font-semibold mb-4">MFE / MAE Scatter</h2>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 47% 18%)" />
              <XAxis
                type="number" dataKey="x" name="MAE (ticks)"
                label={{ value: 'MAE (ticks)', position: 'bottom', offset: 0, style: { fill: 'hsl(215 20% 55%)', fontSize: 12 } }}
                tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }}
                stroke="hsl(222 47% 18%)"
              />
              <YAxis
                type="number" dataKey="y" name="MFE (ticks)"
                label={{ value: 'MFE (ticks)', angle: -90, position: 'insideLeft', style: { fill: 'hsl(215 20% 55%)', fontSize: 12 } }}
                tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }}
                stroke="hsl(222 47% 18%)"
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: 'hsl(222 47% 10%)',
                  border: '1px solid hsl(222 47% 18%)',
                  borderRadius: '8px',
                  color: 'hsl(210 40% 98%)',
                  fontSize: 12,
                }}
                formatter={(value: number, name: string) => [value, name]}
              />
              {activeModel && (
                <>
                  <ReferenceLine
                    x={activeModel.sl}
                    stroke="hsl(0 84% 60%)"
                    strokeDasharray="6 3"
                    strokeWidth={2}
                    label={{ value: `SL ${activeModel.sl}`, fill: 'hsl(0 84% 60%)', fontSize: 11, position: 'top' }}
                  />
                  <ReferenceLine
                    y={activeModel.tp}
                    stroke="hsl(142 76% 45%)"
                    strokeDasharray="6 3"
                    strokeWidth={2}
                    label={{ value: `TP ${activeModel.tp}`, fill: 'hsl(142 76% 45%)', fontSize: 11, position: 'right' }}
                  />
                </>
              )}
              <Scatter data={scatterData} fill="hsl(199 89% 48%)" fillOpacity={0.6} r={4}>
                {scatterData.map((_, i) => (
                  <RechartsCell key={i} fill="hsl(199 89% 48%)" />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </div>
  );
};

export default ExitAnalyzer;
