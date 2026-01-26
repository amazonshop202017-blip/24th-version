import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useFilteredTrades } from '@/hooks/useFilteredTrades';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { calculateTradeMetrics } from '@/types/trade';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isToday } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface DayData {
  netPnl: number;
  tradeCount: number;
}

const YearlyCalendar = () => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const { filteredTrades } = useFilteredTradesContext();
  const { formatCurrency } = useGlobalFilters();

  // Group trades by date and calculate daily P&L
  const dailyData = useMemo(() => {
    const data: Record<string, DayData> = {};

    filteredTrades.forEach((trade) => {
      const metrics = calculateTradeMetrics(trade);
      // Use the first entry date as the trade date
      const tradeDate = metrics.openDate ? format(new Date(metrics.openDate), 'yyyy-MM-dd') : null;
      
      if (tradeDate) {
        if (!data[tradeDate]) {
          data[tradeDate] = { netPnl: 0, tradeCount: 0 };
        }
        data[tradeDate].netPnl += metrics.netPnl;
        data[tradeDate].tradeCount += 1;
      }
    });

    return data;
  }, [filteredTrades]);

  const handlePrevYear = () => setSelectedYear(prev => prev - 1);
  const handleNextYear = () => setSelectedYear(prev => prev + 1);

  // Generate calendar days for a month
  const getMonthDays = (year: number, monthIndex: number) => {
    const monthDate = new Date(year, monthIndex, 1);
    const start = startOfWeek(startOfMonth(monthDate));
    const end = endOfWeek(endOfMonth(monthDate));
    
    const days: Date[] = [];
    let current = start;
    
    while (current <= end) {
      days.push(current);
      current = addDays(current, 1);
    }
    
    return days;
  };

  const getDayClass = (date: Date, monthIndex: number) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const dayData = dailyData[dateKey];
    const isCurrentMonth = date.getMonth() === monthIndex;
    
    if (!isCurrentMonth) {
      return 'text-muted-foreground/30';
    }
    
    if (dayData) {
      if (dayData.netPnl > 0) {
        return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40';
      } else if (dayData.netPnl < 0) {
        return 'bg-red-500/20 text-red-400 border border-red-500/40';
      }
    }
    
    return 'text-muted-foreground';
  };

  return (
    <TooltipProvider>
      <div className="glass-card rounded-2xl p-4 sm:p-6 mx-auto max-w-6xl">
        {/* Year Header */}
        <div className="flex items-center justify-center gap-6 mb-6">
          <button
            onClick={handlePrevYear}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="text-lg font-semibold text-foreground">{selectedYear}</h2>
          <button
            onClick={handleNextYear}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 12-Month Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          {MONTHS.map((monthName, monthIndex) => {
            const monthDays = getMonthDays(selectedYear, monthIndex);
            
            return (
              <div key={monthName} className="space-y-1">
                {/* Month Name */}
                <h3 className="text-xs font-medium text-foreground text-center mb-2">
                  {monthName}
                </h3>
                
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 gap-px mb-0.5">
                  {WEEKDAYS.map((day) => (
                    <div
                      key={day}
                      className="text-[9px] text-muted-foreground text-center py-0.5"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-px">
                  {monthDays.map((date, idx) => {
                    const dateKey = format(date, 'yyyy-MM-dd');
                    const dayData = dailyData[dateKey];
                    const isCurrentMonth = date.getMonth() === monthIndex;
                    const dayNumber = date.getDate();

                    return (
                      <Tooltip key={idx} delayDuration={0}>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              "aspect-square flex items-center justify-center text-[9px] rounded-[2px] cursor-default transition-colors",
                              getDayClass(date, monthIndex),
                              isToday(date) && isCurrentMonth && "ring-1 ring-primary"
                            )}
                          >
                            {isCurrentMonth ? dayNumber : ''}
                          </div>
                        </TooltipTrigger>
                        {isCurrentMonth && (
                          <TooltipContent 
                            side="top" 
                            className="bg-card border border-border px-3 py-2 shadow-xl"
                          >
                            <div className="space-y-1">
                              <div className="text-xs font-medium text-foreground">
                                {format(date, 'MMMM d, yyyy')}
                              </div>
                              {dayData ? (
                                <>
                                  <div className={cn(
                                    "text-sm font-semibold",
                                    dayData.netPnl > 0 ? "text-emerald-400" : dayData.netPnl < 0 ? "text-red-400" : "text-muted-foreground"
                                  )}>
                                    Net P&L: {formatCurrency(dayData.netPnl)}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {dayData.tradeCount} trade{dayData.tradeCount !== 1 ? 's' : ''}
                                  </div>
                                </>
                              ) : (
                                <div className="text-xs text-muted-foreground">No trades</div>
                              )}
                            </div>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Bottom spacing */}
        <div className="h-4" />
      </div>
    </TooltipProvider>
  );
};

export default YearlyCalendar;
