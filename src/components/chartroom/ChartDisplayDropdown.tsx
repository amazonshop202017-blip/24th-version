import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Check, Heart, Search } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChartDisplayType, getDisplayLabel } from '@/hooks/useChartDisplayMode';
import { useFavoriteMetrics } from '@/hooks/useFavoriteMetrics';

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
  disabledValues?: ChartDisplayType[];
}

// Functional options that actually work
const functionalValues: Set<ChartDisplayType> = new Set([
  'dollar', 'percent', 'winrate', 'tradecount', 'tickpip', 'avg_hold_time', 'longest_duration', 'long_winrate', 'short_winrate', 'tradecount_long', 'tradecount_short', 'avg_win', 'avg_loss', 'largest_win', 'largest_loss', 'avg_trades_per_day', 'median_trades_per_day', '90th_percentile_trades', 'logged_days', 'profit_factor', 'trade_expectancy', 'avg_net_trade_pnl', 'avg_realized_r', 'avg_planned_r', 'avg_daily_drawdown', 'largest_daily_loss', 'winning_days_count', 'losing_days_count', 'breakeven_days_count'
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
      { value: 'largest_daily_loss' as ChartDisplayType, label: 'Largest daily loss' },
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
      { value: 'avg_trades_per_day' as ChartDisplayType, label: 'Avg trades per logged day' },
      { value: 'median_trades_per_day' as ChartDisplayType, label: 'Median trades per day' },
      { value: '90th_percentile_trades' as ChartDisplayType, label: '90th percentile trades per day' },
    ],
  },
  {
    name: 'Others',
    options: [
      { value: 'percent', label: 'Return (%)' },
      { value: 'winning_days_count' as ChartDisplayType, label: 'Winning Days Count' },
      { value: 'losing_days_count' as ChartDisplayType, label: 'Losing Days Count' },
      { value: 'breakeven_days_count' as ChartDisplayType, label: 'Breakeven Days Count' },
    ],
  },
];

export const ChartDisplayDropdown = ({
  value,
  onValueChange,
  className,
  disabledValues = [],
}: ChartDisplayDropdownProps) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { favorites, toggleFavorite, isFavorite } = useFavoriteMetrics();

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
    if (functionalValues.has(optionValue)) {
      onValueChange(optionValue);
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  const handleToggleFavorite = (metric: ChartDisplayType, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(metric);
  };

  const currentLabel = getDisplayLabel(value);

  // Get favorite items that are functional
  const favoriteItems = favorites.filter((m) => functionalValues.has(m) && !disabledValues.includes(m));

  // Search results grouped by category
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    const results: { group: string; options: DisplayOption[] }[] = [];
    for (const group of displayGroups) {
      const matched = group.options.filter(
        (o) => functionalValues.has(o.value) && !disabledValues.includes(o.value) && o.label.toLowerCase().includes(q)
      );
      if (matched.length > 0) results.push({ group: group.name, options: matched });
    }
    return results;
  }, [searchQuery, disabledValues]);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-8 w-[180px] justify-between bg-background border-border text-xs font-normal',
            className
          )}
        >
          <span className="truncate">{currentLabel}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[260px] max-h-[360px] overflow-y-auto bg-popover border-border p-1 z-50"
      >
        {/* Favorites Section - collapsible like other groups */}
        {favoriteItems.length > 0 && (
          <div>
            <button
              type="button"
              onClick={(e) => toggleGroup('__favorites__', e)}
              className={cn(
                'flex items-center justify-between w-full px-2 py-1.5 text-sm rounded-sm cursor-pointer transition-colors',
                expandedGroups.has('__favorites__')
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <span className="flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                Favourites
              </span>
              {expandedGroups.has('__favorites__') ? (
                <ChevronUp className="h-4 w-4 text-primary" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            {expandedGroups.has('__favorites__') && (
              <div className="pl-2">
                {favoriteItems.map((metric) => {
                  const isSelected = value === metric;
                  return (
                    <button
                      key={`fav-${metric}`}
                      type="button"
                      onClick={() => handleSelectOption(metric)}
                      className={cn(
                        'flex items-center w-full px-2 py-1.5 text-sm rounded-sm cursor-pointer',
                        isSelected
                          ? 'bg-primary/10 text-primary'
                          : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <span className="w-5 shrink-0">
                        {isSelected && <Check className="h-4 w-4" />}
                      </span>
                      <span className="flex-1 text-left">{getDisplayLabel(metric)}</span>
                      <Heart
                        className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400 shrink-0 ml-1 hover:scale-125 transition-transform"
                        onClick={(e) => handleToggleFavorite(metric, e)}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Regular Groups */}
        {displayGroups.map((group) => {
          const isExpanded = expandedGroups.has(group.name);
          return (
            <div key={group.name}>
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

              {isExpanded && (
                <div className="pl-2">
                  {group.options.map((option) => {
                    const isSelected = value === option.value;
                    const isDisabledByParent = disabledValues.includes(option.value);
                    const isFunctional = functionalValues.has(option.value) && !isDisabledByParent;
                    const isFav = isFavorite(option.value);
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
                        <span className="flex-1 text-left">{option.label}</span>
                        {isFunctional && (
                          <Heart
                            className={cn(
                              'h-3.5 w-3.5 shrink-0 ml-1 transition-all hover:scale-125',
                              isFav
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-muted-foreground/40 hover:text-yellow-400'
                            )}
                            onClick={(e) => handleToggleFavorite(option.value, e)}
                          />
                        )}
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
