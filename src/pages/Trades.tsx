import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Trash2, 
  ArrowUpRight, 
  ArrowDownRight,
  Download,
  Upload,
  GitMerge,
  Copy,
  CheckSquare,
  Square
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useFilteredTrades } from '@/hooks/useFilteredTrades';
import { useTradeModal } from '@/contexts/TradeModalContext';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { usePrivacyMode } from '@/hooks/usePrivacyMode';
import { calculateTradeMetrics } from '@/types/trade';
import { cn } from '@/lib/utils';
import { WinRateGauge } from '@/components/dashboard/WinRateGauge';
import { ProfitFactorRing } from '@/components/dashboard/ProfitFactorRing';
import { AvgWinLossRatio } from '@/components/dashboard/AvgWinLossRatio';
import { TradesColumnSettings } from '@/components/trades/TradesColumnSettings';
import { useTradesColumnVisibility } from '@/hooks/useTradesColumnVisibility';
import { Checkbox } from '@/components/ui/checkbox';
import { AccountImportModal } from '@/components/settings/AccountImportModal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const Trades = () => {
  const { filteredTrades, deleteTrades, stats } = useFilteredTrades();
  const { openModal } = useTradeModal();
  const { formatCurrency } = useGlobalFilters();
  const { isPrivacyMode, maskCurrency } = usePrivacyMode();
  const { columns, toggleColumn, isColumnVisible, columnGroups } = useTradesColumnVisibility();
  
  const [selectedTrades, setSelectedTrades] = useState<Set<string>>(new Set());
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const sortedTrades = useMemo(() => {
    return [...filteredTrades].sort((a, b) => {
      const metricsA = calculateTradeMetrics(a);
      const metricsB = calculateTradeMetrics(b);
      return new Date(metricsB.closeDate || 0).getTime() - new Date(metricsA.closeDate || 0).getTime();
    });
  }, [filteredTrades]);

  const allSelected = sortedTrades.length > 0 && selectedTrades.size === sortedTrades.length;
  const someSelected = selectedTrades.size > 0;

  const handleSelectAll = () => {
    if (someSelected) {
      setSelectedTrades(new Set());
    } else {
      setSelectedTrades(new Set(sortedTrades.map(t => t.id)));
    }
  };

  const handleSelectTrade = (tradeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTrades(prev => {
      const next = new Set(prev);
      if (next.has(tradeId)) {
        next.delete(tradeId);
      } else {
        next.add(tradeId);
      }
      return next;
    });
  };

  const handleRowClick = (tradeId: string) => {
    const trade = sortedTrades.find(t => t.id === tradeId);
    if (trade) {
      openModal(trade);
    }
  };

  const handleDeleteSelected = () => {
    // Snapshot selection first
    const idsToDelete = Array.from(selectedTrades);

    // Clear selection immediately (do not read selection state again during deletion)
    setSelectedTrades(new Set());
    setDeleteDialogOpen(false);

    // Perform atomic bulk delete using the snapshot only
    deleteTrades(idsToDelete);
  };

  const formatDuration = (duration: string) => {
    const match = duration.match(/(\d+) days (\d+) hours (\d+) mins/);
    if (!match) return duration;
    const [, days, hours, mins] = match;
    if (parseInt(days) > 0) return `${days}d ${hours}h`;
    if (parseInt(hours) > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] space-y-4">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 flex-shrink-0">
        {/* Net P&L with Total Trades */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0 }}
          className="glass-card rounded-xl px-4 py-3"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs text-muted-foreground">Net P&L</span>
            <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
              {stats.totalTrades}
            </span>
          </div>
          <p className={`text-2xl font-bold font-mono ${isPrivacyMode ? 'text-foreground' : stats.netPnl >= 0 ? 'profit-text' : 'loss-text'}`}>
            {maskCurrency(stats.netPnl, formatCurrency)}
          </p>
        </motion.div>

        {/* Trade Win Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="glass-card rounded-xl px-4 py-3"
        >
          <WinRateGauge 
            value={stats.tradeWinRate} 
            label="Trade Win %"
            winners={stats.winningTrades}
            losers={stats.losingTrades}
            breakeven={stats.breakevenTrades}
          />
        </motion.div>

        {/* Profit Factor */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="glass-card rounded-xl px-4 py-3"
        >
          <ProfitFactorRing 
            profitFactor={stats.profitFactor}
            totalProfits={stats.totalProfits}
            totalLosses={stats.totalLosses}
          />
        </motion.div>

        {/* Day Win Rate */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="glass-card rounded-xl px-4 py-3"
        >
          <WinRateGauge 
            value={stats.dayWinRate} 
            label="Day Win %"
            winners={stats.winningDays}
            losers={stats.losingDays}
            breakeven={stats.breakevenDays}
          />
        </motion.div>

        {/* Avg Win/Loss Ratio */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="glass-card rounded-xl px-4 py-3"
        >
          <AvgWinLossRatio 
            avgWin={stats.avgWin}
            avgLoss={stats.avgLoss}
          />
        </motion.div>
      </div>

      {/* Trades Card Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-2xl flex flex-col flex-1 min-h-0 overflow-hidden"
      >
        {/* Action Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            {/* Select All / Deselect */}
            <Button
              variant={someSelected ? "default" : "outline"}
              size="sm"
              onClick={handleSelectAll}
              className="gap-2"
            >
              {someSelected ? (
                <>
                  <CheckSquare className="w-4 h-4" />
                  Deselect
                </>
              ) : (
                <>
                  <Square className="w-4 h-4" />
                  Select All
                </>
              )}
            </Button>

            {/* Import */}
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => setImportModalOpen(true)}
            >
              <Upload className="w-4 h-4" />
              Import
            </Button>

            {/* Merge */}
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              disabled={selectedTrades.size < 2}
            >
              <GitMerge className="w-4 h-4" />
              Merge
            </Button>

            {/* Duplicate */}
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              disabled={selectedTrades.size === 0}
            >
              <Copy className="w-4 h-4" />
              Duplicate
            </Button>

            {/* Delete */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2 text-destructive hover:text-destructive"
                disabled={selectedTrades.size === 0}
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="w-4 h-4" />
                Delete ({selectedTrades.size})
              </Button>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Selected Trades</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {selectedTrades.size} selected trade{selectedTrades.size > 1 ? 's' : ''}? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteSelected}
                    className="bg-loss hover:bg-loss/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-1">
            <TradesColumnSettings
              columns={columns}
              columnGroups={columnGroups}
              onToggleColumn={toggleColumn}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Scrollable Table Container */}
        <div className="flex-1 overflow-auto min-h-0">
          {sortedTrades.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-lg">No trades recorded yet</p>
              <p className="text-sm mt-1">Click "Enter Trade" or the + button to add your first trade</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-8 px-2">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all trades"
                    />
                  </TableHead>
                  {isColumnVisible('symbol') && <TableHead className="px-2">Symbol</TableHead>}
                  {isColumnVisible('side') && <TableHead className="px-2">Side</TableHead>}
                  {isColumnVisible('volume') && <TableHead className="px-2">Volume</TableHead>}
                  {isColumnVisible('ticksPips') && <TableHead className="px-2">Ticks/Pips</TableHead>}
                  {isColumnVisible('instrument') && <TableHead className="px-2">Instrument</TableHead>}
                  {isColumnVisible('accountName') && <TableHead className="px-2">Account</TableHead>}
                  {isColumnVisible('openDateTime') && <TableHead className="px-2">Open Date / Time</TableHead>}
                  {isColumnVisible('closeDateTime') && <TableHead className="px-2">Close Date / Time</TableHead>}
                  {isColumnVisible('duration') && <TableHead className="px-2">Duration</TableHead>}
                  {isColumnVisible('avgEntry') && <TableHead className="px-2">Avg Entry</TableHead>}
                  {isColumnVisible('avgExit') && <TableHead className="px-2">Avg Exit</TableHead>}
                  {isColumnVisible('initialRisk') && <TableHead className="px-2">Stop Loss</TableHead>}
                  {isColumnVisible('initialTarget') && <TableHead className="px-2">Take Profit</TableHead>}
                  {isColumnVisible('grossPnl') && <TableHead className="px-2">Gross P&L</TableHead>}
                  {isColumnVisible('netPnl') && <TableHead className="px-2">Net P&L</TableHead>}
                  {isColumnVisible('realizedRMultiple') && <TableHead className="px-2">R Multiple</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedTrades.map((trade) => {
                  const metrics = calculateTradeMetrics(trade);
                  const isSelected = selectedTrades.has(trade.id);
                  
                  return (
                    <TableRow
                      key={trade.id}
                      onClick={() => handleRowClick(trade.id)}
                      className={cn(
                        "border-border hover:bg-secondary/30 cursor-pointer h-10",
                        isSelected && "bg-secondary/50"
                      )}
                    >
                      <TableCell className="w-8 px-2 py-1" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            setSelectedTrades(prev => {
                              const next = new Set(prev);
                              if (checked) {
                                next.add(trade.id);
                              } else {
                                next.delete(trade.id);
                              }
                              return next;
                            });
                          }}
                          aria-label={`Select trade ${trade.symbol}`}
                        />
                      </TableCell>
                      
                      {isColumnVisible('symbol') && (
                        <TableCell className="font-semibold px-2 py-1">{trade.symbol}</TableCell>
                      )}
                      
                      {isColumnVisible('side') && (
                        <TableCell className="px-2 py-1">
                          <div className={cn(
                            "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium",
                            trade.side === 'LONG' ? "bg-profit/20 profit-text" : "bg-loss/20 loss-text"
                          )}>
                            {trade.side === 'LONG' ? (
                              <ArrowUpRight className="w-3 h-3" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3" />
                            )}
                            {trade.side}
                          </div>
                        </TableCell>
                      )}
                      
                      {isColumnVisible('volume') && (
                        <TableCell className="font-mono px-2 py-1">{metrics.totalQuantity}</TableCell>
                      )}
                      
                      {isColumnVisible('ticksPips') && (
                        <TableCell className="text-muted-foreground px-2 py-1">—</TableCell>
                      )}
                      
                      {isColumnVisible('instrument') && (
                        <TableCell className="px-2 py-1">{trade.instrument}</TableCell>
                      )}
                      
                      {isColumnVisible('accountName') && (
                        <TableCell className="text-muted-foreground px-2 py-1">{trade.accountName || '—'}</TableCell>
                      )}
                      
                      {isColumnVisible('openDateTime') && (
                        <TableCell className="text-muted-foreground text-xs px-2 py-1">
                          {metrics.openDate ? format(new Date(metrics.openDate), 'MMM dd, yyyy HH:mm') : '—'}
                        </TableCell>
                      )}
                      
                      {isColumnVisible('closeDateTime') && (
                        <TableCell className="text-muted-foreground text-xs px-2 py-1">
                          {metrics.closeDate ? format(new Date(metrics.closeDate), 'MMM dd, yyyy HH:mm') : '—'}
                        </TableCell>
                      )}
                      
                      {isColumnVisible('duration') && (
                        <TableCell className="text-muted-foreground text-xs px-2 py-1">
                          {formatDuration(metrics.duration)}
                        </TableCell>
                      )}
                      
                      {isColumnVisible('avgEntry') && (
                        <TableCell className="font-mono px-2 py-1">
                          {metrics.avgEntryPrice > 0 ? metrics.avgEntryPrice.toFixed(2) : '—'}
                        </TableCell>
                      )}
                      
                      {isColumnVisible('avgExit') && (
                        <TableCell className="font-mono px-2 py-1">
                          {metrics.avgExitPrice > 0 ? metrics.avgExitPrice.toFixed(2) : '—'}
                        </TableCell>
                      )}
                      
                      {isColumnVisible('initialRisk') && (
                        <TableCell className="font-mono px-2 py-1">
                          {trade.stopLoss !== undefined && trade.stopLoss !== null ? trade.stopLoss.toFixed(2) : '—'}
                        </TableCell>
                      )}
                      
                      {isColumnVisible('initialTarget') && (
                        <TableCell className="font-mono px-2 py-1">
                          {trade.takeProfit !== undefined && trade.takeProfit !== null ? trade.takeProfit.toFixed(2) : '—'}
                        </TableCell>
                      )}
                      
                      {isColumnVisible('grossPnl') && (
                        <TableCell className={cn(
                          "font-mono font-semibold px-2 py-1",
                          isPrivacyMode ? "text-foreground" : metrics.grossPnl >= 0 ? "profit-text" : "loss-text"
                        )}>
                          {maskCurrency(metrics.grossPnl, formatCurrency)}
                        </TableCell>
                      )}
                      
                      {isColumnVisible('netPnl') && (
                        <TableCell className={cn(
                          "font-mono font-semibold px-2 py-1",
                          isPrivacyMode ? "text-foreground" : metrics.netPnl >= 0 ? "profit-text" : "loss-text"
                        )}>
                          {maskCurrency(metrics.netPnl, formatCurrency)}
                        </TableCell>
                      )}
                      
                      {isColumnVisible('realizedRMultiple') && (
                        <TableCell className="font-mono px-2 py-1">
                          {metrics.rFactor !== 0 ? metrics.rFactor.toFixed(2) : (trade.savedRMultiple !== undefined && trade.savedRMultiple !== null ? trade.savedRMultiple.toFixed(2) : '—')}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </motion.div>

      {/* Import Modal */}
      <AccountImportModal 
        open={importModalOpen} 
        onOpenChange={setImportModalOpen} 
      />
    </div>
  );
};

export default Trades;
