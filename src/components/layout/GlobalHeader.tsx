import { useState } from 'react';
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
import { useGlobalFilters, DatePreset } from '@/contexts/GlobalFiltersContext';
import { useAccountsContext } from '@/contexts/AccountsContext';
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

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This week' },
  { value: 'this_month', label: 'This month' },
  { value: 'last_30_days', label: 'Last 30 days' },
  { value: 'last_month', label: 'Last month' },
  { value: 'this_quarter', label: 'This quarter' },
  { value: 'ytd', label: 'YTD (year to date)' },
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
  } = useGlobalFilters();
  
  const { accounts } = useAccountsContext();
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [basicFiltersOpen, setBasicFiltersOpen] = useState(false);
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);

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

  return (
    <div className="flex items-center gap-3 px-8 py-4 border-b border-border bg-card/50 backdrop-blur-sm">
      {/* Basic Filters Dropdown */}
      <DropdownMenu open={basicFiltersOpen} onOpenChange={setBasicFiltersOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 bg-background border-border">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span>Basic Filters</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[600px] p-4 bg-popover border-border z-50">
          <div className="grid grid-cols-3 gap-3">
            {/* Instrument */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Globe className="w-3 h-3" />
                Instrument
              </label>
              <Select>
                <SelectTrigger className="h-9 bg-background border-border">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-[60]">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="eurusd">EUR/USD</SelectItem>
                  <SelectItem value="gbpusd">GBP/USD</SelectItem>
                  <SelectItem value="usdjpy">USD/JPY</SelectItem>
                  <SelectItem value="btcusd">BTC/USD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Outcome */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <TrendingUp className="w-3 h-3" />
                Outcome
              </label>
              <Select>
                <SelectTrigger className="h-9 bg-background border-border">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-[60]">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="win">Win</SelectItem>
                  <SelectItem value="loss">Loss</SelectItem>
                  <SelectItem value="breakeven">Breakeven</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Setup */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <BarChart2 className="w-3 h-3" />
                Setup
              </label>
              <Select>
                <SelectTrigger className="h-9 bg-background border-border">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-[60]">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="breakout">Breakout</SelectItem>
                  <SelectItem value="pullback">Pullback</SelectItem>
                  <SelectItem value="reversal">Reversal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Direction */}
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

            {/* RRR */}
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

            {/* Starred */}
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
        <DropdownMenuContent align="start" className="w-[700px] p-4 bg-popover border-border z-50">
          <div className="grid grid-cols-4 gap-3">
            {/* Date Range */}
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

            {/* Year */}
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

            {/* Month */}
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

            {/* Day */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <CalendarIcon2 className="w-3 h-3" />
                Day
              </label>
              <Select>
                <SelectTrigger className="h-9 bg-background border-border">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-[60]">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="monday">Monday</SelectItem>
                  <SelectItem value="tuesday">Tuesday</SelectItem>
                  <SelectItem value="wednesday">Wednesday</SelectItem>
                  <SelectItem value="thursday">Thursday</SelectItem>
                  <SelectItem value="friday">Friday</SelectItem>
                  <SelectItem value="saturday">Saturday</SelectItem>
                  <SelectItem value="sunday">Sunday</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Hour */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                Hour
              </label>
              <Select>
                <SelectTrigger className="h-9 bg-background border-border">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-[60]">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="morning">Morning (6-12)</SelectItem>
                  <SelectItem value="afternoon">Afternoon (12-18)</SelectItem>
                  <SelectItem value="evening">Evening (18-24)</SelectItem>
                  <SelectItem value="night">Night (0-6)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Trade Type */}
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

            {/* Return % */}
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

            {/* R-Multiple Gain */}
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

            {/* Last Trades */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground flex items-center gap-1.5">
                <ListFilter className="w-3 h-3" />
                Last Trades
              </label>
              <Select>
                <SelectTrigger className="h-9 bg-background border-border">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-[60]">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="10">Last 10</SelectItem>
                  <SelectItem value="25">Last 25</SelectItem>
                  <SelectItem value="50">Last 50</SelectItem>
                  <SelectItem value="100">Last 100</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Checklist Type */}
            <div className="space-y-1.5 col-span-2">
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
                  <SelectItem value="entry">Entry Checklist</SelectItem>
                  <SelectItem value="exit">Exit Checklist</SelectItem>
                  <SelectItem value="risk">Risk Checklist</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
