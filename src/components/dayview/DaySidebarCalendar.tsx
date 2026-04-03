import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Trade, calculateTradeMetrics } from '@/types/trade';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  getDay,
  startOfWeek,
  endOfWeek,
  parseISO,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface DaySidebarCalendarProps {
  trades: Trade[];
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const DaySidebarCalendar = ({
  trades,
  currentMonth,
  onMonthChange,
  selectedDate,
  onDateSelect,
}: DaySidebarCalendarProps) => {
  const { dateRange } = useGlobalFilters();

  // Calculate daily P&L for all trades
  const dailyPnL = useMemo(() => {
    const pnlByDate: Record<string, number> = {};
    
    trades.forEach(trade => {
      const metrics = calculateTradeMetrics(trade);
      if (metrics.openDate) {
        const dateKey = format(parseISO(metrics.openDate), 'yyyy-MM-dd');
        pnlByDate[dateKey] = (pnlByDate[dateKey] || 0) + metrics.netPnl;
      }
    });
    
    return pnlByDate;
  }, [trades]);

  // Get all days to display in the calendar grid
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  const handlePrevMonth = () => {
    onMonthChange(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    onMonthChange(addMonths(currentMonth, 1));
  };

  const getDayStatus = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const pnl = dailyPnL[dateKey];
    
    if (pnl === undefined) return null;
    if (pnl > 0) return 'profit';
    if (pnl < 0) return 'loss';
    return null; // Exactly zero - no highlight
  };

  const isDateSelected = (date: Date) => {
    if (!dateRange.from) return false;
    
    // Single day selection
    if (dateRange.from && dateRange.to && isSameDay(dateRange.from, dateRange.to)) {
      return isSameDay(date, dateRange.from);
    }
    
    // Range selection
    if (dateRange.from && dateRange.to) {
      return date >= dateRange.from && date <= dateRange.to;
    }
    
    return false;
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 sticky top-4">
      {/* Header with month navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrevMonth}
          className="h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-semibold text-foreground">
          {format(currentMonth, 'MMMM yyyy')}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNextMonth}
          className="h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map(day => (
          <div
            key={day}
            className="h-8 flex items-center justify-center text-xs text-muted-foreground font-medium"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map(date => {
          const isCurrentMonth = isSameMonth(date, currentMonth);
          const status = getDayStatus(date);
          const isSelected = isDateSelected(date);
          const dayNumber = date.getDate();

          return (
            <button
              key={date.toISOString()}
              onClick={() => onDateSelect(date)}
              style={status === 'profit' ? { backgroundColor: 'hsl(var(--profit) / 0.15)' } : status === 'loss' ? { backgroundColor: 'hsl(var(--loss) / 0.15)' } : undefined}
              className={cn(
                'h-8 w-8 flex items-center justify-center rounded text-sm transition-colors',
                !isCurrentMonth && 'text-muted-foreground/30',
                isCurrentMonth && !status && 'text-muted-foreground hover:bg-muted/50',
                status === 'profit' && 'profit-text',
                status === 'loss' && 'loss-text',
                isSelected && 'ring-2 ring-primary ring-offset-1 ring-offset-background'
              )}
            >
              {dayNumber}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-profit" />
          <span className="text-xs text-muted-foreground">Profit</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-loss" />
          <span className="text-xs text-muted-foreground">Loss</span>
        </div>
      </div>
    </div>
  );
};
