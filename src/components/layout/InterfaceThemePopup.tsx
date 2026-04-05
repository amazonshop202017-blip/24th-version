import { useInterfaceTheme } from '@/contexts/InterfaceThemeContext';
import { X, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRef } from 'react';

interface Props {
  onClose: () => void;
}

const ColorRow = ({
  label,
  color,
  onChange,
}: {
  label: string;
  color: string;
  onChange: (c: string) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-xs font-mono text-muted-foreground uppercase">{color}</span>
      </div>
      <div className="relative w-full h-8">
        <div
          className="w-full h-full rounded-md border border-border/30"
          style={{ backgroundColor: color }}
        />
        <input
          ref={inputRef}
          type="color"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
};

export const InterfaceThemePopup = ({ onClose }: Props) => {
  const { theme, setThemeColor, setMode, resetToDefaults } = useInterfaceTheme();

  return (
    <div className="w-64 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
          </div>
          <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Interface Theme
          </span>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <ColorRow
        label="Positive Color"
        color={theme.positive}
        onChange={(c) => setThemeColor('positive', c)}
      />

      <ColorRow
        label="Negative Color"
        color={theme.negative}
        onChange={(c) => setThemeColor('negative', c)}
      />

      <ColorRow
        label="Neutral Color"
        color={theme.neutral}
        onChange={(c) => setThemeColor('neutral', c)}
      />

      {/* Flat / Gradient toggle */}
      <div className="pt-2 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Style</span>
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setMode('flat')}
              className={cn(
                "px-3 py-1 text-xs font-medium transition-colors",
                theme.mode === 'flat'
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Flat
            </button>
            <button
              onClick={() => setMode('gradient')}
              className={cn(
                "px-3 py-1 text-xs font-medium transition-colors",
                theme.mode === 'gradient'
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Gradient
            </button>
          </div>
        </div>
      </div>

      {/* Reset */}
      <button
        onClick={resetToDefaults}
        className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1.5"
      >
        <RotateCcw className="w-3 h-3" />
        Reset to defaults
      </button>
    </div>
  );
};
