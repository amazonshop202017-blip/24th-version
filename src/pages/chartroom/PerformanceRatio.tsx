import { useState, useMemo } from 'react';
import { useFilteredTradesContext } from '@/contexts/TradesContext';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { useAccountsContext } from '@/contexts/AccountsContext';
import { useTagsContext } from '@/contexts/TagsContext';
import { useCategoriesContext } from '@/contexts/CategoriesContext';
import { useCustomStats } from '@/contexts/CustomStatsContext';
import { calculateTradeMetrics, Trade } from '@/types/trade';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, Tag, MessageSquare, Check } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';

type DisplayType = 'dollar' | 'percent' | 'winrate' | 'tradecount';
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
}

const PerformanceRatio = () => {
  const { filteredTrades } = useFilteredTradesContext();
  const { currencyConfig, selectedAccounts, isAllAccountsSelected, classifyTradeOutcome } = useGlobalFilters();
  const { accounts, getAccountBalanceBeforeTrades } = useAccountsContext();
  const { tags, getActiveTags } = useTagsContext();
  const { categories } = useCategoriesContext();
  const { options } = useCustomStats();

  const [displayType, setDisplayType] = useState<DisplayType>('dollar');
  const [selectionType, setSelectionType] = useState<SelectionType>('tradeComments');
  const [selectedCommentCategory, setSelectedCommentCategory] = useState<CommentCategory>('entryComments');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectionOpen, setSelectionOpen] = useState(false);
  const [openTagPopovers, setOpenTagPopovers] = useState<Record<string, boolean>>({});

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

  // Get tags grouped by category for selection UI
  const tagsByCategory = useMemo(() => {
    const activeTags = getActiveTags();
    const grouped: Record<string, typeof tags> = {};
    categories.forEach(category => {
      grouped[category.id] = activeTags.filter(tag => tag.categoryId === category.id);
    });
    return grouped;
  }, [categories, getActiveTags, tags]);

  // Get comment values based on selected category
  const commentValues = useMemo(() => {
    switch (selectedCommentCategory) {
      case 'entryComments':
        return options.entryComments.filter(c => !c.archived).map(c => c.value);
      case 'tradeManagement':
        return options.tradeManagements.filter(c => !c.archived).map(c => c.value);
      case 'exitComments':
        return options.exitComments.filter(c => !c.archived).map(c => c.value);
      default:
        return [];
    }
  }, [selectedCommentCategory, options]);

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
    }>();

    if (selectionType === 'tradeComments') {
      // Group by comment values
      const fieldKey = selectedCommentCategory === 'entryComments' ? 'entryComment' :
                       selectedCommentCategory === 'tradeManagement' ? 'tradeManagement' :
                       'exitComment';

      closedTrades.forEach(trade => {
        const metrics = calculateTradeMetrics(trade);
        const commentValue = trade[fieldKey as keyof Trade] as string || 'No Comment';
        
        const outcome = classifyTradeOutcome(metrics.netPnl, trade.savedReturnPercent, trade.breakEven);
        const existing = dataMap.get(commentValue) || {
          totalPnl: 0,
          tradeCount: 0,
          winCount: 0,
          lossCount: 0,
          beCount: 0,
        };

        dataMap.set(commentValue, {
          totalPnl: existing.totalPnl + metrics.netPnl,
          tradeCount: existing.tradeCount + 1,
          winCount: existing.winCount + (outcome === 'win' ? 1 : 0),
          lossCount: existing.lossCount + (outcome === 'loss' ? 1 : 0),
          beCount: existing.beCount + (outcome === 'breakeven' ? 1 : 0),
        });
      });
    } else {
      // Group by tags
      const tagIdToName = new Map<string, string>();
      tags.forEach(tag => tagIdToName.set(tag.id, tag.name));

      // If specific tags are selected, group by those tags only
      const targetTagIds = selectedTagIds.length > 0 ? selectedTagIds : tags.map(t => t.id);

      closedTrades.forEach(trade => {
        const metrics = calculateTradeMetrics(trade);
        const outcome = classifyTradeOutcome(metrics.netPnl, trade.savedReturnPercent, trade.breakEven);

        // A trade can have multiple tags, so it may appear in multiple groups
        const tradeTagIds = trade.tags || [];
        
        // Find which target tags this trade has
        const matchedTagIds = tradeTagIds.filter(tagId => targetTagIds.includes(tagId));
        
        if (matchedTagIds.length === 0 && selectedTagIds.length === 0) {
          // No tags and showing all - categorize as "Untagged"
          const existing = dataMap.get('Untagged') || {
            totalPnl: 0,
            tradeCount: 0,
            winCount: 0,
            lossCount: 0,
            beCount: 0,
          };
          dataMap.set('Untagged', {
            totalPnl: existing.totalPnl + metrics.netPnl,
            tradeCount: existing.tradeCount + 1,
            winCount: existing.winCount + (outcome === 'win' ? 1 : 0),
            lossCount: existing.lossCount + (outcome === 'loss' ? 1 : 0),
            beCount: existing.beCount + (outcome === 'breakeven' ? 1 : 0),
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
            };
            dataMap.set(tagName, {
              totalPnl: existing.totalPnl + metrics.netPnl,
              tradeCount: existing.tradeCount + 1,
              winCount: existing.winCount + (outcome === 'win' ? 1 : 0),
              lossCount: existing.lossCount + (outcome === 'loss' ? 1 : 0),
              beCount: existing.beCount + (outcome === 'breakeven' ? 1 : 0),
            });
          });
        }
      });
    }

    // Convert to array with calculated values
    const data: GroupedData[] = Array.from(dataMap.entries())
      .map(([name, data]) => {
        const winsAndLosses = data.winCount + data.lossCount;
        const winrate = winsAndLosses > 0 ? (data.winCount / winsAndLosses) * 100 : 0;
        const returnPercent = totalStartingBalance > 0
          ? (data.totalPnl / totalStartingBalance) * 100
          : 0;

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
        };
      })
      .sort((a, b) => b.displayValue - a.displayValue);

    return data;
  }, [filteredTrades, selectionType, selectedCommentCategory, selectedTagIds, displayType, totalStartingBalance, tags, classifyTradeOutcome]);

  // Calculate metrics for cards
  const metrics = useMemo(() => {
    if (groupedData.length === 0) {
      return {
        bestSum: { name: '-', value: 0 },
        worstSum: { name: '-', value: 0 },
        bestAvg: { name: '-', value: 0 },
        worstAvg: { name: '-', value: 0 },
        bestWinRate: { name: '-', value: 0 },
        worstWinRate: { name: '-', value: 0 },
      };
    }

    const sortedBySum = [...groupedData].sort((a, b) => b.totalPnl - a.totalPnl);
    const bestSum = sortedBySum[0];
    const worstSum = sortedBySum[sortedBySum.length - 1];

    const sortedByAvg = [...groupedData].sort((a, b) => b.avgPnl - a.avgPnl);
    const bestAvg = sortedByAvg[0];
    const worstAvg = sortedByAvg[sortedByAvg.length - 1];

    const sortedByWinRate = [...groupedData].sort((a, b) => b.winrate - a.winrate);
    const bestWinRate = sortedByWinRate[0];
    const worstWinRate = sortedByWinRate[sortedByWinRate.length - 1];

    return {
      bestSum: { name: bestSum.name, value: displayType === 'dollar' ? bestSum.totalPnl : bestSum.totalPercent },
      worstSum: { name: worstSum.name, value: displayType === 'dollar' ? worstSum.totalPnl : worstSum.totalPercent },
      bestAvg: { name: bestAvg.name, value: displayType === 'dollar' ? bestAvg.avgPnl : bestAvg.totalPercent / bestAvg.tradeCount },
      worstAvg: { name: worstAvg.name, value: displayType === 'dollar' ? worstAvg.avgPnl : worstAvg.totalPercent / worstAvg.tradeCount },
      bestWinRate: { name: bestWinRate.name, value: bestWinRate.winrate },
      worstWinRate: { name: worstWinRate.name, value: worstWinRate.winrate },
    };
  }, [groupedData, displayType]);

  // Format value for display
  const formatValue = (value: number, forceType?: DisplayType): string => {
    const type = forceType || displayType;
    if (type === 'percent' || type === 'winrate') {
      return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
    }
    if (type === 'tradecount') {
      return value.toString();
    }
    const absValue = Math.abs(value);
    if (absValue >= 1000) {
      return `${value >= 0 ? '+' : '-'}${currencyConfig.symbol}${(absValue / 1000).toFixed(1)}k`;
    }
    return `${value >= 0 ? '+' : '-'}${currencyConfig.symbol}${absValue.toFixed(2)}`;
  };

  // Toggle tag selection
  const toggleTagSelection = (tagId: string) => {
    setSelectedTagIds(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  // Select/deselect all tags in a category
  const selectAllTagsInCategory = (categoryId: string) => {
    const categoryTags = tagsByCategory[categoryId] || [];
    const allTagIds = categoryTags.map(t => t.id);
    const allSelected = allTagIds.every(id => selectedTagIds.includes(id));
    
    if (allSelected) {
      setSelectedTagIds(prev => prev.filter(id => !allTagIds.includes(id)));
    } else {
      setSelectedTagIds(prev => [...new Set([...prev, ...allTagIds])]);
    }
  };

  // Get selection label
  const getSelectionLabel = () => {
    if (selectionType === 'tradeComments') {
      switch (selectedCommentCategory) {
        case 'entryComments': return 'Entry Comments';
        case 'tradeManagement': return 'Trade Management';
        case 'exitComments': return 'Exit Comments';
      }
    } else {
      if (selectedTagIds.length === 0) return 'All Tags';
      if (selectedTagIds.length === 1) {
        const tag = tags.find(t => t.id === selectedTagIds[0]);
        return tag?.name || '1 Tag';
      }
      return `${selectedTagIds.length} Tags`;
    }
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    
    const data = payload[0].payload as GroupedData;
    const returnLabel = displayType === 'percent' ? 'Return (%)' : 'Total P/L';
    const returnValue = displayType === 'percent' 
      ? `${data.totalPercent >= 0 ? '+' : ''}${data.totalPercent.toFixed(2)}%`
      : `${data.totalPnl >= 0 ? '+' : ''}${currencyConfig.symbol}${Math.abs(data.totalPnl).toFixed(2)}`;

    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-xl text-sm">
        <p className="font-medium text-foreground mb-2">{label}</p>
        <div className="space-y-1 text-muted-foreground">
          <p>{returnLabel}: <span className={data.totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}>{returnValue}</span></p>
          <p>Trades: {data.tradeCount}</p>
          <p>Wins: {data.winCount}</p>
          <p>Losses: {data.lossCount}</p>
          <p>Breakeven: {data.beCount}</p>
          <p>Win Rate: {data.winrate.toFixed(1)}%</p>
        </div>
      </div>
    );
  };

  const metricsCards = [
    { 
      label: `Best ${selectionType === 'tags' ? 'Tag' : 'Comment'} – Total`, 
      name: metrics.bestSum.name,
      value: formatValue(metrics.bestSum.value), 
      isPositive: metrics.bestSum.value >= 0 
    },
    { 
      label: `Worst ${selectionType === 'tags' ? 'Tag' : 'Comment'} – Total`, 
      name: metrics.worstSum.name,
      value: formatValue(metrics.worstSum.value), 
      isPositive: metrics.worstSum.value >= 0 
    },
    { 
      label: `Best ${selectionType === 'tags' ? 'Tag' : 'Comment'} – Average`, 
      name: metrics.bestAvg.name,
      value: formatValue(metrics.bestAvg.value), 
      isPositive: metrics.bestAvg.value >= 0 
    },
    { 
      label: `Worst ${selectionType === 'tags' ? 'Tag' : 'Comment'} – Average`, 
      name: metrics.worstAvg.name,
      value: formatValue(metrics.worstAvg.value), 
      isPositive: metrics.worstAvg.value >= 0 
    },
    { 
      label: 'Best Win Rate (%)', 
      name: metrics.bestWinRate.name,
      value: `${metrics.bestWinRate.value.toFixed(1)}%`, 
      isPositive: true 
    },
    { 
      label: 'Worst Win Rate (%)', 
      name: metrics.worstWinRate.name,
      value: `${metrics.worstWinRate.value.toFixed(1)}%`, 
      isPositive: false 
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Tags / Comments Analysis</h1>
        <p className="text-muted-foreground mt-1">Analyze your trading performance grouped by tags or trade comments.</p>
      </div>

      {/* Controls Row */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Display Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Display:</span>
          <Select value={displayType} onValueChange={(v) => setDisplayType(v as DisplayType)}>
            <SelectTrigger className="w-[140px] bg-background border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border z-50">
              <SelectItem value="dollar">Return ($)</SelectItem>
              <SelectItem value="percent">Return (%)</SelectItem>
              <SelectItem value="winrate">Win Rate (%)</SelectItem>
              <SelectItem value="tradecount">Trade Count</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Selection Panel */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Selection:</span>
          <Popover open={selectionOpen} onOpenChange={setSelectionOpen}>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="min-w-[180px] justify-between bg-background border-border"
              >
                <span>{getSelectionLabel()}</span>
                <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[480px] p-0 bg-popover border-border z-50" align="start">
              <div className="flex min-h-[320px]">
                {/* Left Column - Type Selection */}
                <div className="w-44 border-r border-border p-2 flex flex-col gap-1">
                  <button
                    onClick={() => {
                      setSelectionType('tradeComments');
                      setSelectedTagIds([]);
                    }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left w-full",
                      selectionType === 'tradeComments'
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <MessageSquare className="w-4 h-4" />
                    Trade Comments
                    <ChevronRight className="w-3 h-3 ml-auto" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectionType('tags');
                      setSelectedCommentCategory('entryComments');
                    }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left w-full",
                      selectionType === 'tags'
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Tag className="w-4 h-4" />
                    Tags
                    <ChevronRight className="w-3 h-3 ml-auto" />
                  </button>
                </div>

                {/* Right Column - Sub-Selection */}
                <div className="flex-1 p-4">
                  {selectionType === 'tradeComments' ? (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground mb-3">Select a comment category:</p>
                      {[
                        { key: 'entryComments' as CommentCategory, label: 'Entry Comments' },
                        { key: 'tradeManagement' as CommentCategory, label: 'Trade Management' },
                        { key: 'exitComments' as CommentCategory, label: 'Exit Comments' },
                      ].map(item => (
                        <button
                          key={item.key}
                          onClick={() => {
                            setSelectedCommentCategory(item.key);
                            setSelectionOpen(false);
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-left transition-colors",
                            selectedCommentCategory === item.key
                              ? "bg-primary/10 text-primary font-medium border border-primary/20"
                              : "hover:bg-accent text-foreground border border-transparent"
                          )}
                        >
                          {selectedCommentCategory === item.key && (
                            <Check className="w-4 h-4" />
                          )}
                          <span className={selectedCommentCategory !== item.key ? "ml-7" : ""}>
                            {item.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground mb-3">Select tags to analyze:</p>
                      {categories.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No categories created yet. Create categories in Settings → Custom Tags.
                        </p>
                      ) : (
                        categories.map(category => {
                          const categoryTags = tagsByCategory[category.id] || [];
                          const selectedInCategory = categoryTags.filter(t => selectedTagIds.includes(t.id));

                          return (
                            <div key={category.id} className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Checkbox 
                                  checked={selectedInCategory.length > 0 && selectedInCategory.length === categoryTags.length}
                                  onCheckedChange={() => selectAllTagsInCategory(category.id)}
                                />
                                <span className="text-sm font-medium">{category.name}</span>
                              </div>
                              
                              {categoryTags.length > 0 && (
                                <div className="ml-6">
                                  <Popover 
                                    open={openTagPopovers[category.id] || false}
                                    onOpenChange={(open) => setOpenTagPopovers(prev => ({ ...prev, [category.id]: open }))}
                                  >
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        role="combobox"
                                        className="w-full justify-between h-9 text-sm bg-background border-border"
                                      >
                                        {selectedInCategory.length === 0 
                                          ? 'Select tags' 
                                          : selectedInCategory.length === categoryTags.length 
                                            ? 'All selected'
                                            : `${selectedInCategory.length} selected`}
                                        <ChevronDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[220px] p-0 bg-popover border-border z-[100]" align="start">
                                      <Command>
                                        <CommandInput placeholder="Search tags..." className="h-9" />
                                        <CommandList>
                                          <CommandEmpty>No tags found.</CommandEmpty>
                                          <CommandGroup>
                                            <CommandItem
                                              onSelect={() => selectAllTagsInCategory(category.id)}
                                              className="cursor-pointer"
                                            >
                                              <div className={cn(
                                                "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                selectedInCategory.length === categoryTags.length
                                                  ? "bg-primary text-primary-foreground"
                                                  : "opacity-50"
                                              )}>
                                                {selectedInCategory.length === categoryTags.length && (
                                                  <Check className="h-3 w-3" />
                                                )}
                                              </div>
                                              <span className="font-medium">Select All</span>
                                            </CommandItem>
                                          </CommandGroup>
                                          <CommandSeparator />
                                          <CommandGroup>
                                            {categoryTags.map(tag => (
                                              <CommandItem
                                                key={tag.id}
                                                onSelect={() => toggleTagSelection(tag.id)}
                                                className="cursor-pointer"
                                              >
                                                <div className={cn(
                                                  "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                  selectedTagIds.includes(tag.id)
                                                    ? "bg-primary text-primary-foreground"
                                                    : "opacity-50"
                                                )}>
                                                  {selectedTagIds.includes(tag.id) && (
                                                    <Check className="h-3 w-3" />
                                                  )}
                                                </div>
                                                <span>{tag.name}</span>
                                              </CommandItem>
                                            ))}
                                          </CommandGroup>
                                        </CommandList>
                                      </Command>
                                    </PopoverContent>
                                  </Popover>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Chart */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Performance by {selectionType === 'tags' ? 'Tag' : 'Comment'}
          </h3>
          {groupedData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={groupedData} layout="vertical" margin={{ left: 120, right: 40, top: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis 
                  type="number" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  tickFormatter={(value) => {
                    if (displayType === 'percent' || displayType === 'winrate') return `${value.toFixed(0)}%`;
                    if (displayType === 'tradecount') return value.toString();
                    return `${currencyConfig.symbol}${Math.abs(value) >= 1000 ? `${(value / 1000).toFixed(0)}k` : value.toFixed(0)}`;
                  }}
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  width={110}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.1)' }} />
                <ReferenceLine x={0} stroke="hsl(var(--border))" />
                <Bar dataKey="displayValue" radius={[0, 4, 4, 0]} maxBarSize={32}>
                  {groupedData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`}
                      fill={
                        displayType === 'winrate' || displayType === 'tradecount'
                          ? 'hsl(var(--primary))'
                          : entry.displayValue >= 0
                            ? 'hsl(142.1 76.2% 36.3%)'  // green
                            : 'hsl(0 84.2% 60.2%)'     // red
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 border border-dashed border-border rounded-xl bg-muted/20">
              <p className="text-muted-foreground">
                {selectionType === 'tags' 
                  ? 'No trades with tags found. Assign tags to trades to see analysis.'
                  : 'No trades with comments found. Add comments to trades to see analysis.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metricsCards.map((metric) => (
          <Card key={metric.label} className="bg-card border-border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
              <p className="text-sm text-foreground mb-1 truncate" title={metric.name}>{metric.name}</p>
              <p className={`text-lg font-semibold ${
                metric.isPositive ? 'text-green-500' : 'text-red-500'
              }`}>
                {metric.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Data Table */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            {selectionType === 'tags' ? 'Tag' : 'Comment'} Performance
          </h3>
          {groupedData.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-muted-foreground">
                      {selectionType === 'tags' ? 'Tag' : 'Comment'}
                    </TableHead>
                    <TableHead className="text-muted-foreground text-right">Trades</TableHead>
                    <TableHead className="text-muted-foreground text-right">Wins</TableHead>
                    <TableHead className="text-muted-foreground text-right">Losses</TableHead>
                    <TableHead className="text-muted-foreground text-right">BE</TableHead>
                    <TableHead className="text-muted-foreground text-right">Win Rate</TableHead>
                    <TableHead className="text-muted-foreground text-right">Avg P/L</TableHead>
                    <TableHead className="text-muted-foreground text-right">Total P/L</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupedData.map((row) => (
                    <TableRow key={row.name} className="border-border">
                      <TableCell className="text-foreground font-medium">{row.name}</TableCell>
                      <TableCell className="text-foreground text-right">{row.tradeCount}</TableCell>
                      <TableCell className="text-green-500 text-right">{row.winCount}</TableCell>
                      <TableCell className="text-red-500 text-right">{row.lossCount}</TableCell>
                      <TableCell className="text-muted-foreground text-right">{row.beCount}</TableCell>
                      <TableCell className="text-foreground text-right">{row.winrate.toFixed(1)}%</TableCell>
                      <TableCell className={`text-right ${row.avgPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {row.avgPnl >= 0 ? '+' : '-'}{currencyConfig.symbol}{Math.abs(row.avgPnl).toFixed(2)}
                      </TableCell>
                      <TableCell className={`text-right ${row.totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {row.totalPnl >= 0 ? '+' : '-'}{currencyConfig.symbol}{Math.abs(row.totalPnl).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 border border-dashed border-border rounded-xl bg-muted/20">
              <p className="text-muted-foreground">No data available.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceRatio;
