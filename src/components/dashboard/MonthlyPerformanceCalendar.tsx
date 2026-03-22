import { useState, useMemo } from 'react';
import { useFilteredTrades } from '@/hooks/useFilteredTrades';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { usePrivacyMode, PRIVACY_MASK } from '@/hooks/usePrivacyMode';
import { calculateTradeMetrics, Trade } from '@/types/trade';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameMonth, getDay, parseISO, startOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { DayDetailsModal } from '@/components/dayview/DayDetailsModal';

interface DayStats {
  pnl: number;
  trades: number;
  winRate: number;
  rMultiple: number;
  hasData: boolean;
}

interface WeekSummary {
  weekNumber: number;
  pnl: number;
  tradingDays: number;
}

interface DisplaySettings {
  dailyPnl: boolean;
  numTrades: boolean;
  winRate: boolean;
  rMultiple: boolean;
}

export const MonthlyPerformanceCalendar = () => {
  const { filteredTrades: trades } = useFilteredTrades();
  const { currencyConfig } = useGlobalFilters();
  const { isPrivacyMode } = usePrivacyMode();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>({
    dailyPnl: true,
    numTrades: true,
    winRate: true,
    rMultiple: false,
  });
  
  // Day details modal state
  const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null);
  const [selectedDayTrades, setSelectedDayTrades] = useState<Trade[]>([]);

  // Week starts on Saturday (6), so order is: Sat, Sun, Mon, Tue, Wed, Thu, Fri
  const weekDays = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  // Calculate day stats from trades
  const dayStatsMap = useMemo(() => {
    const map: Record<string, DayStats> = {};
    
    trades.forEach(trade => {
      const metrics = calculateTradeMetrics(trade);
      if (!metrics.closeDate) return;
      
      const dayKey = format(new Date(metrics.closeDate), 'yyyy-MM-dd');
      
      if (!map[dayKey]) {
        map[dayKey] = { pnl: 0, trades: 0, winRate: 0, rMultiple: 0, hasData: true };
      }
      
      map[dayKey].pnl += metrics.netPnl;
      map[dayKey].trades += 1;
      // Use stored R-Multiple if available
      if (trade.savedRMultiple !== undefined && trade.savedRMultiple !== null && isFinite(trade.savedRMultiple)) {
        map[dayKey].rMultiple += trade.savedRMultiple;
      }
    });

    // Calculate win rates
    Object.keys(map).forEach(dayKey => {
      const dayTrades = trades.filter(trade => {
        const metrics = calculateTradeMetrics(trade);
        return metrics.closeDate && format(new Date(metrics.closeDate), 'yyyy-MM-dd') === dayKey;
      });
      
      const winningTrades = dayTrades.filter(t => calculateTradeMetrics(t).netPnl > 0).length;
      map[dayKey].winRate = dayTrades.length > 0 ? (winningTrades / dayTrades.length) * 100 : 0;
    });

    return map;
  }, [trades]);

  // Get calendar days for current month view (starting from Saturday)
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    
    // Find the Saturday before or on the first day of the month
    const startDay = getDay(monthStart);
    // Saturday is 6, so we need to go back: if day is 0 (Sun), go back 1; if 1 (Mon), go back 2, etc.
    const daysToSubtract = startDay === 6 ? 0 : startDay + 1;
    const calendarStart = new Date(monthStart);
    calendarStart.setDate(monthStart.getDate() - daysToSubtract);
    
    // Find the Friday after or on the last day of the month
    const endDay = getDay(monthEnd);
    // Friday is 5, so we need to go forward: if day is 6 (Sat), go forward 6; if 0 (Sun), go forward 5, etc.
    const daysToAdd = endDay === 5 ? 0 : (5 - endDay + 7) % 7;
    const calendarEnd = new Date(monthEnd);
    calendarEnd.setDate(monthEnd.getDate() + daysToAdd);
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  // Group days into weeks
  const weeks = useMemo(() => {
    const result: Date[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      result.push(calendarDays.slice(i, i + 7));
    }
    return result;
  }, [calendarDays]);

  // Calculate weekly summaries
  const weeklySummaries = useMemo(() => {
    return weeks.map((week, index): WeekSummary => {
      let pnl = 0;
      let tradingDays = 0;

      week.forEach(day => {
        if (isSameMonth(day, currentMonth)) {
          const dayKey = format(day, 'yyyy-MM-dd');
          const stats = dayStatsMap[dayKey];
          if (stats?.hasData) {
            pnl += stats.pnl;
            tradingDays += 1;
          }
        }
      });

      return { weekNumber: index + 1, pnl, tradingDays };
    });
  }, [weeks, currentMonth, dayStatsMap]);

  // Calculate monthly stats
  const monthlyStats = useMemo(() => {
    let pnl = 0;
    let tradingDays = 0;
    let totalTrades = 0;
    let winningTrades = 0;

    const monthDays = eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth),
    });

    let winningDays = 0;

    monthDays.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      const stats = dayStatsMap[dayKey];
      if (stats?.hasData) {
        pnl += stats.pnl;
        tradingDays += 1;
        totalTrades += stats.trades;
        winningTrades += Math.round(stats.trades * (stats.winRate / 100));
        if (stats.pnl > 0) winningDays += 1;
      }
    });

    const monthlyWinRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const daysWinRate = tradingDays > 0 ? (winningDays / tradingDays) * 100 : 0;

    return { pnl, tradingDays, totalTrades, monthlyWinRate, daysWinRate };
  }, [currentMonth, dayStatsMap]);

  const formatCurrency = (value: number) => {
    if (isPrivacyMode) return PRIVACY_MASK;
    const prefix = value >= 0 ? currencyConfig.symbol : `-${currencyConfig.symbol}`;
    return `${prefix}${Math.abs(value).toFixed(0)}`;
  };

  const formatCurrencyDecimal = (value: number) => {
    if (isPrivacyMode) return PRIVACY_MASK;
    const prefix = value >= 0 ? currencyConfig.symbol : `-${currencyConfig.symbol}`;
    return `${prefix}${Math.abs(value).toFixed(2)}`;
  };

  const handlePrevMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));
  const handleThisMonth = () => setCurrentMonth(new Date());

  const toggleSetting = (key: keyof DisplaySettings) => {
    setDisplaySettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Handle day click to open modal
  const handleDayClick = (day: Date) => {
    const dayKey = format(day, 'yyyy-MM-dd');
    const dayTrades = trades.filter(trade => {
      const metrics = calculateTradeMetrics(trade);
      return metrics.openDate && format(new Date(metrics.openDate), 'yyyy-MM-dd') === dayKey;
    });
    setSelectedDayDate(day);
    setSelectedDayTrades(dayTrades);
  };

  const handleCloseModal = () => {
    setSelectedDayDate(null);
    setSelectedDayTrades([]);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-card rounded-xl p-3 md:p-6 h-full"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 md:mb-6">
        <div className="flex items-center gap-2 md:gap-3">
          <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-7 w-7 md:h-8 md:w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-sm md:text-lg font-semibold min-w-[120px] md:min-w-[140px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <Button variant="ghost" size="icon" onClick={handleNextMonth} className="h-7 w-7 md:h-8 md:w-8">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleThisMonth} className="text-xs h-7">
            This month
          </Button>
        </div>

        <div className="flex items-center gap-2 md:gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm flex-wrap">
            <span className={`font-mono font-semibold ${isPrivacyMode ? 'text-foreground' : monthlyStats.pnl >= 0 ? 'profit-text' : 'loss-text'}`}>
              {formatCurrencyDecimal(monthlyStats.pnl)}
            </span>
            <span className="bg-secondary px-1.5 md:px-2 py-0.5 rounded text-[10px] md:text-xs flex items-center gap-1 md:gap-1.5">
              <span className="text-muted-foreground">{monthlyStats.tradingDays}d</span>
              <span className="text-border">|</span>
              <span className={monthlyStats.daysWinRate >= 50 ? 'text-profit' : 'text-loss'}>
                {monthlyStats.daysWinRate.toFixed(0)}%
              </span>
            </span>
            <span className="bg-secondary px-1.5 md:px-2 py-0.5 rounded text-[10px] md:text-xs flex items-center gap-1 md:gap-1.5">
              <span className="text-muted-foreground">{monthlyStats.totalTrades}t</span>
              <span className="text-border">|</span>
              <span className={monthlyStats.monthlyWinRate >= 50 ? 'text-profit' : 'text-loss'}>
                {monthlyStats.monthlyWinRate.toFixed(0)}%
              </span>
            </span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8 shrink-0">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 p-3">
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">Display Options</p>
                {[
                  { key: 'dailyPnl' as const, label: 'Daily P/L' },
                  { key: 'numTrades' as const, label: 'Number of Trades' },
                  { key: 'winRate' as const, label: 'Day Win Rate' },
                  { key: 'rMultiple' as const, label: 'R Multiple' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center gap-2">
                    <Checkbox
                      id={key}
                      checked={displaySettings[key]}
                      onCheckedChange={() => toggleSetting(key)}
                    />
                    <Label htmlFor={key} className="text-sm cursor-pointer">
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex gap-4">
        {/* Calendar */}
        <div className="flex-1 min-w-0">
          {/* Week day headers */}
          <div className="grid grid-cols-7 gap-0.5 md:gap-1 mb-1">
            {weekDays.map(day => (
              <div key={day} className="text-center text-[10px] md:text-xs font-medium text-muted-foreground py-1 md:py-2">
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{day.charAt(0)}</span>
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="space-y-0.5 md:space-y-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 gap-0.5 md:gap-1">
                {week.map((day, dayIndex) => {
                  const dayKey = format(day, 'yyyy-MM-dd');
                  const stats = dayStatsMap[dayKey];
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const hasData = stats?.hasData && isCurrentMonth;

                  let bgClass = 'bg-secondary/30';
                  if (hasData) {
                    bgClass = stats.pnl >= 0 
                      ? 'bg-[hsl(142_76%_45%/0.15)]' 
                      : 'bg-[hsl(0_84%_60%/0.15)]';
                  }

                  return (
                    <div
                      key={dayKey}
                      onClick={() => isCurrentMonth && handleDayClick(day)}
                      className={`
                        min-h-[68px] md:min-h-[80px] p-1 md:p-2 rounded-md md:rounded-lg border-transparent transition-colors
                        ${isCurrentMonth ? bgClass : 'bg-muted/20 opacity-40'}
                        ${isCurrentMonth ? 'cursor-pointer hover:ring-1 hover:ring-primary/50' : ''}
                      `}
                    >
                      <div className="flex items-center justify-center w-4 h-4 md:w-5 md:h-5 rounded-full bg-white dark:bg-slate-800 mb-0.5 md:mb-1">
                        <span className={`text-[8px] md:text-[10px] font-semibold ${isCurrentMonth ? 'text-black dark:text-white' : 'text-muted-foreground'}`}>
                          {format(day, 'd')}
                        </span>
                      </div>
                      
                      {hasData && (
                        <div className="space-y-0.5">
                          {displaySettings.dailyPnl && (
                            <div className={`text-[9px] md:text-sm font-bold font-mono ${isPrivacyMode ? 'text-foreground' : stats.pnl >= 0 ? 'profit-text' : 'loss-text'}`}>
                              {formatCurrencyDecimal(stats.pnl)}
                            </div>
                          )}
                          {displaySettings.numTrades && (
                            <div className="text-[8px] md:text-[10px] text-muted-foreground hidden sm:block">
                              {stats.trades} trade{stats.trades !== 1 ? 's' : ''}
                            </div>
                          )}
                          {displaySettings.winRate && (
                            <div className="text-[8px] md:text-[10px] text-muted-foreground hidden sm:block">
                              {stats.winRate.toFixed(1)}%
                            </div>
                          )}
                          {displaySettings.rMultiple && (
                            <div className="text-[8px] md:text-[10px] text-muted-foreground hidden sm:block">
                              {stats.rMultiple >= 0 ? '+' : ''}{stats.rMultiple.toFixed(2)}R
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Summaries - hidden on mobile */}
        <div className="hidden md:block w-32 space-y-1 pt-8">
          {weeklySummaries.map((summary, index) => (
            <div 
              key={index} 
              className="h-[80px] flex flex-col justify-center items-start px-3 py-2 rounded-lg bg-secondary/30"
              style={{ marginTop: index === 0 ? '0' : '4px' }}
            >
              <div className="text-xs text-muted-foreground mb-1">Week {summary.weekNumber}</div>
              <div className={`text-sm font-bold font-mono ${isPrivacyMode ? 'text-foreground' : summary.pnl >= 0 ? 'profit-text' : 'loss-text'}`}>
                {formatCurrencyDecimal(summary.pnl)}
              </div>
              <div className={`text-[10px] px-1.5 py-0.5 rounded mt-0.5 ${
                summary.tradingDays > 0 
                  ? summary.pnl >= 0 ? 'bg-[hsl(142_76%_45%/0.2)] text-[hsl(142_76%_55%)]' : 'bg-[hsl(0_84%_60%/0.2)] text-[hsl(0_84%_70%)]'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {summary.tradingDays} day{summary.tradingDays !== 1 ? 's' : ''}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Day Details Modal */}
      {selectedDayDate && (
        <DayDetailsModal
          isOpen={!!selectedDayDate}
          onClose={handleCloseModal}
          date={selectedDayDate}
          trades={selectedDayTrades}
        />
      )}
    </motion.div>
  );
};
