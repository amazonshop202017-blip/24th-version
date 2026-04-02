import { useState, useRef, useEffect } from 'react';
import { Settings2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getDisplayLabel, ChartDisplayType } from '@/hooks/useChartDisplayMode';

export type ChartSeriesType = 'column' | 'line';

export interface MetricConfig {
  type: ChartSeriesType;
  color: string;
}

const COLOR_PALETTE = [
  'hsl(var(--primary))',
  'hsl(var(--profit))',
  'hsl(45 93% 47%)',
  'hsl(280 65% 60%)',
  'hsl(200 80% 55%)',
  'hsl(340 75% 55%)',
  'hsl(160 60% 45%)',
  'hsl(25 90% 55%)',
];

interface ChartMetricSettingsPopoverProps {
  metrics: ChartDisplayType[];
  configs: MetricConfig[];
  onConfigChange: (index: number, config: Partial<MetricConfig>) => void;
}

export const ChartMetricSettingsPopover = ({
  metrics,
  configs,
  onConfigChange,
}: ChartMetricSettingsPopoverProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <Settings2 className="w-4 h-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-3" sideOffset={5}>
        <p className="text-xs font-medium text-muted-foreground mb-3">Chart Display Settings</p>
        <div className="space-y-3">
          {metrics.map((metric, index) => {
            const config = configs[index];
            if (!config) return null;
            return (
              <div key={`${metric}-${index}`} className="flex items-center gap-2">
                <span className="text-xs text-foreground truncate min-w-0 flex-1" title={getDisplayLabel(metric)}>
                  {getDisplayLabel(metric)}
                </span>
                <Select
                  value={config.type}
                  onValueChange={(v) => onConfigChange(index, { type: v as ChartSeriesType })}
                >
                  <SelectTrigger className="h-7 w-[90px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="column">Column</SelectItem>
                    <SelectItem value="line">Line</SelectItem>
                  </SelectContent>
                </Select>
                <ColorPicker
                  color={config.color}
                  onChange={(c) => onConfigChange(index, { color: c })}
                />
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};

const ColorPicker = ({ color, onChange }: { color: string; onChange: (color: string) => void }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="w-6 h-6 rounded border border-border shrink-0 transition-transform hover:scale-110"
        style={{ backgroundColor: color }}
      />
      {open && (
        <div className="absolute right-0 top-8 z-50 bg-popover border border-border rounded-lg p-2 shadow-lg grid grid-cols-4 gap-1.5">
          {COLOR_PALETTE.map((c) => (
            <button
              key={c}
              onClick={() => { onChange(c); setOpen(false); }}
              className={`w-6 h-6 rounded border transition-transform hover:scale-110 ${c === color ? 'border-foreground ring-1 ring-foreground' : 'border-border'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
