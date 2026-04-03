import { useState, useRef, useCallback } from 'react';
import { Settings2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getDisplayLabel, ChartDisplayType } from '@/hooks/useChartDisplayMode';

export type ChartSeriesType = 'column' | 'line';

export interface MetricConfig {
  type: ChartSeriesType;
  color: string;
}

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
                <NativeColorPicker
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

const NativeColorPicker = ({ color, onChange }: { color: string; onChange: (color: string) => void }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Convert hsl(...) to a hex approximation for the native input
  const getHexFromColor = useCallback((c: string): string => {
    try {
      const el = document.createElement('div');
      el.style.color = c;
      document.body.appendChild(el);
      const computed = getComputedStyle(el).color;
      document.body.removeChild(el);
      const match = computed.match(/(\d+)/g);
      if (match && match.length >= 3) {
        const [r, g, b] = match.map(Number);
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
      }
    } catch {}
    return '#3b82f6';
  }, []);

  const [hexValue, setHexValue] = useState(() => getHexFromColor(color));

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => inputRef.current?.click()}
        className="w-6 h-6 rounded border border-border transition-transform hover:scale-110 cursor-pointer"
        style={{ backgroundColor: color }}
      />
      <input
        ref={inputRef}
        type="color"
        value={hexValue}
        onChange={(e) => {
          const hex = e.target.value;
          setHexValue(hex);
          onChange(hex);
        }}
        className="absolute inset-0 w-6 h-6 opacity-0 cursor-pointer"
      />
    </div>
  );
};
