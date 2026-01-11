import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, ChevronDown, Wallet, Settings, Check, X } from 'lucide-react';
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
import { useGlobalFilters, CurrencyCode, CURRENCIES, DatePreset } from '@/contexts/GlobalFiltersContext';
import { useAccountsContext } from '@/contexts/AccountsContext';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

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
    currency, 
    setCurrency, 
    currencyConfig,
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

  const handleCurrencyChange = (newCurrency: CurrencyCode) => {
    setCurrency(newCurrency);
  };

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
      {/* Currency Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 bg-background border-border">
            <span className="text-lg font-semibold">{currencyConfig.symbol}</span>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="bg-popover border-border z-50">
          {Object.entries(CURRENCIES).map(([code, config]) => (
            <DropdownMenuItem
              key={code}
              onClick={() => handleCurrencyChange(code as CurrencyCode)}
              className={cn(
                "flex items-center gap-2 cursor-pointer",
                currency === code && "bg-accent"
              )}
            >
              <span className="w-6 text-center font-semibold">{config.symbol}</span>
              <span>{code}</span>
              {currency === code && <Check className="w-4 h-4 ml-auto" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

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
