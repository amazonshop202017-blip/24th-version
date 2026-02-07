import { useMemo, useState } from 'react';
import { useFilteredTrades } from '@/hooks/useFilteredTrades';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { useAccountsContext } from '@/contexts/AccountsContext';
import { useTagsContext } from '@/contexts/TagsContext';
import { usePrivacyMode } from '@/hooks/usePrivacyMode';
import { calculateTradeMetrics, Trade } from '@/types/trade';
import { ChartDisplayType, mapGlobalToChartDisplay, formatDuration, formatDurationTick } from '@/hooks/useChartDisplayMode';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
  Cell,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { ChartDisplayDropdown } from './ChartDisplayDropdown';

type SelectionType = 'tradeComments' | 'tags';
type CommentCategory = 'entryComments' | 'tradeManagement' | 'exitComments';

interface GroupedData {
  name: string;
  totalPnl: number;
  totalPercent: number;
  tradeCount: number;
  winCount: number;
  lossCount: number;
  beCount: number;
  avgPnl: number;
  winrate: number;
  displayValue: number;
  avgHoldTimeMinutes: number;
  longestDurationMinutes: number;
  longWinCount: number;
  longLossCount: number;
  longWinrate: number;
  shortWinCount: number;
  shortLossCount: number;
  shortWinrate: number;
  longTradeCount: number;
  shortTradeCount: number;
}

interface TagsCommentsChartProps {
  selectionType: SelectionType;
  selectedCommentCategory: CommentCategory;
  selectedTagIds: string[];
  defaultDisplayType?: ChartDisplayType;
  useGlobalDefault?: boolean;
}

export const TagsCommentsChart = ({
  selectionType,
  selectedCommentCategory,
  selectedTagIds,
  defaultDisplayType = 'dollar',
  useGlobalDefault = true,
}: TagsCommentsChartProps) => {
  const { filteredTrades } = useFilteredTrades();
  const { currencyConfig, selectedAccounts, isAllAccountsSelected, classifyTradeOutcome, displayMode } = useGlobalFilters();
  const { accounts, getAccountBalanceBeforeTrades } = useAccountsContext();
  const { tags } = useTagsContext();
  const { isPrivacyMode } = usePrivacyMode();

  // Calculate initial display type from global filter or prop
  const getInitialDisplayType = (): ChartDisplayType => {
    if (useGlobalDefault) {
      return mapGlobalToChartDisplay(displayMode);
    }
    return defaultDisplayType;
  };

  const [displayType, setDisplayType] = useState<ChartDisplayType>(getInitialDisplayType);

  // Calculate total starting balance
  const totalStartingBalance = useMemo(() => {
    const activeAccounts = accounts.filter(a => !a.isArchived);
    if (isAllAccountsSelected) {
      return activeAccounts.reduce((sum, acc) => sum + getAccountBalanceBeforeTrades(acc.id), 0);
    } else if (selectedAccounts.length > 0) {
      return activeAccounts
        .filter(acc => selectedAccounts.includes(acc.name))
        .reduce((sum, acc) => sum + getAccountBalanceBeforeTrades(acc.id), 0);
    }
    return 0;
  }, [accounts, selectedAccounts, isAllAccountsSelected, getAccountBalanceBeforeTrades]);

  // Calculate grouped data based on selection
  const groupedData = useMemo(() => {
    const closedTrades = filteredTrades.filter((trade: Trade) => {
      const metrics = calculateTradeMetrics(trade);
      return metrics.positionStatus === 'CLOSED';
    });

    if (closedTrades.length === 0) return [];

    const dataMap = new Map<string, {
      totalPnl: number;
      tradeCount: number;
      winCount: number;
      lossCount: number;
      beCount: number;
      totalDurationMinutes: number;
      longestDurationMinutes: number;
      longWinCount: number;
      longLossCount: number;
      shortWinCount: number;
      shortLossCount: number;
      longTradeCount: number;
      shortTradeCount: number;
    }>();

    if (selectionType === 'tradeComments') {
      const fieldKey = selectedCommentCategory === 'entryComments' ? 'entryComment' :
                       selectedCommentCategory === 'tradeManagement' ? 'tradeManagement' :
                       'exitComment';

      closedTrades.forEach(trade => {
        const metrics = calculateTradeMetrics(trade);
        const commentValue = trade[fieldKey as keyof Trade] as string || 'No Comment';
        
        const outcome = classifyTradeOutcome(metrics.netPnl, trade.savedReturnPercent, trade.breakEven);
        const durationMinutes = metrics.durationMinutes || 0;
        const isLong = trade.side === 'LONG';
        const isShort = trade.side === 'SHORT';
        const isWin = outcome === 'win';
        const isLoss = outcome === 'loss';
        
        const existing = dataMap.get(commentValue) || {
          totalPnl: 0,
          tradeCount: 0,
          winCount: 0,
          lossCount: 0,
          beCount: 0,
          totalDurationMinutes: 0,
          longestDurationMinutes: 0,
          longWinCount: 0,
          longLossCount: 0,
          shortWinCount: 0,
          shortLossCount: 0,
          longTradeCount: 0,
          shortTradeCount: 0,
        };

        dataMap.set(commentValue, {
          totalPnl: existing.totalPnl + metrics.netPnl,
          tradeCount: existing.tradeCount + 1,
          winCount: existing.winCount + (isWin ? 1 : 0),
          lossCount: existing.lossCount + (isLoss ? 1 : 0),
          beCount: existing.beCount + (outcome === 'breakeven' ? 1 : 0),
          totalDurationMinutes: existing.totalDurationMinutes + durationMinutes,
          longestDurationMinutes: Math.max(existing.longestDurationMinutes, durationMinutes),
          longWinCount: existing.longWinCount + (isLong && isWin ? 1 : 0),
          longLossCount: existing.longLossCount + (isLong && isLoss ? 1 : 0),
          shortWinCount: existing.shortWinCount + (isShort && isWin ? 1 : 0),
          shortLossCount: existing.shortLossCount + (isShort && isLoss ? 1 : 0),
          longTradeCount: existing.longTradeCount + (isLong ? 1 : 0),
          shortTradeCount: existing.shortTradeCount + (isShort ? 1 : 0),
        });
      });
    } else {
      const tagIdToName = new Map<string, string>();
      tags.forEach(tag => tagIdToName.set(tag.id, tag.name));

      const targetTagIds = selectedTagIds.length > 0 ? selectedTagIds : tags.map(t => t.id);

      closedTrades.forEach(trade => {
        const metrics = calculateTradeMetrics(trade);
        const outcome = classifyTradeOutcome(metrics.netPnl, trade.savedReturnPercent, trade.breakEven);
        const durationMinutes = metrics.durationMinutes || 0;
        const isLong = trade.side === 'LONG';
        const isShort = trade.side === 'SHORT';
        const isWin = outcome === 'win';
        const isLoss = outcome === 'loss';

        const tradeTagIds = trade.tags || [];
        const matchedTagIds = tradeTagIds.filter(tagId => targetTagIds.includes(tagId));
        
        if (matchedTagIds.length === 0 && selectedTagIds.length === 0) {
          const existing = dataMap.get('Untagged') || {
            totalPnl: 0,
            tradeCount: 0,
            winCount: 0,
            lossCount: 0,
            beCount: 0,
            totalDurationMinutes: 0,
            longestDurationMinutes: 0,
            longWinCount: 0,
            longLossCount: 0,
            shortWinCount: 0,
            shortLossCount: 0,
            longTradeCount: 0,
            shortTradeCount: 0,
          };
          dataMap.set('Untagged', {
            totalPnl: existing.totalPnl + metrics.netPnl,
            tradeCount: existing.tradeCount + 1,
            winCount: existing.winCount + (isWin ? 1 : 0),
            lossCount: existing.lossCount + (isLoss ? 1 : 0),
            beCount: existing.beCount + (outcome === 'breakeven' ? 1 : 0),
            totalDurationMinutes: existing.totalDurationMinutes + durationMinutes,
            longestDurationMinutes: Math.max(existing.longestDurationMinutes, durationMinutes),
            longWinCount: existing.longWinCount + (isLong && isWin ? 1 : 0),
            longLossCount: existing.longLossCount + (isLong && isLoss ? 1 : 0),
            shortWinCount: existing.shortWinCount + (isShort && isWin ? 1 : 0),
            shortLossCount: existing.shortLossCount + (isShort && isLoss ? 1 : 0),
            longTradeCount: existing.longTradeCount + (isLong ? 1 : 0),
            shortTradeCount: existing.shortTradeCount + (isShort ? 1 : 0),
          });
        } else {
          matchedTagIds.forEach(tagId => {
            const tagName = tagIdToName.get(tagId) || 'Unknown Tag';
            const existing = dataMap.get(tagName) || {
              totalPnl: 0,
              tradeCount: 0,
              winCount: 0,
              lossCount: 0,
              beCount: 0,
              totalDurationMinutes: 0,
              longestDurationMinutes: 0,
              longWinCount: 0,
              longLossCount: 0,
              shortWinCount: 0,
              shortLossCount: 0,
              longTradeCount: 0,
              shortTradeCount: 0,
            };
            dataMap.set(tagName, {
              totalPnl: existing.totalPnl + metrics.netPnl,
              tradeCount: existing.tradeCount + 1,
              winCount: existing.winCount + (isWin ? 1 : 0),
              lossCount: existing.lossCount + (isLoss ? 1 : 0),
              beCount: existing.beCount + (outcome === 'breakeven' ? 1 : 0),
              totalDurationMinutes: existing.totalDurationMinutes + durationMinutes,
              longestDurationMinutes: Math.max(existing.longestDurationMinutes, durationMinutes),
              longWinCount: existing.longWinCount + (isLong && isWin ? 1 : 0),
              longLossCount: existing.longLossCount + (isLong && isLoss ? 1 : 0),
              shortWinCount: existing.shortWinCount + (isShort && isWin ? 1 : 0),
              shortLossCount: existing.shortLossCount + (isShort && isLoss ? 1 : 0),
              longTradeCount: existing.longTradeCount + (isLong ? 1 : 0),
              shortTradeCount: existing.shortTradeCount + (isShort ? 1 : 0),
            });
          });
        }
      });
    }

    const data: GroupedData[] = Array.from(dataMap.entries())
      .map(([name, data]) => {
        const winsAndLosses = data.winCount + data.lossCount;
        const winrate = winsAndLosses > 0 ? (data.winCount / winsAndLosses) * 100 : 0;
        const returnPercent = totalStartingBalance > 0
          ? (data.totalPnl / totalStartingBalance) * 100
          : 0;

        const avgHoldTimeMinutes = data.tradeCount > 0 ? data.totalDurationMinutes / data.tradeCount : 0;
        const longestDurationMinutes = data.longestDurationMinutes;
        
        // Long Win % = Long Wins / (Long Wins + Long Losses)
        const longWinsAndLosses = data.longWinCount + data.longLossCount;
        const longWinrate = longWinsAndLosses > 0 ? (data.longWinCount / longWinsAndLosses) * 100 : 0;
        
        // Short Win % = Short Wins / (Short Wins + Short Losses)
        const shortWinsAndLosses = data.shortWinCount + data.shortLossCount;
        const shortWinrate = shortWinsAndLosses > 0 ? (data.shortWinCount / shortWinsAndLosses) * 100 : 0;

        let displayValue: number;
        switch (displayType) {
          case 'dollar':
            displayValue = data.totalPnl;
            break;
          case 'percent':
            displayValue = returnPercent;
            break;
          case 'winrate':
            displayValue = winrate;
            break;
          case 'tradecount':
            displayValue = data.tradeCount;
            break;
          case 'avg_hold_time':
            displayValue = avgHoldTimeMinutes;
            break;
          case 'longest_duration':
            displayValue = longestDurationMinutes;
            break;
          case 'long_winrate':
            displayValue = longWinrate;
            break;
          case 'short_winrate':
            displayValue = shortWinrate;
            break;
          case 'tradecount_long':
            displayValue = data.longTradeCount;
            break;
          case 'tradecount_short':
            displayValue = data.shortTradeCount;
            break;
          default:
            displayValue = data.totalPnl;
        }

        return {
          name,
          totalPnl: data.totalPnl,
          totalPercent: returnPercent,
          tradeCount: data.tradeCount,
          winCount: data.winCount,
          lossCount: data.lossCount,
          beCount: data.beCount,
          avgPnl: data.totalPnl / data.tradeCount,
          winrate,
          displayValue,
          avgHoldTimeMinutes,
          longestDurationMinutes,
          longWinCount: data.longWinCount,
          longLossCount: data.longLossCount,
          longWinrate,
          shortWinCount: data.shortWinCount,
          shortLossCount: data.shortLossCount,
          shortWinrate,
          longTradeCount: data.longTradeCount,
          shortTradeCount: data.shortTradeCount,
        };
      })
      .sort((a, b) => b.displayValue - a.displayValue);

    return data;
  }, [filteredTrades, selectionType, selectedCommentCategory, selectedTagIds, displayType, totalStartingBalance, tags, classifyTradeOutcome]);

  // Custom tooltip - content varies based on display type
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    
    const data = payload[0].payload as GroupedData;

    if (displayType === 'tradecount') {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-xl text-sm">
          <p className="font-medium text-foreground mb-2">{label}</p>
          <div className="space-y-1 text-muted-foreground">
            <p>Total Trades: {data.tradeCount}</p>
          </div>
        </div>
      );
    }

    if (displayType === 'avg_hold_time') {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-xl text-sm">
          <p className="font-medium text-foreground mb-2">{label}</p>
          <div className="space-y-1 text-muted-foreground">
            <p>Avg Hold Time: <span className="text-foreground">{formatDuration(data.avgHoldTimeMinutes)}</span></p>
            <p>Total Trades: {data.tradeCount}</p>
          </div>
        </div>
      );
    }

    if (displayType === 'longest_duration') {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-xl text-sm">
          <p className="font-medium text-foreground mb-2">{label}</p>
          <div className="space-y-1 text-muted-foreground">
            <p>Longest Duration: <span className="text-foreground">{formatDuration(data.longestDurationMinutes)}</span></p>
            <p>Total Trades: {data.tradeCount}</p>
          </div>
        </div>
      );
    }

    if (displayType === 'winrate') {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-xl text-sm">
          <p className="font-medium text-foreground mb-2">{label}</p>
          <div className="space-y-1 text-muted-foreground">
            <p>Winrate: <span className="text-foreground">{data.winrate.toFixed(1)}%</span></p>
            <p>Total Trades: {data.tradeCount}</p>
            <p>Winners: {data.winCount}</p>
            <p>Losers: {data.lossCount}</p>
            <p>BE: {data.beCount}</p>
          </div>
        </div>
      );
    }

    if (displayType === 'long_winrate') {
      const longTotal = data.longWinCount + data.longLossCount;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-xl text-sm">
          <p className="font-medium text-foreground mb-2">{label}</p>
          <div className="space-y-1 text-muted-foreground">
            <p>Long Win %: <span className="text-foreground">{data.longWinrate.toFixed(1)}%</span></p>
            <p>Long Wins: {data.longWinCount}</p>
            <p>Long Losses: {data.longLossCount}</p>
            <p>Total Long Trades: {longTotal}</p>
          </div>
        </div>
      );
    }

    if (displayType === 'short_winrate') {
      const shortTotal = data.shortWinCount + data.shortLossCount;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-xl text-sm">
          <p className="font-medium text-foreground mb-2">{label}</p>
          <div className="space-y-1 text-muted-foreground">
            <p>Short Win %: <span className="text-foreground">{data.shortWinrate.toFixed(1)}%</span></p>
            <p>Short Wins: {data.shortWinCount}</p>
            <p>Short Losses: {data.shortLossCount}</p>
            <p>Total Short Trades: {shortTotal}</p>
          </div>
        </div>
      );
    }

    if (displayType === 'tradecount_long') {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-xl text-sm">
          <p className="font-medium text-foreground mb-2">{label}</p>
          <div className="space-y-1 text-muted-foreground">
            <p>Trade Count (Long): <span className="text-foreground">{data.longTradeCount}</span></p>
            <p>Direction: Long</p>
          </div>
        </div>
      );
    }

    if (displayType === 'tradecount_short') {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-xl text-sm">
          <p className="font-medium text-foreground mb-2">{label}</p>
          <div className="space-y-1 text-muted-foreground">
            <p>Trade Count (Short): <span className="text-foreground">{data.shortTradeCount}</span></p>
            <p>Direction: Short</p>
          </div>
        </div>
      );
    }

    if (displayType === 'dollar') {
      const pnlValue = isPrivacyMode ? '**' : `${data.totalPnl >= 0 ? '+' : ''}${currencyConfig.symbol}${Math.abs(data.totalPnl).toFixed(2)}`;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-xl text-sm">
          <p className="font-medium text-foreground mb-2">{label}</p>
          <div className="space-y-1 text-muted-foreground">
            <p>Net PNL: <span className={isPrivacyMode ? 'text-foreground' : data.totalPnl >= 0 ? 'text-profit' : 'text-loss'}>{pnlValue}</span></p>
            <p>Total Trades: {data.tradeCount}</p>
            <p>Winners: {data.winCount}</p>
            <p>Losers: {data.lossCount}</p>
            <p>BE: {data.beCount}</p>
          </div>
        </div>
      );
    }

    if (displayType === 'percent') {
      const returnValue = isPrivacyMode ? '**' : `${data.totalPercent >= 0 ? '+' : ''}${data.totalPercent.toFixed(2)}%`;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-xl text-sm">
          <p className="font-medium text-foreground mb-2">{label}</p>
          <div className="space-y-1 text-muted-foreground">
            <p>Return %: <span className={isPrivacyMode ? 'text-foreground' : data.totalPercent >= 0 ? 'text-profit' : 'text-loss'}>{returnValue}</span></p>
            <p>Total Trades: {data.tradeCount}</p>
            <p>Winners: {data.winCount}</p>
            <p>Losers: {data.lossCount}</p>
            <p>BE: {data.beCount}</p>
          </div>
        </div>
      );
    }

    // Tick/Pip and Privacy modes
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-xl text-sm">
        <p className="font-medium text-foreground mb-2">{label}</p>
        <div className="space-y-1 text-muted-foreground">
          <p>{displayType === 'privacy' ? '•••••' : '--'}</p>
          <p>Total Trades: {data.tradeCount}</p>
          <p>Winners: {data.winCount}</p>
          <p>Losers: {data.lossCount}</p>
          <p>BE: {data.beCount}</p>
        </div>
      </div>
    );
  };

  return (
    <Card className="bg-card border-border h-full">
      <CardContent className="p-4">
        {/* Header with Display Dropdown */}
        <div className="flex items-start justify-between mb-3 flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <ChartDisplayDropdown
              value={displayType}
              onValueChange={(v) => setDisplayType(v)}
            />
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-profit" />
              <span className="text-xs text-muted-foreground">Profit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-loss" />
              <span className="text-xs text-muted-foreground">Loss</span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[300px] w-full">
          {groupedData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={groupedData} margin={{ left: 20, right: 20, top: 10, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.3} />
                <XAxis 
                  type="category" 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval={0}
                />
                <YAxis 
                  type="number" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  tickFormatter={(value) => {
                    // Mask $ and % values in privacy mode
                    if (isPrivacyMode && (displayType === 'dollar' || displayType === 'percent')) {
                      return '**';
                    }
                    if (displayType === 'percent' || displayType === 'winrate' || displayType === 'long_winrate' || displayType === 'short_winrate') return `${value.toFixed(0)}%`;
                    if (displayType === 'tradecount' || displayType === 'tradecount_long' || displayType === 'tradecount_short') return value.toString();
                    if (displayType === 'privacy') return '•••';
                    if (displayType === 'avg_hold_time' || displayType === 'longest_duration') return formatDurationTick(value);
                    return `${currencyConfig.symbol}${Math.abs(value) >= 1000 ? `${(value / 1000).toFixed(0)}k` : value.toFixed(0)}`;
                    return `${currencyConfig.symbol}${Math.abs(value) >= 1000 ? `${(value / 1000).toFixed(0)}k` : value.toFixed(0)}`;
                  }}
                  width={50}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.1)' }} />
                <ReferenceLine y={0} stroke="hsl(var(--border))" />
                <Bar dataKey="displayValue" radius={[4, 4, 0, 0]} maxBarSize={48}>
                  {groupedData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={
                        displayType === 'winrate' || displayType === 'tradecount' || displayType === 'avg_hold_time' || displayType === 'longest_duration' || displayType === 'long_winrate' || displayType === 'short_winrate' || displayType === 'tradecount_long' || displayType === 'tradecount_short'
                          ? 'hsl(var(--primary))'
                          : entry.displayValue >= 0
                            ? 'hsl(142.1 76.2% 36.3%)'
                            : 'hsl(0 84.2% 60.2%)'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full border border-dashed border-border rounded-xl bg-muted/20">
              <p className="text-muted-foreground text-sm">
                {selectionType === 'tags' 
                  ? 'No trades with tags found.'
                  : 'No trades with comments found.'}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
