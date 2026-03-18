import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, ChevronDown, Wallet, Settings, Check, X, Filter, SlidersHorizontal, Globe, TrendingUp, Star, BarChart2, Clock, Percent, Hash, ListFilter, Calendar as CalendarIcon2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useGlobalFilters, DatePreset, OutcomeFilter, DayFilter, LastTradesFilter, DirectionFilter, ReturnPercentRange, RMultipleRange, YearFilter } from '@/contexts/GlobalFiltersContext';
import { useAccountsContext } from '@/contexts/AccountsContext';
import { useTradesContext } from '@/contexts/TradesContext';
import { useStrategiesContext } from '@/contexts/StrategiesContext';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { AdvancedFiltersPanel } from './AdvancedFiltersPanel';
import { DisplayModeSelector } from './DisplayModeSelector';

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This week' },
  { value: 'this_month', label: 'This month' },
  { value: 'last_30_days', label: 'Last 30 days' },
  { value: 'last_month', label: 'Last month' },
  { value: 'this_quarter', label: 'This quarter' },
  { value: 'ytd', label: 'YTD (year to date)' },
];

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: `${i.toString().padStart(2, '0')}:00–${i.toString().padStart(2, '0')}:59`,
}));

const DAY_OPTIONS: { value: DayFilter; label: string }[] = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

const OUTCOME_OPTIONS: { value: OutcomeFilter; label: string }[] = [
  { value: 'win', label: 'Win' },
  { value: 'loss', label: 'Loss' },
  { value: 'breakeven', label: 'Breakeven' },
];

const LAST_TRADES_OPTIONS: { value: LastTradesFilter; label: string }[] = [
  { value: null, label: 'All' },
  { value: 10, label: 'Last 10' },
  { value: 25, label: 'Last 25' },
  { value: 50, label: 'Last 50' },
  { value: 100, label: 'Last 100' },
];

const DIRECTION_OPTIONS: { value: DirectionFilter; label: string }[] = [
  { value: 'long', label: 'Long' },
  { value: 'short', label: 'Short' },
];

const RETURN_PERCENT_OPTIONS: { value: ReturnPercentRange; label: string }[] = [
  { value: '<0', label: '< 0%' },
  { value: '0-1', label: '0% – 1%' },
  { value: '1-2', label: '1% – 2%' },
  { value: '3-5', label: '3% – 5%' },
  { value: '5-10', label: '5% – 10%' },
  { value: '>10', label: '> 10%' },
];

const R_MULTIPLE_OPTIONS: { value: RMultipleRange; label: string }[] = [
  { value: '<-2', label: '< -2R' },
  { value: '-2-0', label: '-2R to 0R' },
  { value: '0-1', label: '0R to 1R' },
  { value: '1-2', label: '1R to 2R' },
  { value: '2-4', label: '2R to 4R' },
  { value: '>4', label: '> 4R' },
];

// Shared filter trigger button component
const FilterTriggerButton = ({ children, hasSelection, className, ...props }: { children: React.ReactNode; hasSelection?: boolean; className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={cn(
      "w-full h-8 flex items-center justify-between px-2.5 text-sm font-normal rounded-md bg-muted/40 hover:bg-muted/60 transition-colors text-foreground",
      hasSelection && "text-foreground",
      !hasSelection && "text-muted-foreground",
      className
    )}
    {...props}
  >
    {children}
  </button>
);

export const GlobalHeader = () => {
  const navigate = useNavigate();
  const { 
    dateRange, 
    setDateRange,
    datePreset,
    setDatePreset,
    applyDatePreset,
    selectedAccounts,
    setSelectedAccounts,
    isAllAccountsSelected,
    selectedSymbols,
    setSelectedSymbols,
    selectedOutcomes,
    setSelectedOutcomes,
    selectedHours,
    setSelectedHours,
    selectedSetups,
    setSelectedSetups,
    selectedDays,
    setSelectedDays,
    lastTradesFilter,
    setLastTradesFilter,
    selectedDirections,
    setSelectedDirections,
    selectedReturnRanges,
    setSelectedReturnRanges,
    selectedRMultipleRanges,
    setSelectedRMultipleRanges,
    selectedYear,
    setSelectedYear,
    selectedChecklistItems,
    setSelectedChecklistItems,
    hasActiveChecklistFilter,
    hasActiveTagFilters,
  } = useGlobalFilters();
  
  const { accounts, getActiveAccountsWithStats } = useAccountsContext();
  const { trades } = useTradesContext();
  const { strategies } = useStrategiesContext();
  
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [basicFiltersOpen, setBasicFiltersOpen] = useState(false);
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [yearPickerOpen, setYearPickerOpen] = useState(false);
  const [checklistOpen, setChecklistOpen] = useState(false);

  const activeAccounts = useMemo(() => getActiveAccountsWithStats(), [getActiveAccountsWithStats]);

  const availableSymbols = useMemo(() => {
    const symbols = new Set(trades.map(t => t.symbol));
    return Array.from(symbols).filter(Boolean).sort();
  }, [trades]);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    trades.forEach(trade => {
      if (trade.entries && trade.entries.length > 0) {
        const firstEntry = trade.entries.sort((a, b) => 
          new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
        )[0];
        if (firstEntry?.datetime) {
          years.add(new Date(firstEntry.datetime).getFullYear());
        }
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [trades]);

  const availableChecklistItems = useMemo(() => {
    if (selectedSetups.length === 0) return [];
    const items = new Set<string>();
    strategies
      .filter(s => selectedSetups.includes(s.id))
      .forEach(s => {
        s.checklistItems?.forEach(item => items.add(item));
      });
    return Array.from(items);
  }, [strategies, selectedSetups]);

  const handlePresetClick = (preset: DatePreset) => {
    applyDatePreset(preset);
  };

  const handleCustomDateChange = (range: { from?: Date; to?: Date } | undefined) => {
    if (range) {
      setDateRange({ from: range.from, to: range.to });
      setDatePreset('custom');
    }
  };

  const handleAccountToggle = (accountName: string) => {
    if (selectedAccounts.includes(accountName)) {
      setSelectedAccounts(selectedAccounts.filter(a => a !== accountName));
    } else {
      setSelectedAccounts([...selectedAccounts, accountName]);
    }
  };

  const handleAllAccountsToggle = () => {
    setSelectedAccounts([]);
  };

  const handleSymbolToggle = (symbol: string) => {
    if (selectedSymbols.includes(symbol)) {
      setSelectedSymbols(selectedSymbols.filter(i => i !== symbol));
    } else {
      setSelectedSymbols([...selectedSymbols, symbol]);
    }
  };

  const handleOutcomeToggle = (outcome: OutcomeFilter) => {
    if (selectedOutcomes.includes(outcome)) {
      setSelectedOutcomes(selectedOutcomes.filter(o => o !== outcome));
    } else {
      setSelectedOutcomes([...selectedOutcomes, outcome]);
    }
  };

  const handleHourToggle = (hour: number) => {
    if (selectedHours.includes(hour)) {
      setSelectedHours(selectedHours.filter(h => h !== hour));
    } else {
      setSelectedHours([...selectedHours, hour]);
    }
  };

  const handleSetupToggle = (setupId: string) => {
    if (selectedSetups.includes(setupId)) {
      setSelectedSetups(selectedSetups.filter(s => s !== setupId));
    } else {
      setSelectedSetups([...selectedSetups, setupId]);
    }
  };

  const handleDayToggle = (day: DayFilter) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleDirectionToggle = (direction: DirectionFilter) => {
    if (selectedDirections.includes(direction)) {
      setSelectedDirections(selectedDirections.filter(d => d !== direction));
    } else {
      setSelectedDirections([...selectedDirections, direction]);
    }
  };

  const handleReturnRangeToggle = (range: ReturnPercentRange) => {
    if (selectedReturnRanges.includes(range)) {
      setSelectedReturnRanges(selectedReturnRanges.filter(r => r !== range));
    } else {
      setSelectedReturnRanges([...selectedReturnRanges, range]);
    }
  };

  const handleRMultipleRangeToggle = (range: RMultipleRange) => {
    if (selectedRMultipleRanges.includes(range)) {
      setSelectedRMultipleRanges(selectedRMultipleRanges.filter(r => r !== range));
    } else {
      setSelectedRMultipleRanges([...selectedRMultipleRanges, range]);
    }
  };

  const handleYearSelect = (year: number | null) => {
    setSelectedYear(year);
    setYearPickerOpen(false);
  };

  const handleChecklistItemToggle = (item: string) => {
    if (selectedChecklistItems.includes(item)) {
      setSelectedChecklistItems(selectedChecklistItems.filter(i => i !== item));
    } else {
      setSelectedChecklistItems([...selectedChecklistItems, item]);
    }
  };

  const getDateRangeLabel = () => {
    if (datePreset === 'all' || (!dateRange.from && !dateRange.to)) {
      return 'All time';
    }
    if (datePreset !== 'custom') {
      return DATE_PRESETS.find(p => p.value === datePreset)?.label || 'Date range';
    }
    if (dateRange.from && dateRange.to) {
      return `${format(dateRange.from, 'MMM dd, yyyy')} - ${format(dateRange.to, 'MMM dd, yyyy')}`;
    }
    if (dateRange.from) {
      return `From ${format(dateRange.from, 'MMM dd, yyyy')}`;
    }
    return 'Date range';
  };

  const getAccountsLabel = () => {
    if (isAllAccountsSelected) {
      return 'All accounts';
    }
    if (selectedAccounts.length === 1) {
      return selectedAccounts[0];
    }
    return `${selectedAccounts.length} accounts`;
  };

  const activeBasicFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedSymbols.length > 0) count++;
    if (selectedOutcomes.length > 0) count++;
    if (selectedHours.length > 0) count++;
    if (selectedSetups.length > 0) count++;
    if (selectedChecklistItems.length > 0) count++;
    if (selectedDays.length > 0) count++;
    if (lastTradesFilter !== null) count++;
    if (selectedDirections.length > 0) count++;
    if (selectedReturnRanges.length > 0) count++;
    if (selectedRMultipleRanges.length > 0) count++;
    if (selectedYear !== null) count++;
    return count;
  }, [selectedSymbols, selectedOutcomes, selectedHours, selectedSetups, selectedChecklistItems, selectedDays, lastTradesFilter, selectedDirections, selectedReturnRanges, selectedRMultipleRanges, selectedYear]);

  return (
    <div className="flex items-center gap-2 px-6 py-3 border-b border-border bg-background">
      {/* Basic Filters */}
      <DropdownMenu open={basicFiltersOpen} onOpenChange={setBasicFiltersOpen}>
        <DropdownMenuTrigger asChild>
          <button className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-muted/60 hover:bg-muted text-sm font-medium text-foreground transition-colors">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Basic Filters</span>
            {activeBasicFiltersCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-primary/15 text-primary font-semibold">
                {activeBasicFiltersCount}
              </span>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[820px] p-5 bg-popover border-border rounded-xl shadow-xl z-50">
          <div className="space-y-5">
            {/* Section: Trade Context */}
            <div>
              <div className="text-[10px] tracking-widest text-muted-foreground font-semibold uppercase mb-3">Trade Context</div>
              <div className="grid grid-cols-4 gap-3">
                {/* Symbol */}
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-medium">Symbol</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FilterTriggerButton hasSelection={selectedSymbols.length > 0}>
                        {selectedSymbols.length === 0 ? 'All' : `${selectedSymbols.length} selected`}
                        <ChevronDown className="w-3 h-3 opacity-50" />
                      </FilterTriggerButton>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-2 bg-popover border-border z-[70]" align="start">
                      <div className="space-y-0.5 max-h-48 overflow-auto">
                        {availableSymbols.length === 0 ? (
                          <div className="text-xs text-muted-foreground py-2 text-center">No symbols found</div>
                        ) : (
                          availableSymbols.map((sym) => (
                            <div 
                              key={sym} 
                              className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/60 cursor-pointer transition-colors"
                              onClick={() => handleSymbolToggle(sym)}
                            >
                              <Checkbox checked={selectedSymbols.includes(sym)} />
                              <span className="text-sm">{sym}</span>
                            </div>
                          ))
                        )}
                      </div>
                      {selectedSymbols.length > 0 && (
                        <>
                          <DropdownMenuSeparator className="my-1.5" />
                          <Button variant="ghost" size="sm" className="w-full text-xs h-7" onClick={() => setSelectedSymbols([])}>
                            Clear selection
                          </Button>
                        </>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Setup */}
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-medium">Setup</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FilterTriggerButton hasSelection={selectedSetups.length > 0}>
                        {selectedSetups.length === 0 ? 'All' : `${selectedSetups.length} selected`}
                        <ChevronDown className="w-3 h-3 opacity-50" />
                      </FilterTriggerButton>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-2 bg-popover border-border z-[70]" align="start">
                      <div className="space-y-0.5 max-h-48 overflow-auto">
                        {strategies.length === 0 ? (
                          <div className="text-xs text-muted-foreground py-2 text-center">No setups found</div>
                        ) : (
                          strategies.map((strategy) => (
                            <div 
                              key={strategy.id} 
                              className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/60 cursor-pointer transition-colors"
                              onClick={() => handleSetupToggle(strategy.id)}
                            >
                              <Checkbox checked={selectedSetups.includes(strategy.id)} />
                              <span className="text-sm truncate">{strategy.name}</span>
                            </div>
                          ))
                        )}
                      </div>
                      {selectedSetups.length > 0 && (
                        <>
                          <DropdownMenuSeparator className="my-1.5" />
                          <Button variant="ghost" size="sm" className="w-full text-xs h-7" onClick={() => setSelectedSetups([])}>
                            Clear selection
                          </Button>
                        </>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Checklist */}
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-medium">Checklist</label>
                  <Popover open={checklistOpen} onOpenChange={setChecklistOpen}>
                    <PopoverTrigger asChild>
                      <FilterTriggerButton 
                        hasSelection={selectedChecklistItems.length > 0}
                        disabled={selectedSetups.length === 0}
                        className={selectedSetups.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}
                      >
                        {selectedSetups.length === 0 
                          ? 'Select setup first' 
                          : selectedChecklistItems.length === 0 
                            ? 'All' 
                            : `${selectedChecklistItems.length} selected`}
                        <ChevronDown className="w-3 h-3 opacity-50" />
                      </FilterTriggerButton>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-2 bg-popover border-border z-[70]" align="start">
                      {selectedSetups.length === 0 ? (
                        <div className="text-xs text-muted-foreground py-3 text-center">
                          Please select a setup to choose checklist items.
                        </div>
                      ) : availableChecklistItems.length === 0 ? (
                        <div className="text-xs text-muted-foreground py-3 text-center">
                          No checklist items for selected setups.
                        </div>
                      ) : (
                        <>
                          <div className="space-y-0.5 max-h-48 overflow-auto">
                            {availableChecklistItems.map((item) => (
                              <div 
                                key={item} 
                                className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/60 cursor-pointer transition-colors"
                                onClick={() => handleChecklistItemToggle(item)}
                              >
                                <Checkbox checked={selectedChecklistItems.includes(item)} />
                                <span className="text-sm truncate">{item}</span>
                              </div>
                            ))}
                          </div>
                          {selectedChecklistItems.length > 0 && (
                            <>
                              <DropdownMenuSeparator className="my-1.5" />
                              <Button variant="ghost" size="sm" className="w-full text-xs h-7" onClick={() => setSelectedChecklistItems([])}>
                                Clear selection
                              </Button>
                            </>
                          )}
                        </>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Outcome */}
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-medium">Outcome</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FilterTriggerButton hasSelection={selectedOutcomes.length > 0}>
                        {selectedOutcomes.length === 0 ? 'All' : `${selectedOutcomes.length} selected`}
                        <ChevronDown className="w-3 h-3 opacity-50" />
                      </FilterTriggerButton>
                    </PopoverTrigger>
                    <PopoverContent className="w-40 p-2 bg-popover border-border z-[70]" align="start">
                      <div className="space-y-0.5">
                        {OUTCOME_OPTIONS.map((option) => (
                          <div 
                            key={option.value} 
                            className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/60 cursor-pointer transition-colors"
                            onClick={() => handleOutcomeToggle(option.value)}
                          >
                            <Checkbox checked={selectedOutcomes.includes(option.value)} />
                            <span className="text-sm">{option.label}</span>
                          </div>
                        ))}
                      </div>
                      {selectedOutcomes.length > 0 && (
                        <>
                          <DropdownMenuSeparator className="my-1.5" />
                          <Button variant="ghost" size="sm" className="w-full text-xs h-7" onClick={() => setSelectedOutcomes([])}>
                            Clear selection
                          </Button>
                        </>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Row 2 of Trade Context */}
              <div className="grid grid-cols-4 gap-3 mt-3">
                {/* Direction */}
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-medium">Direction</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FilterTriggerButton hasSelection={selectedDirections.length > 0}>
                        {selectedDirections.length === 0 ? 'All' : `${selectedDirections.length} selected`}
                        <ChevronDown className="w-3 h-3 opacity-50" />
                      </FilterTriggerButton>
                    </PopoverTrigger>
                    <PopoverContent className="w-36 p-2 bg-popover border-border z-[70]" align="start">
                      <div className="space-y-0.5">
                        {DIRECTION_OPTIONS.map((option) => (
                          <div 
                            key={option.value} 
                            className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/60 cursor-pointer transition-colors"
                            onClick={() => handleDirectionToggle(option.value)}
                          >
                            <Checkbox checked={selectedDirections.includes(option.value)} />
                            <span className="text-sm">{option.label}</span>
                          </div>
                        ))}
                      </div>
                      {selectedDirections.length > 0 && (
                        <>
                          <DropdownMenuSeparator className="my-1.5" />
                          <Button variant="ghost" size="sm" className="w-full text-xs h-7" onClick={() => setSelectedDirections([])}>
                            Clear selection
                          </Button>
                        </>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Starred */}
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-medium">Starred</label>
                  <Select>
                    <SelectTrigger className="h-8 bg-muted/40 border-0 rounded-md text-sm">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border z-[60]">
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="starred">Starred Only</SelectItem>
                      <SelectItem value="unstarred">Unstarred Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div />
                <div />
              </div>
            </div>

            {/* Separator */}
            <div className="h-px bg-border/50" />

            {/* Section: Time */}
            <div>
              <div className="text-[10px] tracking-widest text-muted-foreground font-semibold uppercase mb-3">Time</div>
              <div className="grid grid-cols-4 gap-3">
                {/* Year */}
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-medium">Year</label>
                  <Popover open={yearPickerOpen} onOpenChange={setYearPickerOpen}>
                    <PopoverTrigger asChild>
                      <FilterTriggerButton hasSelection={selectedYear !== null}>
                        {selectedYear === null ? 'All' : selectedYear.toString()}
                        <ChevronDown className="w-3 h-3 opacity-50" />
                      </FilterTriggerButton>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-3 bg-popover border-border z-[70]" align="start">
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground text-center mb-2">Select Year</div>
                        <div 
                          className={cn(
                            "px-3 py-2 rounded-md text-center text-sm cursor-pointer transition-colors",
                            selectedYear === null ? "bg-primary text-primary-foreground" : "hover:bg-muted/60"
                          )}
                          onClick={() => handleYearSelect(null)}
                        >
                          All Years
                        </div>
                        <DropdownMenuSeparator />
                        <div className="grid grid-cols-2 gap-1.5">
                          {availableYears.length === 0 ? (
                            [0, 1, 2, 3, 4].map(offset => {
                              const year = new Date().getFullYear() - offset;
                              return (
                                <div
                                  key={year}
                                  className={cn(
                                    "px-3 py-2 rounded-md text-center text-sm cursor-pointer transition-colors",
                                    selectedYear === year ? "bg-primary text-primary-foreground" : "hover:bg-muted/60"
                                  )}
                                  onClick={() => handleYearSelect(year)}
                                >
                                  {year}
                                </div>
                              );
                            })
                          ) : (
                            availableYears.map(year => (
                              <div
                                key={year}
                                className={cn(
                                  "px-3 py-2 rounded-md text-center text-sm cursor-pointer transition-colors",
                                  selectedYear === year ? "bg-primary text-primary-foreground" : "hover:bg-muted/60"
                                )}
                                onClick={() => handleYearSelect(year)}
                              >
                                {year}
                              </div>
                            ))
                          )}
                        </div>
                        {selectedYear !== null && (
                          <>
                            <DropdownMenuSeparator />
                            <Button variant="ghost" size="sm" className="w-full text-xs h-7" onClick={() => handleYearSelect(null)}>
                              Clear selection
                            </Button>
                          </>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Month */}
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-medium">Month</label>
                  <Select>
                    <SelectTrigger className="h-8 bg-muted/40 border-0 rounded-md text-sm">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border z-[60]">
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="1">January</SelectItem>
                      <SelectItem value="2">February</SelectItem>
                      <SelectItem value="3">March</SelectItem>
                      <SelectItem value="4">April</SelectItem>
                      <SelectItem value="5">May</SelectItem>
                      <SelectItem value="6">June</SelectItem>
                      <SelectItem value="7">July</SelectItem>
                      <SelectItem value="8">August</SelectItem>
                      <SelectItem value="9">September</SelectItem>
                      <SelectItem value="10">October</SelectItem>
                      <SelectItem value="11">November</SelectItem>
                      <SelectItem value="12">December</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Day */}
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-medium">Day</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FilterTriggerButton hasSelection={selectedDays.length > 0}>
                        {selectedDays.length === 0 ? 'All' : `${selectedDays.length} selected`}
                        <ChevronDown className="w-3 h-3 opacity-50" />
                      </FilterTriggerButton>
                    </PopoverTrigger>
                    <PopoverContent className="w-40 p-2 bg-popover border-border z-[70]" align="start">
                      <div className="space-y-0.5">
                        {DAY_OPTIONS.map((option) => (
                          <div 
                            key={option.value} 
                            className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/60 cursor-pointer transition-colors"
                            onClick={() => handleDayToggle(option.value)}
                          >
                            <Checkbox checked={selectedDays.includes(option.value)} />
                            <span className="text-sm">{option.label}</span>
                          </div>
                        ))}
                      </div>
                      {selectedDays.length > 0 && (
                        <>
                          <DropdownMenuSeparator className="my-1.5" />
                          <Button variant="ghost" size="sm" className="w-full text-xs h-7" onClick={() => setSelectedDays([])}>
                            Clear selection
                          </Button>
                        </>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Hour */}
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-medium">Hour</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FilterTriggerButton hasSelection={selectedHours.length > 0}>
                        {selectedHours.length === 0 ? 'All' : `${selectedHours.length} selected`}
                        <ChevronDown className="w-3 h-3 opacity-50" />
                      </FilterTriggerButton>
                    </PopoverTrigger>
                    <PopoverContent className="w-44 p-2 bg-popover border-border z-[70]" align="start">
                      <div className="space-y-0.5 max-h-48 overflow-auto">
                        {HOUR_OPTIONS.map((option) => (
                          <div 
                            key={option.value} 
                            className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/60 cursor-pointer transition-colors"
                            onClick={() => handleHourToggle(option.value)}
                          >
                            <Checkbox checked={selectedHours.includes(option.value)} />
                            <span className="text-sm">{option.label}</span>
                          </div>
                        ))}
                      </div>
                      {selectedHours.length > 0 && (
                        <>
                          <DropdownMenuSeparator className="my-1.5" />
                          <Button variant="ghost" size="sm" className="w-full text-xs h-7" onClick={() => setSelectedHours([])}>
                            Clear selection
                          </Button>
                        </>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Last Trades row */}
              <div className="grid grid-cols-4 gap-3 mt-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-medium">Last Trades</label>
                  <Select 
                    value={lastTradesFilter === null ? 'all' : lastTradesFilter.toString()} 
                    onValueChange={(value) => setLastTradesFilter(value === 'all' ? null : parseInt(value) as LastTradesFilter)}
                  >
                    <SelectTrigger className="h-8 bg-muted/40 border-0 rounded-md text-sm">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border z-[60]">
                      {LAST_TRADES_OPTIONS.map((option) => (
                        <SelectItem key={option.label} value={option.value === null ? 'all' : option.value.toString()}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div />
                <div />
                <div />
              </div>
            </div>

            {/* Separator */}
            <div className="h-px bg-border/50" />

            {/* Section: Performance */}
            <div>
              <div className="text-[10px] tracking-widest text-muted-foreground font-semibold uppercase mb-3">Performance</div>
              <div className="grid grid-cols-4 gap-3">
                {/* Return % */}
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-medium">Return %</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FilterTriggerButton hasSelection={selectedReturnRanges.length > 0}>
                        {selectedReturnRanges.length === 0 ? 'All' : `${selectedReturnRanges.length} selected`}
                        <ChevronDown className="w-3 h-3 opacity-50" />
                      </FilterTriggerButton>
                    </PopoverTrigger>
                    <PopoverContent className="w-36 p-2 bg-popover border-border z-[70]" align="start">
                      <div className="space-y-0.5">
                        {RETURN_PERCENT_OPTIONS.map((option) => (
                          <div 
                            key={option.value} 
                            className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/60 cursor-pointer transition-colors"
                            onClick={() => handleReturnRangeToggle(option.value)}
                          >
                            <Checkbox checked={selectedReturnRanges.includes(option.value)} />
                            <span className="text-sm">{option.label}</span>
                          </div>
                        ))}
                      </div>
                      {selectedReturnRanges.length > 0 && (
                        <>
                          <DropdownMenuSeparator className="my-1.5" />
                          <Button variant="ghost" size="sm" className="w-full text-xs h-7" onClick={() => setSelectedReturnRanges([])}>
                            Clear selection
                          </Button>
                        </>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>

                {/* R-Multiple */}
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-medium">R-Multiple Gain</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FilterTriggerButton hasSelection={selectedRMultipleRanges.length > 0}>
                        {selectedRMultipleRanges.length === 0 ? 'All' : `${selectedRMultipleRanges.length} selected`}
                        <ChevronDown className="w-3 h-3 opacity-50" />
                      </FilterTriggerButton>
                    </PopoverTrigger>
                    <PopoverContent className="w-36 p-2 bg-popover border-border z-[70]" align="start">
                      <div className="space-y-0.5">
                        {R_MULTIPLE_OPTIONS.map((option) => (
                          <div 
                            key={option.value} 
                            className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/60 cursor-pointer transition-colors"
                            onClick={() => handleRMultipleRangeToggle(option.value)}
                          >
                            <Checkbox checked={selectedRMultipleRanges.includes(option.value)} />
                            <span className="text-sm">{option.label}</span>
                          </div>
                        ))}
                      </div>
                      {selectedRMultipleRanges.length > 0 && (
                        <>
                          <DropdownMenuSeparator className="my-1.5" />
                          <Button variant="ghost" size="sm" className="w-full text-xs h-7" onClick={() => setSelectedRMultipleRanges([])}>
                            Clear selection
                          </Button>
                        </>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>

                {/* RRR */}
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground font-medium">RRR</label>
                  <Select>
                    <SelectTrigger className="h-8 bg-muted/40 border-0 rounded-md text-sm">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border z-[60]">
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="1">1:1</SelectItem>
                      <SelectItem value="2">1:2</SelectItem>
                      <SelectItem value="3">1:3+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div />
              </div>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Advanced Filters */}
      <Popover open={advancedFiltersOpen} onOpenChange={setAdvancedFiltersOpen}>
        <PopoverTrigger asChild>
          <button className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-muted/60 hover:bg-muted text-sm font-medium text-foreground transition-colors">
            <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Advanced</span>
            {hasActiveTagFilters && (
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-primary/15 text-primary font-semibold">
                Tags
              </span>
            )}
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0 bg-popover border-border rounded-xl shadow-xl z-50">
          <AdvancedFiltersPanel />
        </PopoverContent>
      </Popover>

      {/* Display Mode */}
      <DisplayModeSelector />

      <div className="flex-1" />

      {/* Date Range */}
      <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
        <PopoverTrigger asChild>
          <button className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-muted/60 hover:bg-muted text-sm font-medium text-foreground transition-colors min-w-[180px]">
            <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="truncate">{getDateRangeLabel()}</span>
            {datePreset !== 'all' && (
              <button 
                className="ml-auto p-0.5 rounded-full hover:bg-foreground/10 transition-colors"
                onClick={(e) => { e.stopPropagation(); applyDatePreset('all'); }}
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            )}
            {datePreset === 'all' && <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-auto" />}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[800px] p-0 bg-popover border-border rounded-xl shadow-xl z-50" align="end">
          <div className="flex">
            <div className="p-3 border-r border-border">
              <Calendar
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={handleCustomDateChange}
                numberOfMonths={2}
                className="pointer-events-auto"
              />
            </div>
            <div className="p-2 min-w-[150px]">
              <button
                onClick={() => { applyDatePreset('all'); setDatePickerOpen(false); }}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted/60 transition-colors",
                  datePreset === 'all' && "bg-muted font-medium"
                )}
              >
                All time
              </button>
              {DATE_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => { handlePresetClick(preset.value); setDatePickerOpen(false); }}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted/60 transition-colors",
                    datePreset === preset.value && "bg-muted font-medium"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Account Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-muted/60 hover:bg-muted text-sm font-medium text-foreground transition-colors min-w-[140px]">
            <Wallet className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="truncate">{getAccountsLabel()}</span>
            {!isAllAccountsSelected && (
              <button 
                className="ml-auto p-0.5 rounded-full hover:bg-foreground/10 transition-colors"
                onClick={(e) => { e.stopPropagation(); setSelectedAccounts([]); }}
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            )}
            {isAllAccountsSelected && <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-auto" />}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-popover border-border z-50 min-w-[200px]">
          <DropdownMenuCheckboxItem
            checked={isAllAccountsSelected}
            onCheckedChange={handleAllAccountsToggle}
            className="cursor-pointer"
          >
            All accounts
          </DropdownMenuCheckboxItem>
          
          {activeAccounts.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                My accounts
              </DropdownMenuLabel>
              {activeAccounts.map((account) => (
                <DropdownMenuCheckboxItem
                  key={account.id}
                  checked={selectedAccounts.includes(account.name)}
                  onCheckedChange={() => handleAccountToggle(account.name)}
                  className="cursor-pointer"
                >
                  {account.name}
                </DropdownMenuCheckboxItem>
              ))}
            </>
          )}
          
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => navigate('/settings?tab=accounts')}
            className="cursor-pointer"
          >
            <Settings className="w-4 h-4 mr-2" />
            Manage accounts
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
