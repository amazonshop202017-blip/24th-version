import { useState, useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { useFilteredTradesContext, useTradesContext } from '@/contexts/TradesContext';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { useAccountsContext } from '@/contexts/AccountsContext';
import { DayCard } from '@/components/dayview/DayCard';
import { DaySidebarCalendar } from '@/components/dayview/DaySidebarCalendar';
import { calculateTradeMetrics, Trade } from '@/types/trade';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';

interface DayGroup {
  date: Date;
  dateKey: string;
  trades: Trade[];
}

const DayView = () => {
  const { filteredTrades } = useFilteredTradesContext();
  const { trades: allTrades } = useTradesContext();
  const { selectedAccounts, setDateRange, setDatePreset } = useGlobalFilters();
  const { getActiveAccountNames } = useAccountsContext();
  
  // Calendar month state
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Get active account names for filtering
  const activeAccountNames = useMemo(() => getActiveAccountNames(), [getActiveAccountNames]);

  // Filter trades by account (but NOT by date) for the calendar
  // This ensures calendar highlights update when account filter changes
  const accountFilteredTrades = useMemo(() => {
    if (selectedAccounts.length === 0) {
      // "All Accounts" selected - filter to only active accounts
      return allTrades.filter(trade => activeAccountNames.includes(trade.accountName));
    } else {
      // Specific accounts selected
      return allTrades.filter(trade => selectedAccounts.includes(trade.accountName));
    }
  }, [allTrades, selectedAccounts, activeAccountNames]);

  // Group filtered trades by date
  const dayGroups = useMemo(() => {
    const groups: Record<string, DayGroup> = {};
    
    filteredTrades.forEach(trade => {
      const metrics = calculateTradeMetrics(trade);
      if (metrics.openDate) {
        const tradeDate = parseISO(metrics.openDate);
        const dateKey = format(tradeDate, 'yyyy-MM-dd');
        
        if (!groups[dateKey]) {
          groups[dateKey] = {
            date: startOfDay(tradeDate),
            dateKey,
            trades: [],
          };
        }
        groups[dateKey].trades.push(trade);
      }
    });
    
    // Sort by date descending (most recent first)
    return Object.values(groups).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [filteredTrades]);

  // Handle date selection from calendar
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setDatePreset('custom');
    setDateRange({
      from: startOfDay(date),
      to: endOfDay(date),
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <Calendar className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Day View</h1>
          <p className="text-muted-foreground">Daily trading analysis and breakdown</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex gap-6">
        {/* Day Cards List */}
        <div className="flex-1 space-y-4">
          {dayGroups.length === 0 ? (
            <div className="flex items-center justify-center h-64 border border-dashed border-border rounded-xl">
              <p className="text-muted-foreground">No trades found for the selected filters</p>
            </div>
          ) : (
            dayGroups.map(group => (
              <DayCard
                key={group.dateKey}
                date={group.date}
                trades={group.trades}
              />
            ))
          )}
        </div>

        {/* Sticky Calendar Sidebar */}
        <div className="w-[280px] flex-shrink-0">
          <DaySidebarCalendar
            trades={accountFilteredTrades}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
          />
        </div>
      </div>
    </div>
  );
};

export default DayView;
