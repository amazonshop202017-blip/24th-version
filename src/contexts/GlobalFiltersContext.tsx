import { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, startOfQuarter, startOfYear } from 'date-fns';

export type CurrencyCode = 'USD' | 'EUR' | 'INR';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  locale: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', locale: 'en-US' },
  EUR: { code: 'EUR', symbol: '€', locale: 'de-DE' },
  INR: { code: 'INR', symbol: '₹', locale: 'en-IN' },
};

export type DatePreset = 'today' | 'this_week' | 'this_month' | 'last_30_days' | 'last_month' | 'this_quarter' | 'ytd' | 'custom' | 'all';

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export type OutcomeFilter = 'win' | 'loss' | 'breakeven';
export type DayFilter = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export type LastTradesFilter = 10 | 25 | 50 | 100 | null;

interface GlobalFiltersContextType {
  // Currency
  currency: CurrencyCode;
  setCurrency: (currency: CurrencyCode) => void;
  currencyConfig: CurrencyConfig;
  formatCurrency: (value: number, showSign?: boolean) => string;
  
  // Date Range
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  datePreset: DatePreset;
  setDatePreset: (preset: DatePreset) => void;
  applyDatePreset: (preset: DatePreset) => void;
  
  // Account Filter
  selectedAccounts: string[];
  setSelectedAccounts: (accounts: string[]) => void;
  isAllAccountsSelected: boolean;
  
  // Basic Filters
  selectedInstruments: string[];
  setSelectedInstruments: (instruments: string[]) => void;
  selectedOutcomes: OutcomeFilter[];
  setSelectedOutcomes: (outcomes: OutcomeFilter[]) => void;
  selectedHours: number[];
  setSelectedHours: (hours: number[]) => void;
  selectedSetups: string[];
  setSelectedSetups: (setups: string[]) => void;
  selectedDays: DayFilter[];
  setSelectedDays: (days: DayFilter[]) => void;
  lastTradesFilter: LastTradesFilter;
  setLastTradesFilter: (count: LastTradesFilter) => void;
}

const GlobalFiltersContext = createContext<GlobalFiltersContextType | undefined>(undefined);

export const GlobalFiltersProvider = ({ children }: { children: ReactNode }) => {
  // Currency state - default to USD
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  
  // Date range state - default to all time (undefined)
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  
  // Account filter state - empty array means "all accounts"
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  
  // Basic filters state
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [selectedOutcomes, setSelectedOutcomes] = useState<OutcomeFilter[]>([]);
  const [selectedHours, setSelectedHours] = useState<number[]>([]);
  const [selectedSetups, setSelectedSetups] = useState<string[]>([]);
  const [selectedDays, setSelectedDays] = useState<DayFilter[]>([]);
  const [lastTradesFilter, setLastTradesFilter] = useState<LastTradesFilter>(null);

  const currencyConfig = CURRENCIES[currency];

  const formatCurrency = (value: number, showSign: boolean = true): string => {
    const absValue = Math.abs(value);
    const formatted = new Intl.NumberFormat(currencyConfig.locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(absValue);
    
    if (showSign) {
      const sign = value >= 0 ? '+' : '-';
      return `${sign}${currencyConfig.symbol}${formatted}`;
    }
    
    return `${value < 0 ? '-' : ''}${currencyConfig.symbol}${formatted}`;
  };

  const applyDatePreset = (preset: DatePreset) => {
    const now = new Date();
    let from: Date | undefined;
    let to: Date | undefined = endOfDay(now);

    switch (preset) {
      case 'today':
        from = startOfDay(now);
        break;
      case 'this_week':
        from = startOfWeek(now, { weekStartsOn: 0 });
        to = endOfWeek(now, { weekStartsOn: 0 });
        break;
      case 'this_month':
        from = startOfMonth(now);
        to = endOfMonth(now);
        break;
      case 'last_30_days':
        from = subDays(startOfDay(now), 29);
        break;
      case 'last_month':
        const lastMonth = subDays(startOfMonth(now), 1);
        from = startOfMonth(lastMonth);
        to = endOfMonth(lastMonth);
        break;
      case 'this_quarter':
        from = startOfQuarter(now);
        break;
      case 'ytd':
        from = startOfYear(now);
        break;
      case 'all':
      case 'custom':
      default:
        from = undefined;
        to = undefined;
        break;
    }

    setDatePreset(preset);
    setDateRange({ from, to });
  };

  const isAllAccountsSelected = selectedAccounts.length === 0;

  const value = useMemo(() => ({
    currency,
    setCurrency,
    currencyConfig,
    formatCurrency,
    dateRange,
    setDateRange,
    datePreset,
    setDatePreset,
    applyDatePreset,
    selectedAccounts,
    setSelectedAccounts,
    isAllAccountsSelected,
    // Basic Filters
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
  }), [
    currency, 
    currencyConfig, 
    dateRange, 
    datePreset, 
    selectedAccounts,
    selectedInstruments,
    selectedOutcomes,
    selectedHours,
    selectedSetups,
    selectedDays,
    lastTradesFilter,
  ]);

  return (
    <GlobalFiltersContext.Provider value={value}>
      {children}
    </GlobalFiltersContext.Provider>
  );
};

export const useGlobalFilters = (): GlobalFiltersContextType => {
  const context = useContext(GlobalFiltersContext);
  if (context === undefined) {
    throw new Error('useGlobalFilters must be used within GlobalFiltersProvider');
  }
  return context;
};
