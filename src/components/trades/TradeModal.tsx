import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Calendar, Search, TrendingUp, TrendingDown, Settings, Target, Wallet } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useTradeModal } from '@/contexts/TradeModalContext';
import { useTradesContext } from '@/contexts/TradesContext';
import { useTagsContext } from '@/contexts/TagsContext';
import { useStrategiesContext } from '@/contexts/StrategiesContext';
import { useAccountsContext } from '@/contexts/AccountsContext';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { TradeFormData, TradeEntry, calculateTradeMetrics } from '@/types/trade';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const defaultEntry = (): TradeEntry => ({
  id: crypto.randomUUID(),
  type: 'BUY',
  datetime: new Date().toISOString().slice(0, 16),
  quantity: 0,
  price: 0,
  charges: 0,
});

export const TradeModal = () => {
  const { isOpen, editingTrade, closeModal } = useTradeModal();
  const { addTrade, updateTrade } = useTradesContext();
  const { tags } = useTagsContext();
  const { strategies } = useStrategiesContext();
  const { accounts } = useAccountsContext();
  const { currencyConfig } = useGlobalFilters();
  const navigate = useNavigate();

  const [symbol, setSymbol] = useState('');
  const [instrument, setInstrument] = useState<'Equity' | 'Futures' | 'Options' | 'Crypto'>('Equity');
  const [entries, setEntries] = useState<TradeEntry[]>([defaultEntry()]);
  const [tradeRisk, setTradeRisk] = useState(0);
  const [tradeTarget, setTradeTarget] = useState(0);
  const [accountName, setAccountName] = useState('');
  const [strategyId, setStrategyId] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState('trades');
  
  // Manual position metrics
  const [positionMAE, setPositionMAE] = useState(0);
  const [positionMFE, setPositionMFE] = useState(0);
  const [potentialMAE, setPotentialMAE] = useState(0);
  const [potentialMFE, setPotentialMFE] = useState(0);
  const [missedTrade, setMissedTrade] = useState(false);

  useEffect(() => {
    if (editingTrade) {
      setSymbol(editingTrade.symbol);
      setInstrument(editingTrade.instrument);
      setEntries(editingTrade.entries.length > 0 ? editingTrade.entries : [defaultEntry()]);
      setTradeRisk(editingTrade.tradeRisk);
      setTradeTarget(editingTrade.tradeTarget || 0);
      setAccountName(editingTrade.accountName);
      setStrategyId(editingTrade.strategyId || '');
      setSelectedTags(editingTrade.tags);
      setNotes(editingTrade.notes || '');
      // Load manual position metrics
      setPositionMAE(editingTrade.positionMAE || 0);
      setPositionMFE(editingTrade.positionMFE || 0);
      setPotentialMAE(editingTrade.potentialMAE || 0);
      setPotentialMFE(editingTrade.potentialMFE || 0);
      setMissedTrade(editingTrade.missedTrade || false);
    } else {
      resetForm();
    }
  }, [editingTrade, isOpen]);

  const resetForm = () => {
    setSymbol('');
    setInstrument('Equity');
    setEntries([defaultEntry()]);
    setTradeRisk(0);
    setTradeTarget(0);
    setAccountName('');
    setStrategyId('');
    setSelectedTags([]);
    setNotes('');
    setActiveTab('trades');
    // Reset manual position metrics
    setPositionMAE(0);
    setPositionMFE(0);
    setPotentialMAE(0);
    setPotentialMFE(0);
    setMissedTrade(false);
  };

  const addEntry = () => {
    const firstEntry = entries[0];
    const newEntryType: 'BUY' | 'SELL' = firstEntry?.type === 'BUY' ? 'SELL' : 'BUY';
    
    const newEntry: TradeEntry = {
      id: crypto.randomUUID(),
      type: newEntryType,
      datetime: new Date().toISOString().slice(0, 16),
      quantity: 0,
      price: 0,
      charges: 0,
    };
    
    setEntries([...entries, newEntry]);
  };

  const removeEntry = (id: string) => {
    if (entries.length > 1) {
      setEntries(entries.filter(e => e.id !== id));
    }
  };

  const updateEntry = (id: string, field: keyof TradeEntry, value: any) => {
    setEntries(entries.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const metrics = useMemo(() => {
    const formData: TradeFormData = {
      symbol,
      side: 'LONG',
      instrument,
      entries,
      tradeRisk,
      tradeTarget,
      accountName,
      strategyId: strategyId || undefined,
      tags: selectedTags,
      notes,
      positionMAE,
      positionMFE,
      potentialMAE,
      potentialMFE,
      missedTrade,
    };
    return calculateTradeMetrics(formData);
  }, [symbol, instrument, entries, tradeRisk, tradeTarget, accountName, strategyId, selectedTags, notes, positionMAE, positionMFE, potentialMAE, potentialMFE, missedTrade]);

  const calculatedSide = metrics.positionSide || 'LONG';

  const handleSubmit = () => {
    if (!symbol.trim()) return;

    const tradeData: TradeFormData = {
      symbol: symbol.trim(),
      side: calculatedSide,
      instrument,
      entries,
      tradeRisk,
      tradeTarget,
      accountName: accountName.trim(),
      strategyId: strategyId || undefined,
      tags: selectedTags,
      notes: notes.trim(),
      positionMAE,
      positionMFE,
      potentialMAE,
      potentialMFE,
      missedTrade,
    };

    if (editingTrade) {
      updateTrade(editingTrade.id, tradeData);
    } else {
      addTrade(tradeData);
    }
    closeModal();
    resetForm();
  };

  const handleDiscard = () => {
    closeModal();
    resetForm();
  };

  const isWin = metrics.netPnl > 0;
  const returnPercent = metrics.returnPercent;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDiscard()}>
      <DialogContent className="max-w-[1400px] w-[95vw] p-0 bg-card border-border overflow-hidden max-h-[90vh]">
        <div className="flex h-full max-h-[85vh]">
          {/* Left Panel - Overview & Inputs */}
          <div className="w-[300px] min-w-[300px] border-r border-border p-4 bg-background/50 flex flex-col overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <h2 className="text-lg font-semibold">
                {editingTrade ? 'Edit Position' : 'New Position'}
              </h2>
            </div>

            {/* Status & Side Badges */}
            <div className="flex gap-2 mb-4">
              <Badge 
                variant="outline" 
                className={cn(
                  "px-2.5 py-0.5 text-xs",
                  metrics.positionStatus === 'OPEN' 
                    ? "border-primary text-primary bg-primary/10" 
                    : "border-muted-foreground text-muted-foreground bg-muted/10"
                )}
              >
                {metrics.positionStatus}
              </Badge>
              <Badge 
                variant="outline" 
                className={cn(
                  "px-2.5 py-0.5 text-xs",
                  calculatedSide === 'LONG' 
                    ? "border-profit text-profit bg-profit/10" 
                    : "border-loss text-loss bg-loss/10"
                )}
              >
                {calculatedSide}
              </Badge>
              {metrics.openQuantity > 0 && (
                <Badge variant="outline" className="px-2.5 py-0.5 text-xs">
                  {metrics.openQuantity} QTY
                </Badge>
              )}
              {missedTrade && (
                <Badge variant="outline" className="px-2.5 py-0.5 text-xs border-warning text-warning bg-warning/10">
                  MISSED
                </Badge>
              )}
            </div>

            {/* Overview Card */}
            <div className="glass-card rounded-xl p-3 mb-3">
              <h3 className="text-xs font-medium text-muted-foreground mb-2">Overview</h3>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Net</span>
                  <div className="flex items-center gap-1.5">
                    <span className={cn(
                      "font-mono font-bold text-sm",
                      isWin ? "profit-text" : "loss-text"
                    )}>
                      {currencyConfig.symbol}{metrics.netPnl.toFixed(2)}
                    </span>
                    <span className={cn(
                      "text-[10px]",
                      isWin ? "profit-text" : "loss-text"
                    )}>
                      {returnPercent >= 0 ? '+' : ''}{returnPercent.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">R Factor</span>
                  <span className="font-mono">{metrics.rFactor.toFixed(2)}</span>
                </div>
                <div className={cn(
                  "h-1 rounded-full",
                  isWin ? "bg-profit" : metrics.netPnl < 0 ? "bg-loss" : "bg-muted"
                )} />
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-muted-foreground pt-1">
                  <div>
                    <span className="block">Gross</span>
                    <span className="font-mono text-foreground">{currencyConfig.symbol}{metrics.grossPnl.toFixed(2)}</span>
                  </div>
                  <div className="text-right">
                    <span className="block">Charges</span>
                    <span className="font-mono text-foreground">{currencyConfig.symbol}{metrics.totalCharges.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="block">Avg Entry</span>
                    <span className="font-mono text-foreground">{currencyConfig.symbol}{metrics.avgEntryPrice.toFixed(2)}</span>
                  </div>
                  <div className="text-right">
                    <span className="block">Avg Exit</span>
                    <span className="font-mono text-foreground">{currencyConfig.symbol}{metrics.avgExitPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Duration Card */}
            <div className="glass-card rounded-xl p-3 mb-3">
              <h3 className="text-xs font-medium text-muted-foreground mb-1">Duration</h3>
              <p className="text-sm font-semibold">{metrics.duration}</p>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <Calendar className="w-2.5 h-2.5" />
                {metrics.openDate ? format(new Date(metrics.openDate), 'MMM dd, HH:mm') : '-'} - {metrics.closeDate ? format(new Date(metrics.closeDate), 'MMM dd, HH:mm') : '-'}
              </p>
            </div>

            {/* Form Fields */}
            <div className="space-y-2.5 flex-1">
              {/* Symbol */}
              <div>
                <Label className="text-xs mb-1 block">Symbol</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    placeholder="CRUDEOIL"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    className="pl-8 h-8 text-sm bg-input border-border"
                  />
                </div>
              </div>

              {/* Instrument */}
              <div>
                <Label className="text-xs mb-1 block">Instrument</Label>
                <div className="flex gap-1">
                  {(['Equity', 'Futures', 'Options', 'Crypto'] as const).map((type) => (
                    <Button
                      key={type}
                      type="button"
                      variant={instrument === type ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setInstrument(type)}
                      className={cn(
                        "text-[10px] h-7 px-2 flex-1",
                        instrument === type && "bg-primary text-primary-foreground"
                      )}
                    >
                      {type}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Account */}
              <div>
                <Label className="text-xs mb-1 block">Account</Label>
                {accounts.length === 0 ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      closeModal();
                      navigate('/settings');
                    }}
                    className="w-full h-8 text-xs"
                  >
                    <Wallet className="w-3 h-3 mr-1.5" />
                    Add Account
                  </Button>
                ) : (
                  <Select value={accountName || "none"} onValueChange={(val) => setAccountName(val === "none" ? "" : val)}>
                    <SelectTrigger className="h-8 text-sm bg-input border-border">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.name}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Strategy */}
              <div>
                <Label className="text-xs mb-1 block">Strategy</Label>
                {strategies.length === 0 ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      closeModal();
                      navigate('/strategies');
                    }}
                    className="w-full h-8 text-xs"
                  >
                    <Target className="w-3 h-3 mr-1.5" />
                    Add Strategy
                  </Button>
                ) : (
                  <Select value={strategyId || "none"} onValueChange={(val) => setStrategyId(val === "none" ? "" : val)}>
                    <SelectTrigger className="h-8 text-sm bg-input border-border">
                      <SelectValue placeholder="Select strategy..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {strategies.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Tags */}
              <div>
                <Label className="text-xs mb-1 block">Tags</Label>
                {tags.length === 0 ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      closeModal();
                      navigate('/settings');
                    }}
                    className="w-full h-8 text-xs"
                  >
                    <Settings className="w-3 h-3 mr-1.5" />
                    Manage Tags
                  </Button>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                        className={cn(
                          "cursor-pointer text-[10px] px-1.5 py-0",
                          selectedTags.includes(tag) && "bg-primary text-primary-foreground"
                        )}
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                    <Badge
                      variant="outline"
                      className="cursor-pointer text-[10px] px-1.5 py-0"
                      onClick={() => {
                        closeModal();
                        navigate('/settings');
                      }}
                    >
                      <Plus className="w-2.5 h-2.5" />
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Middle Panel - Trade Entries & Notes */}
          <div className="flex-1 p-5 overflow-y-auto flex flex-col min-w-0 border-r border-border">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="w-fit mb-4">
                <TabsTrigger value="trades">Trades</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              <TabsContent value="trades" className="flex-1 mt-0 flex flex-col">
                {/* Entries Table */}
                <div className="glass-card rounded-xl overflow-hidden flex-1">
                  <div className="grid grid-cols-[90px_1fr_100px_100px_90px_40px] gap-2 p-3 text-xs text-muted-foreground border-b border-border font-medium">
                    <div>Type</div>
                    <div>Time</div>
                    <div>Quantity</div>
                    <div>Price</div>
                    <div>Charges</div>
                    <div></div>
                  </div>
                  <div className="divide-y divide-border max-h-[350px] overflow-y-auto">
                    <AnimatePresence>
                      {entries.map((entry, index) => (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="grid grid-cols-[90px_1fr_100px_100px_90px_40px] gap-2 p-3 items-center"
                        >
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              variant={entry.type === 'BUY' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => updateEntry(entry.id, 'type', 'BUY')}
                              className={cn(
                                "h-7 px-2 text-xs flex-1",
                                entry.type === 'BUY' && "bg-profit hover:bg-profit/90"
                              )}
                            >
                              Buy
                            </Button>
                            <Button
                              type="button"
                              variant={entry.type === 'SELL' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => updateEntry(entry.id, 'type', 'SELL')}
                              className={cn(
                                "h-7 px-2 text-xs flex-1",
                                entry.type === 'SELL' && "bg-primary hover:bg-primary/90"
                              )}
                            >
                              Sell
                            </Button>
                          </div>
                          <div className="relative">
                            <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                            <Input
                              type="datetime-local"
                              value={entry.datetime}
                              onChange={(e) => updateEntry(entry.id, 'datetime', e.target.value)}
                              className="pl-7 h-8 text-xs bg-input border-border"
                            />
                          </div>
                          <Input
                            type="number"
                            placeholder="10"
                            value={entry.quantity || ''}
                            onChange={(e) => updateEntry(entry.id, 'quantity', parseFloat(e.target.value) || 0)}
                            className="h-8 text-xs bg-input border-border"
                          />
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{currencyConfig.symbol}</span>
                            <Input
                              type="number"
                              placeholder="100"
                              value={entry.price || ''}
                              onChange={(e) => updateEntry(entry.id, 'price', parseFloat(e.target.value) || 0)}
                              className="pl-6 h-8 text-xs bg-input border-border"
                            />
                          </div>
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{currencyConfig.symbol}</span>
                            <Input
                              type="number"
                              placeholder="0"
                              value={entry.charges || ''}
                              onChange={(e) => updateEntry(entry.id, 'charges', parseFloat(e.target.value) || 0)}
                              className="pl-6 h-8 text-xs bg-input border-border"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeEntry(entry.id)}
                            disabled={entries.length === 1}
                            className="h-8 w-8 text-muted-foreground hover:text-loss"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                  {/* Add Entry Button */}
                  <div className="p-3 border-t border-border">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addEntry}
                      className="gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Entry
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="notes" className="flex-1 mt-0">
                <Textarea
                  placeholder="Add notes about this trade..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[300px] h-full bg-input border-border resize-none p-3"
                />
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 mt-auto border-t border-border">
              <Button type="button" variant="outline" onClick={handleDiscard}>
                Discard
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!symbol.trim()}
              >
                {editingTrade ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>

          {/* Right Panel - Position Metrics (Manual Inputs) */}
          <div className="w-[250px] min-w-[250px] p-4 pr-5 bg-background/50 flex flex-col overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                <Target className="w-4 h-4 text-accent-foreground" />
              </div>
              <h2 className="text-lg font-semibold">Position Metrics</h2>
            </div>

            {/* Risk & Target at top of right panel */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="glass-card rounded-xl p-2.5">
                <Label className="text-[10px] mb-1 block text-muted-foreground">Risk</Label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{currencyConfig.symbol}</span>
                  <Input
                    type="number"
                    placeholder="1,000"
                    value={tradeRisk || ''}
                    onChange={(e) => setTradeRisk(parseFloat(e.target.value) || 0)}
                    className="pl-5 h-8 text-sm bg-input border-border"
                  />
                </div>
              </div>
              <div className="glass-card rounded-xl p-2.5">
                <Label className="text-[10px] mb-1 block text-muted-foreground">Target</Label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{currencyConfig.symbol}</span>
                  <Input
                    type="number"
                    placeholder="2,000"
                    value={tradeTarget || ''}
                    onChange={(e) => setTradeTarget(parseFloat(e.target.value) || 0)}
                    className="pl-5 h-8 text-sm bg-input border-border"
                  />
                </div>
              </div>
            </div>

            {/* MAE/MFE Input Cards */}
            <div className="space-y-3 flex-1">
              {/* Position MAE */}
              <div className="glass-card rounded-xl p-3">
                <Label className="text-xs mb-1.5 block text-muted-foreground">Position MAE</Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{currencyConfig.symbol}</span>
                  <Input
                    type="number"
                    placeholder="0"
                    value={positionMAE || ''}
                    onChange={(e) => setPositionMAE(parseFloat(e.target.value) || 0)}
                    className="pl-6 h-9 text-sm bg-input border-border"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5">Maximum Adverse Excursion</p>
              </div>

              {/* Position MFE */}
              <div className="glass-card rounded-xl p-3">
                <Label className="text-xs mb-1.5 block text-muted-foreground">Position MFE</Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{currencyConfig.symbol}</span>
                  <Input
                    type="number"
                    placeholder="0"
                    value={positionMFE || ''}
                    onChange={(e) => setPositionMFE(parseFloat(e.target.value) || 0)}
                    className="pl-6 h-9 text-sm bg-input border-border"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5">Maximum Favorable Excursion</p>
              </div>

              {/* Potential MAE */}
              <div className="glass-card rounded-xl p-3">
                <Label className="text-xs mb-1.5 block text-muted-foreground">Potential MAE</Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{currencyConfig.symbol}</span>
                  <Input
                    type="number"
                    placeholder="0"
                    value={potentialMAE || ''}
                    onChange={(e) => setPotentialMAE(parseFloat(e.target.value) || 0)}
                    className="pl-6 h-9 text-sm bg-input border-border"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5">Planned maximum drawdown</p>
              </div>

              {/* Potential MFE */}
              <div className="glass-card rounded-xl p-3">
                <Label className="text-xs mb-1.5 block text-muted-foreground">Potential MFE</Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{currencyConfig.symbol}</span>
                  <Input
                    type="number"
                    placeholder="0"
                    value={potentialMFE || ''}
                    onChange={(e) => setPotentialMFE(parseFloat(e.target.value) || 0)}
                    className="pl-6 h-9 text-sm bg-input border-border"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5">Planned maximum gain</p>
              </div>

              {/* Missed Trade Checkbox */}
              <div className="glass-card rounded-xl p-3 mt-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="missedTrade"
                    checked={missedTrade}
                    onCheckedChange={(checked) => setMissedTrade(checked === true)}
                    className="h-5 w-5"
                  />
                  <div className="flex-1">
                    <Label 
                      htmlFor="missedTrade" 
                      className="text-sm font-medium cursor-pointer"
                    >
                      Missed Trade
                    </Label>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Mark if this trade was not taken
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
