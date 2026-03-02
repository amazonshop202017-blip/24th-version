import { useState, useMemo, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useFilteredTrades } from '@/hooks/useFilteredTrades';
import { prepareExitTrades, computeHeatmap, HeatmapCell } from '@/lib/exitAnalyzerCalc';
import { Crosshair, Info, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, ReferenceLine, Cell as RechartsCell
} from 'recharts';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { HeatmapChart } from 'echarts/charts';
import {
  GridComponent, TooltipComponent, VisualMapComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

echarts.use([HeatmapChart, GridComponent, TooltipComponent, VisualMapComponent, CanvasRenderer]);

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
  const [coloringMode, setColoringMode] = useState<'expectancy' | 'winrate'>('expectancy');

  // Selection
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [activeModel, setActiveModel] = useState<{ sl: number; tp: number } | null>(null);

  // Scatter overlay inputs
  const [scatterTP, setScatterTP] = useState<number>(0);
  const [scatterSL, setScatterSL] = useState<number>(0);

  // Prepare trades
  const exitTrades = useMemo(
    () => prepareExitTrades(filteredTrades, treatMissingAsZero),
    [filteredTrades, treatMissingAsZero]
  );

  // Compute heatmap
  const heatmapRange = { minSL, maxSL, minTP, maxTP, slStep, tpStep };
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
          className="glass-card rounded-2xl p-5 overflow-auto"
          style={{ maxHeight: 700 }}
        >
          <div className="flex items-center justify-between mb-4 sticky top-0 left-0 z-10">
            <h2 className="text-lg font-semibold">SL / TP Performance Heatmap</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Coloring:</span>
              <div className="flex rounded-md border border-border overflow-hidden">
                <button
                  onClick={() => setColoringMode('expectancy')}
                  className={`px-3 py-1 text-xs font-medium transition-colors ${coloringMode === 'expectancy' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
                >
                  Expectancy
                </button>
                <button
                  onClick={() => setColoringMode('winrate')}
                  className={`px-3 py-1 text-xs font-medium transition-colors ${coloringMode === 'winrate' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
                >
                  Win Rate
                </button>
              </div>
            </div>
          </div>
          <ReactEChartsCore
            echarts={echarts}
            style={{ width: Math.max(600, tpValues.length * 80 + 120), height: Math.max(400, slValues.length * 60 + 120) }}
            option={{
              tooltip: {
                position: 'top',
                formatter: (params: any) => {
                  const cell = cellMap.get(`${slValues[params.value[1]]}:${tpValues[params.value[0]]}`);
                  if (!cell) return '';
                  return `<div style="font-family:monospace;font-size:12px">
                    <div>SL: ${cell.sl} | TP: ${cell.tp}</div>
                    <div>Expectancy: ${cell.expectancy >= 0 ? '+' : ''}${cell.expectancy.toFixed(3)}R</div>
                    <div>Win Rate: ${cell.winRate.toFixed(1)}%</div>
                    <div>Trades: ${cell.tradesCount}</div>
                  </div>`;
                },
              },
              grid: {
                top: 30,
                bottom: 60,
                left: 70,
                right: 30,
                containLabel: false,
              },
              xAxis: {
                type: 'category',
                data: tpValues.map(String),
                name: 'TP (ticks)',
                nameLocation: 'middle',
                nameGap: 35,
                nameTextStyle: { color: 'hsl(215, 20%, 55%)', fontSize: 12 },
                splitArea: { show: true },
                axisLabel: { color: 'hsl(215, 20%, 55%)', fontSize: 11 },
                axisLine: { lineStyle: { color: 'hsl(222, 47%, 18%)' } },
                axisTick: { lineStyle: { color: 'hsl(222, 47%, 18%)' } },
              },
              yAxis: {
                type: 'category',
                data: slValues.map(String),
                name: 'SL (ticks)',
                nameLocation: 'middle',
                nameGap: 45,
                nameTextStyle: { color: 'hsl(215, 20%, 55%)', fontSize: 12 },
                splitArea: { show: true },
                axisLabel: { color: 'hsl(215, 20%, 55%)', fontSize: 11 },
                axisLine: { lineStyle: { color: 'hsl(222, 47%, 18%)' } },
                axisTick: { lineStyle: { color: 'hsl(222, 47%, 18%)' } },
              },
              visualMap: {
                min: coloringMode === 'expectancy'
                  ? Math.min(...heatmapCells.map(c => c.expectancy))
                  : Math.min(...heatmapCells.map(c => c.winRate)),
                max: coloringMode === 'expectancy'
                  ? Math.max(...heatmapCells.map(c => c.expectancy))
                  : Math.max(...heatmapCells.map(c => c.winRate)),
                calculable: false,
                orient: 'horizontal',
                left: 'center',
                bottom: 0,
                inRange: {
                  color: ['#8B3A1A', '#C96A2B', '#2A2F36', '#2FAF7A', '#1A7A4E'],
                },
                textStyle: { color: 'hsl(215, 20%, 55%)' },
              },
              series: [{
                name: coloringMode === 'expectancy' ? 'Expectancy' : 'Win Rate',
                type: 'heatmap',
                data: heatmapCells.map(c => {
                  const xi = tpValues.indexOf(c.tp);
                  const yi = slValues.indexOf(c.sl);
                  const colorVal = coloringMode === 'expectancy' ? c.expectancy : c.winRate;
                  return { value: [xi, yi, colorVal], expectancy: c.expectancy, winRate: c.winRate };
                }),
                label: {
                  show: true,
                  formatter: (params: any) => {
                    const exp = params.data.expectancy as number;
                    const wr = params.data.winRate as number;
                    const expStr = `${exp >= 0 ? '+' : ''}${exp.toFixed(2)}R`;
                    const wrStr = `${wr.toFixed(1)}%`;
                    if (coloringMode === 'expectancy') {
                      return `{primary|${expStr}}\n{secondary|WR: ${wrStr}}`;
                    }
                    return `{primary|${wrStr}}\n{secondary|Exp: ${expStr}}`;
                  },
                  rich: {
                    primary: {
                      fontSize: 11,
                      fontFamily: 'monospace',
                      fontWeight: 'bold' as const,
                      color: 'hsl(210, 40%, 98%)',
                      align: 'center' as const,
                      lineHeight: 16,
                    },
                    secondary: {
                      fontSize: 9,
                      fontFamily: 'monospace',
                      color: 'hsla(210, 40%, 98%, 0.65)',
                      align: 'center' as const,
                      lineHeight: 14,
                    },
                  },
                },
                emphasis: {
                  itemStyle: {
                    shadowBlur: 10,
                    shadowColor: 'rgba(0, 0, 0, 0.5)',
                  },
                },
                itemStyle: {
                  borderWidth: 6,
                  borderColor: 'hsl(222, 47%, 8%)',
                  borderRadius: 10,
                },
              }],
              backgroundColor: 'transparent',
            }}
            onEvents={{
              click: (params: any) => {
                if (params.componentType === 'series' && params.data?.value) {
                  const val = params.data.value;
                  const key = `${slValues[val[1]]}:${tpValues[val[0]]}`;
                  toggleCell(key);
                }
              },
            }}
            notMerge={true}
          />
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
                  <th className="w-8"></th>
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
                      <td className="py-2.5 px-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleCell(`${row.sl}:${row.tp}`); }}
                          className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </td>
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
          <h2 className="text-lg font-semibold mb-3">MFE / MAE Scatter</h2>
          <div className="flex items-end gap-4 mb-4">
            <InputField label="Profit (TP) Ticks" value={scatterTP} onChange={setScatterTP} min={0} />
            <InputField label="Loss (SL) Ticks" value={scatterSL} onChange={setScatterSL} min={0} />
            {(scatterTP > 0 || scatterSL > 0) && (
              <div className="text-xs text-muted-foreground pb-1.5 space-y-0.5">
                {scatterTP > 0 && <p className="text-profit">TP hit: {scatterData.filter(d => d.y >= scatterTP).length} trades</p>}
                {scatterSL > 0 && <p className="text-loss">SL hit: {scatterData.filter(d => d.x >= scatterSL).length} trades</p>}
              </div>
            )}
          </div>
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
                itemStyle={{ color: 'hsl(210 40% 98%)' }}
                labelStyle={{ color: 'hsl(210 40% 98%)' }}
                formatter={(value: number, name: string) => [value, name]}
              />
              {scatterSL > 0 && (
                <ReferenceLine
                  x={scatterSL}
                  stroke="hsl(0 84% 60%)"
                  strokeDasharray="6 3"
                  strokeWidth={2}
                  label={{ value: `SL ${scatterSL}`, fill: 'hsl(0 84% 60%)', fontSize: 11, position: 'top' }}
                />
              )}
              {scatterTP > 0 && (
                <ReferenceLine
                  y={scatterTP}
                  stroke="hsl(142 76% 45%)"
                  strokeDasharray="6 3"
                  strokeWidth={2}
                  label={{ value: `TP ${scatterTP}`, fill: 'hsl(142 76% 45%)', fontSize: 11, position: 'right' }}
                />
              )}
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
