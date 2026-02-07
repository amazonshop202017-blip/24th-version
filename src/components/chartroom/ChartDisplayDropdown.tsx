import { useState } from 'react';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChartDisplayType, getDisplayLabel } from '@/hooks/useChartDisplayMode';

interface DisplayOption {
  value: ChartDisplayType;
  label: string;
}

interface DisplayGroup {
  name: string;
  options: DisplayOption[];
}

interface ChartDisplayDropdownProps {
  value: ChartDisplayType;
  onValueChange: (value: ChartDisplayType) => void;
  className?: string;
}

// Functional options that actually work
const functionalValues: Set<ChartDisplayType> = new Set([
  'dollar', 'percent', 'winrate', 'tradecount', 'tickpip', 'avg_hold_time', 'longest_duration', 'long_winrate', 'short_winrate', 'tradecount_long', 'tradecount_short', 'avg_win', 'avg_loss', 'largest_win', 'largest_loss'
]);

// Display options grouped by category
const displayGroups: DisplayGroup[] = [
  {
    name: 'Time Analysis',
    options: [
      { value: 'avg_hold_time' as ChartDisplayType, label: 'Average hold time' },
      { value: 'longest_duration' as ChartDisplayType, label: 'Longest trade duration' },
    ],
  },
  {
    name: 'Risk & Drawdown',
    options: [
      { value: 'avg_realized_r' as ChartDisplayType, label: 'Average realized R-multiple' },
      { value: 'avg_planned_r' as ChartDisplayType, label: 'Average planned R-multiple' },
      { value: 'avg_daily_drawdown' as ChartDisplayType, label: 'Average daily net drawdown' },
    ],
  },
  {
    name: 'Profitability',
    options: [
      { value: 'dollar', label: 'Net P&L' },
      { value: 'profit_factor' as ChartDisplayType, label: 'Profit Factor' },
      { value: 'trade_expectancy' as ChartDisplayType, label: 'Trade Expectancy' },
      { value: 'avg_net_trade_pnl' as ChartDisplayType, label: 'Avg net trade P&L' },
      { value: 'avg_win' as ChartDisplayType, label: 'Average win' },
      { value: 'avg_loss' as ChartDisplayType, label: 'Average loss' },
      { value: 'largest_win' as ChartDisplayType, label: 'Largest winning trade' },
      { value: 'largest_loss' as ChartDisplayType, label: 'Largest losing trade' },
    ],
  },
  {
    name: 'Win Performance',
    options: [
      { value: 'winrate', label: 'Win %' },
      { value: 'long_winrate' as ChartDisplayType, label: 'Long win %' },
      { value: 'short_winrate' as ChartDisplayType, label: 'Short win %' },
    ],
  },
  {
    name: 'Trading Activity',
    options: [
      { value: 'tradecount', label: 'Trade count (total)' },
      { value: 'tradecount_long' as ChartDisplayType, label: 'Trade count (long)' },
      { value: 'tradecount_short' as ChartDisplayType, label: 'Trade count (short)' },
      { value: 'logged_days' as ChartDisplayType, label: 'Logged days' },
    ],
  },
  {
    name: 'Others',
    options: [
      { value: 'dollar', label: 'Return ($)' },
      { value: 'percent', label: 'Return (%)' },
      { value: 'winrate', label: 'Winrate (%)' },
      { value: 'tradecount', label: 'Trade Count' },
      { value: 'tickpip', label: 'Tick / Pip' },
    ],
  },
];

export const ChartDisplayDropdown = ({
  value,
  onValueChange,
  className,
}: ChartDisplayDropdownProps) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [isOpen, setIsOpen] = useState(false);

  const toggleGroup = (groupName: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupName)) {
        next.delete(groupName);
      } else {
        next.add(groupName);
      }
      return next;
    });
  };

  const handleSelectOption = (optionValue: ChartDisplayType) => {
    // Only trigger change for functional options
    if (functionalValues.has(optionValue)) {
      onValueChange(optionValue);
      setIsOpen(false);
    }
    // Non-functional options do nothing
  };

  const currentLabel = getDisplayLabel(value);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-8 w-[140px] justify-between bg-background border-border text-xs font-normal',
            className
          )}
        >
          <span className="truncate">{currentLabel}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[220px] max-h-[320px] overflow-y-auto bg-popover border-border p-1 z-50"
      >
        {displayGroups.map((group) => {
          const isExpanded = expandedGroups.has(group.name);
          return (
            <div key={group.name}>
              {/* Group Header - Clickable to expand/collapse */}
              <button
                type="button"
                onClick={(e) => toggleGroup(group.name, e)}
                className={cn(
                  'flex items-center justify-between w-full px-2 py-1.5 text-sm rounded-sm cursor-pointer transition-colors',
                  isExpanded
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <span>{group.name}</span>
                {isExpanded ? (
                  <ChevronUp className={cn('h-4 w-4', isExpanded ? 'text-primary' : 'text-muted-foreground')} />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>

              {/* Sub-options - Only visible when expanded */}
              {isExpanded && (
                <div className="pl-2">
                  {group.options.map((option) => {
                    const isSelected = value === option.value;
                    const isFunctional = functionalValues.has(option.value);
                    return (
                      <button
                        key={`${group.name}-${option.value}-${option.label}`}
                        type="button"
                        onClick={() => handleSelectOption(option.value)}
                        className={cn(
                          'flex items-center w-full px-2 py-1.5 text-sm rounded-sm',
                          isFunctional ? 'cursor-pointer' : 'cursor-default opacity-60',
                          isSelected && isFunctional
                            ? 'bg-primary/10 text-primary'
                            : isFunctional 
                              ? 'text-foreground hover:bg-accent hover:text-accent-foreground'
                              : 'text-muted-foreground'
                        )}
                      >
                        <span className="w-5 shrink-0">
                          {isSelected && isFunctional && <Check className="h-4 w-4" />}
                        </span>
                        <span>{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
