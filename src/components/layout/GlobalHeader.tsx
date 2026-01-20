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
import { useGlobalFilters, DatePreset, OutcomeFilter, DayFilter, LastTradesFilter } from '@/contexts/GlobalFiltersContext';
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
    // Basic filters
    selectedInstruments,
    setSelectedInstruments,
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
  } = useGlobalFilters();
  
  const { accounts } = useAccountsContext();
  const { trades } = useTradesContext();
  const { strategies } = useStrategiesContext();
  
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [basicFiltersOpen, setBasicFiltersOpen] = useState(false);
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);

  // Get unique instruments from trades
  const availableInstruments = useMemo(() => {
    const instruments = new Set(trades.map(t => t.symbol));
    return Array.from(instruments).filter(Boolean).sort();
  }, [trades]);

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

  // Instrument filter handlers
  const handleInstrumentToggle = (instrument: string) => {
    if (selectedInstruments.includes(instrument)) {
      setSelectedInstruments(selectedInstruments.filter(i => i !== instrument));
    } else {
      setSelectedInstruments([...selectedInstruments, instrument]);
    }
  };

  // Outcome filter handlers
  const handleOutcomeToggle = (outcome: OutcomeFilter) => {
    if (selectedOutcomes.includes(outcome)) {
      setSelectedOutcomes(selectedOutcomes.filter(o => o !== outcome));
    } else {
      setSelectedOutcomes([...selectedOutcomes, outcome]);
    }
  };

  // Hour filter handlers
  const handleHourToggle = (hour: number) => {
    if (selectedHours.includes(hour)) {
      setSelectedHours(selectedHours.filter(h => h !== hour));
    } else {
      setSelectedHours([...selectedHours, hour]);
    }
  };

  // Setup filter handlers
  const handleSetupToggle = (setupId: string) => {
    if (selectedSetups.includes(setupId)) {
      setSelectedSetups(selectedSetups.filter(s => s !== setupId));
    } else {
      setSelectedSetups([...selectedSetups, setupId]);
    }
  };

  // Day filter handlers
  const handleDayToggle = (day: DayFilter) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
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

  // Count active basic filters
  const activeBasicFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedInstruments.length > 0) count++;
    if (selectedOutcomes.length > 0) count++;
    if (selectedHours.length > 0) count++;
    if (selectedSetups.length > 0) count++;
    if (selectedDays.length > 0) count++;
    if (lastTradesFilter !== null) count++;
    return count;
  }, [selectedInstruments, selectedOutcomes, selectedHours, selectedSetups, selectedDays, lastTradesFilter]);

  return (
    <div className="flex items-center gap-3 px-8 py-4 border-b border-border bg-card/50 backdrop-blur-sm">
      {/* Basic Filters Dropdown */}
      <DropdownMenu open={basicFiltersOpen} onOpenChange={setBasicFiltersOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 bg-background border-border">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span>Basic Filters</span>
            {activeBasicFiltersCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
                {activeBasicFiltersCount}
              </span>
            )}
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[900px] p-4 bg-popover border-border z-50">
          <div className="grid grid-cols-6 gap-3">
            {/* Row 1: Instrument, Outcome, Month, Hour, Trade Type, Checklist Type */}
            {/* Instrument - Multi-select from trades */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Globe className="w-3 h-3" />
                Instrument
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full h-9 justify-between text-sm font-normal bg-background border-border">
                    {selectedInstruments.length === 0 ? 'All' : `${selectedInstruments.length} selected`}
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2 bg-popover border-border z-[70]" align="start">
                  <div className="space-y-1 max-h-48 overflow-auto">
                    {availableInstruments.length === 0 ? (
                      <div className="text-xs text-muted-foreground py-2 text-center">No instruments found</div>
                    ) : (
                      availableInstruments.map((instrument) => (
                        <div 
                          key={instrument} 
                          className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer"
                          onClick={() => handleInstrumentToggle(instrument)}
                        >
                          <Checkbox checked={selectedInstruments.includes(instrument)} />
                          <span className="text-sm">{instrument}</span>
                        </div>
                      ))
                    )}
                  </div>
                  {selectedInstruments.length > 0 && (
                    <>
                      <DropdownMenuSeparator className="my-2" />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full text-xs"
                        onClick={() => setSelectedInstruments([])}
                      >
                        Clear selection
                      </Button>
                    </>
                  )}
                </PopoverContent>
              </Popover>
            </div>

            {/* Outcome - Multi-select */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3" />
                Outcome
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full h-9 justify-between text-sm font-normal bg-background border-border">
                    {selectedOutcomes.length === 0 ? 'All' : `${selectedOutcomes.length} selected`}
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-40 p-2 bg-popover border-border z-[70]" align="start">
                  <div className="space-y-1">
                    {OUTCOME_OPTIONS.map((option) => (
                      <div 
                        key={option.value} 
                        className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer"
                        onClick={() => handleOutcomeToggle(option.value)}
                      >
                        <Checkbox checked={selectedOutcomes.includes(option.value)} />
                        <span className="text-sm">{option.label}</span>
                      </div>
                    ))}
                  </div>
                  {selectedOutcomes.length > 0 && (
                    <>
                      <DropdownMenuSeparator className="my-2" />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full text-xs"
                        onClick={() => setSelectedOutcomes([])}
                      >
                        Clear selection
                      </Button>
                    </>
                  )}
                </PopoverContent>
              </Popover>
            </div>

            {/* Month - UI only (not wired) */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <CalendarIcon2 className="w-3 h-3" />
                Month
              </label>
              <Select>
                <SelectTrigger className="h-9 bg-background border-border">
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

            {/* Hour - Multi-select */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                Hour
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full h-9 justify-between text-sm font-normal bg-background border-border">
                    {selectedHours.length === 0 ? 'All' : `${selectedHours.length} selected`}
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-44 p-2 bg-popover border-border z-[70]" align="start">
                  <div className="space-y-1 max-h-48 overflow-auto">
                    {HOUR_OPTIONS.map((option) => (
                      <div 
                        key={option.value} 
                        className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer"
                        onClick={() => handleHourToggle(option.value)}
                      >
                        <Checkbox checked={selectedHours.includes(option.value)} />
                        <span className="text-sm">{option.label}</span>
                      </div>
                    ))}
                  </div>
                  {selectedHours.length > 0 && (
                    <>
                      <DropdownMenuSeparator className="my-2" />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full text-xs"
                        onClick={() => setSelectedHours([])}
                      >
                        Clear selection
                      </Button>
                    </>
                  )}
                </PopoverContent>
              </Popover>
            </div>

            {/* Trade Type - UI only (not wired) */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <ListFilter className="w-3 h-3" />
                Trade Type
              </label>
              <Select>
                <SelectTrigger className="h-9 bg-background border-border">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-[60]">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="scalp">Scalp</SelectItem>
                  <SelectItem value="day">Day Trade</SelectItem>
                  <SelectItem value="swing">Swing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Checklist Type - UI only (not wired) */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <ListFilter className="w-3 h-3" />
                Checklist Type
              </label>
              <Select>
                <SelectTrigger className="h-9 bg-background border-border">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-[60]">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="entry">Entry</SelectItem>
                  <SelectItem value="exit">Exit</SelectItem>
                  <SelectItem value="risk">Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Row 2: Setup, Direction, Day, Return %, Starred, empty */}
            {/* Setup - Multi-select from strategies */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <BarChart2 className="w-3 h-3" />
                Setup
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full h-9 justify-between text-sm font-normal bg-background border-border">
                    {selectedSetups.length === 0 ? 'All' : `${selectedSetups.length} selected`}
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2 bg-popover border-border z-[70]" align="start">
                  <div className="space-y-1 max-h-48 overflow-auto">
                    {strategies.length === 0 ? (
                      <div className="text-xs text-muted-foreground py-2 text-center">No setups found</div>
                    ) : (
                      strategies.map((strategy) => (
                        <div 
                          key={strategy.id} 
                          className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer"
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
                      <DropdownMenuSeparator className="my-2" />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full text-xs"
                        onClick={() => setSelectedSetups([])}
                      >
                        Clear selection
                      </Button>
                    </>
                  )}
                </PopoverContent>
              </Popover>
            </div>

            {/* Direction - UI only (not wired) */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3" />
                Direction
              </label>
              <Select>
                <SelectTrigger className="h-9 bg-background border-border">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-[60]">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="long">Long</SelectItem>
                  <SelectItem value="short">Short</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Day - Multi-select */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <CalendarIcon2 className="w-3 h-3" />
                Day
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full h-9 justify-between text-sm font-normal bg-background border-border">
                    {selectedDays.length === 0 ? 'All' : `${selectedDays.length} selected`}
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-40 p-2 bg-popover border-border z-[70]" align="start">
                  <div className="space-y-1">
                    {DAY_OPTIONS.map((option) => (
                      <div 
                        key={option.value} 
                        className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer"
                        onClick={() => handleDayToggle(option.value)}
                      >
                        <Checkbox checked={selectedDays.includes(option.value)} />
                        <span className="text-sm">{option.label}</span>
                      </div>
                    ))}
                  </div>
                  {selectedDays.length > 0 && (
                    <>
                      <DropdownMenuSeparator className="my-2" />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full text-xs"
                        onClick={() => setSelectedDays([])}
                      >
                        Clear selection
                      </Button>
                    </>
                  )}
                </PopoverContent>
              </Popover>
            </div>

            {/* Return % - UI only (not wired) */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Percent className="w-3 h-3" />
                Return %
              </label>
              <Select>
                <SelectTrigger className="h-9 bg-background border-border">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-[60]">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="positive">&gt; 0%</SelectItem>
                  <SelectItem value="negative">&lt; 0%</SelectItem>
                  <SelectItem value="high">&gt; 2%</SelectItem>
                  <SelectItem value="vhigh">&gt; 5%</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Starred - UI only (not wired) */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Star className="w-3 h-3" />
                Starred
              </label>
              <Select>
                <SelectTrigger className="h-9 bg-background border-border">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-[60]">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="starred">Starred Only</SelectItem>
                  <SelectItem value="unstarred">Unstarred Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Empty cell for row alignment */}
            <div />

            {/* Row 3: RRR, Last Trades, Year, R-Multiple Gain, empty, empty */}
            {/* RRR - UI only (not wired) */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Percent className="w-3 h-3" />
                RRR
              </label>
              <Select>
                <SelectTrigger className="h-9 bg-background border-border">
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

            {/* Last Trades - Single select */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Hash className="w-3 h-3" />
                Last Trades
              </label>
              <Select 
                value={lastTradesFilter === null ? 'all' : lastTradesFilter.toString()} 
                onValueChange={(value) => setLastTradesFilter(value === 'all' ? null : parseInt(value) as LastTradesFilter)}
              >
                <SelectTrigger className="h-9 bg-background border-border">
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

            {/* Year - UI only (not wired) */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <CalendarIcon2 className="w-3 h-3" />
                Year
              </label>
              <Select>
                <SelectTrigger className="h-9 bg-background border-border">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-[60]">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* R-Multiple Gain - UI only (not wired) */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Hash className="w-3 h-3" />
                R-Multiple Gain
              </label>
              <Select>
                <SelectTrigger className="h-9 bg-background border-border">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-[60]">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="positive">&gt; 0R</SelectItem>
                  <SelectItem value="negative">&lt; 0R</SelectItem>
                  <SelectItem value="1r">&gt; 1R</SelectItem>
                  <SelectItem value="2r">&gt; 2R</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Advanced Filters Dropdown */}
      <DropdownMenu open={advancedFiltersOpen} onOpenChange={setAdvancedFiltersOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 bg-background border-border">
            <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
            <span>Advanced Filters</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[250px] p-4 bg-popover border-border z-50">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <CalendarIcon2 className="w-3 h-3" />
              Date Range
            </label>
            <Select>
              <SelectTrigger className="h-9 bg-background border-border">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border z-[60]">
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <div className="flex-1" />

      {/* Date Range Selector */}
      <div className="flex items-center">
        <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className={`gap-2 bg-background border-border min-w-[200px] justify-start ${datePreset !== 'all' ? 'rounded-r-none border-r-0' : ''}`}>
              <CalendarIcon className="w-4 h-4 text-muted-foreground" />
              <span className="truncate">{getDateRangeLabel()}</span>
              <ChevronDown className="w-4 h-4 text-muted-foreground ml-auto" />
            </Button>
          </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-popover border-border z-50" align="start">
          <div className="flex">
            {/* Calendar */}
            <div className="p-3 border-r border-border">
              <Calendar
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={handleCustomDateChange}
                numberOfMonths={2}
                className="pointer-events-auto"
              />
            </div>
            {/* Presets */}
            <div className="p-2 min-w-[150px]">
              <button
                onClick={() => {
                  applyDatePreset('all');
                  setDatePickerOpen(false);
                }}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors",
                  datePreset === 'all' && "bg-accent font-medium"
                )}
              >
                All time
              </button>
              {DATE_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => {
                    handlePresetClick(preset.value);
                    setDatePickerOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors",
                    datePreset === preset.value && "bg-accent font-medium"
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
        {datePreset !== 'all' && (
          <Button
            variant="outline"
            size="icon"
            className="rounded-l-none border-l-0 bg-background border-border h-10 w-8"
            onClick={() => applyDatePreset('all')}
          >
            <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
          </Button>
        )}
      </div>

      {/* Account Filter */}
      <div className="flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className={`gap-2 bg-background border-border min-w-[150px] justify-start ${!isAllAccountsSelected ? 'rounded-r-none border-r-0' : ''}`}>
              <Wallet className="w-4 h-4 text-muted-foreground" />
              <span className="truncate">{getAccountsLabel()}</span>
              <ChevronDown className="w-4 h-4 text-muted-foreground ml-auto" />
            </Button>
          </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="bg-popover border-border z-50 min-w-[200px]">
          <DropdownMenuCheckboxItem
            checked={isAllAccountsSelected}
            onCheckedChange={handleAllAccountsToggle}
            className="cursor-pointer"
          >
            All accounts
          </DropdownMenuCheckboxItem>
          
          {accounts.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                My accounts
              </DropdownMenuLabel>
              {accounts.map((account) => (
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
            onClick={() => navigate('/settings')}
            className="cursor-pointer"
          >
            <Settings className="w-4 h-4 mr-2" />
            Manage accounts
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
        {!isAllAccountsSelected && (
          <Button
            variant="outline"
            size="icon"
            className="rounded-l-none border-l-0 bg-background border-border h-10 w-8"
            onClick={() => setSelectedAccounts([])}
          >
            <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
          </Button>
        )}
      </div>
    </div>
  );
};