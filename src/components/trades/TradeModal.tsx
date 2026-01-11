import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Calendar, Search, TrendingUp, TrendingDown, Settings } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { useTradeModal } from '@/contexts/TradeModalContext';
import { useTradesContext } from '@/contexts/TradesContext';
import { useTagsContext } from '@/contexts/TagsContext';
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
  const navigate = useNavigate();

  const [symbol, setSymbol] = useState('');
  const [side, setSide] = useState<'LONG' | 'SHORT'>('LONG');
  const [instrument, setInstrument] = useState<'Equity' | 'Futures' | 'Options' | 'Crypto'>('Equity');
  const [entries, setEntries] = useState<TradeEntry[]>([defaultEntry()]);
  const [tradeRisk, setTradeRisk] = useState(0);
  const [accountName, setAccountName] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState('trades');

  useEffect(() => {
    if (editingTrade) {
      setSymbol(editingTrade.symbol);
      setSide(editingTrade.side);
      setInstrument(editingTrade.instrument);
      setEntries(editingTrade.entries.length > 0 ? editingTrade.entries : [defaultEntry()]);
      setTradeRisk(editingTrade.tradeRisk);
      setAccountName(editingTrade.accountName);
      setSelectedTags(editingTrade.tags);
      setNotes(editingTrade.notes || '');
    } else {
      resetForm();
    }
  }, [editingTrade, isOpen]);

  const resetForm = () => {
    setSymbol('');
    setSide('LONG');
    setInstrument('Equity');
    setEntries([defaultEntry()]);
    setTradeRisk(0);
    setAccountName('');
    setSelectedTags([]);
    setNotes('');
    setActiveTab('trades');
  };

  const addEntry = () => {
    setEntries([...entries, defaultEntry()]);
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
      side,
      instrument,
      entries,
      tradeRisk,
      accountName,
      tags: selectedTags,
      notes,
    };
    return calculateTradeMetrics(formData);
  }, [symbol, side, instrument, entries, tradeRisk, accountName, selectedTags, notes]);

  const handleSubmit = () => {
    if (!symbol.trim() || entries.length === 0) return;

    const tradeData: TradeFormData = {
      symbol: symbol.trim(),
      side,
      instrument,
      entries,
      tradeRisk,
      accountName: accountName.trim(),
      tags: selectedTags,
      notes: notes.trim(),
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
      <DialogContent className="max-w-5xl p-0 bg-card border-border overflow-hidden max-h-[90vh]">
        <div className="flex h-full max-h-[85vh]">
          {/* Left Panel - Overview */}
          <div className="w-80 border-r border-border p-5 space-y-5 overflow-y-auto bg-background/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <h2 className="text-lg font-semibold">
                {editingTrade ? 'Edit Position' : 'New Position'}
              </h2>
            </div>

            {/* Win/Loss & Side Badges */}
            <div className="flex gap-2">
              <Badge 
                variant="outline" 
                className={cn(
                  "px-3 py-1",
                  isWin ? "border-profit text-profit bg-profit/10" : "border-loss text-loss bg-loss/10"
                )}
              >
                {isWin ? 'Win' : metrics.netPnl < 0 ? 'Loss' : 'Breakeven'}
              </Badge>
              <Badge variant="outline" className="px-3 py-1">
                {side}
              </Badge>
            </div>

            {/* Overview Card */}
            <div className="glass-card rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Overview</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Net</span>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "font-mono font-bold",
                      isWin ? "profit-text" : "loss-text"
                    )}>
                      ₹{metrics.netPnl.toFixed(2)}
                    </span>
                    <span className={cn(
                      "text-xs",
                      isWin ? "profit-text" : "loss-text"
                    )}>
                      {returnPercent >= 0 ? '+' : ''}{returnPercent.toFixed(2)}%
                    </span>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">R Factor</span>
                  <span className="font-mono">{metrics.rFactor.toFixed(2)}</span>
                </div>
                <div className={cn(
                  "h-1.5 rounded-full mt-2",
                  isWin ? "bg-profit" : metrics.netPnl < 0 ? "bg-loss" : "bg-muted"
                )} />
                <div className="flex justify-between text-xs text-muted-foreground pt-2">
                  <div>
                    <span className="block">Gross</span>
                    <span className="font-mono text-foreground">₹{metrics.grossPnl.toFixed(2)}</span>
                  </div>
                  <div className="text-right">
                    <span className="block">Charges</span>
                    <span className="font-mono text-foreground">₹{metrics.totalCharges.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Duration Card */}
            <div className="glass-card rounded-xl p-4 space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Duration</h3>
              <p className="text-lg font-semibold">{metrics.duration}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {metrics.openDate ? format(new Date(metrics.openDate), 'MMM dd, yyyy, HH:mm') : '-'} - {metrics.closeDate ? format(new Date(metrics.closeDate), 'MMM dd, yyyy, HH:mm') : '-'}
              </p>
            </div>

            {/* Symbol */}
            <div className="space-y-2">
              <Label className="text-sm">Symbol</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="CRUDEOIL"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  className="pl-9 bg-input border-border"
                />
              </div>
            </div>

            {/* Instrument */}
            <div className="space-y-2">
              <Label className="text-sm">Instrument</Label>
              <div className="flex flex-wrap gap-2">
                {(['Equity', 'Futures', 'Options', 'Crypto'] as const).map((type) => (
                  <Button
                    key={type}
                    type="button"
                    variant={instrument === type ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setInstrument(type)}
                    className={cn(
                      "text-xs",
                      instrument === type && "bg-primary text-primary-foreground"
                    )}
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>

            {/* Side */}
            <div className="space-y-2">
              <Label className="text-sm">Side</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={side === 'LONG' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSide('LONG')}
                  className={cn(side === 'LONG' && "bg-profit hover:bg-profit/90")}
                >
                  Long
                </Button>
                <Button
                  type="button"
                  variant={side === 'SHORT' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSide('SHORT')}
                  className={cn(side === 'SHORT' && "bg-loss hover:bg-loss/90")}
                >
                  Short
                </Button>
              </div>
            </div>

            {/* Risk */}
            <div className="space-y-2">
              <Label className="text-sm">Risk</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                <Input
                  type="number"
                  placeholder="1,000"
                  value={tradeRisk || ''}
                  onChange={(e) => setTradeRisk(parseFloat(e.target.value) || 0)}
                  className="pl-7 bg-input border-border"
                />
              </div>
            </div>

            {/* Broker Account */}
            <div className="space-y-2">
              <Label className="text-sm">Broker Account</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Account name..."
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="pl-9 bg-input border-border"
                />
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label className="text-sm">Tags</Label>
              {tags.length === 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    closeModal();
                    navigate('/settings');
                  }}
                  className="w-full text-xs"
                >
                  <Settings className="w-3 h-3 mr-2" />
                  Manage Tags
                </Button>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                      className={cn(
                        "cursor-pointer transition-all",
                        selectedTags.includes(tag) && "bg-primary text-primary-foreground"
                      )}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                  <Badge
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => {
                      closeModal();
                      navigate('/settings');
                    }}
                  >
                    <Plus className="w-3 h-3" />
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Trade Entries */}
          <div className="flex-1 p-5 overflow-y-auto flex flex-col">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="w-fit mb-4">
                <TabsTrigger value="trades">Trades</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>

              <TabsContent value="trades" className="flex-1 mt-0">
                {/* Entries Table */}
                <div className="glass-card rounded-xl overflow-hidden">
                  <div className="grid grid-cols-[100px_1fr_120px_120px_100px_50px] gap-2 p-3 text-xs text-muted-foreground border-b border-border font-medium">
                    <div>Buy / Sell</div>
                    <div>Time</div>
                    <div>Quantity</div>
                    <div>Price</div>
                    <div>Charges</div>
                    <div></div>
                  </div>
                  <div className="divide-y divide-border">
                    <AnimatePresence>
                      {entries.map((entry, index) => (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="grid grid-cols-[100px_1fr_120px_120px_100px_50px] gap-2 p-3 items-center"
                        >
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              variant={entry.type === 'BUY' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => updateEntry(entry.id, 'type', 'BUY')}
                              className={cn(
                                "h-7 px-2 text-xs",
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
                                "h-7 px-2 text-xs",
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
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹</span>
                            <Input
                              type="number"
                              placeholder="100"
                              value={entry.price || ''}
                              onChange={(e) => updateEntry(entry.id, 'price', parseFloat(e.target.value) || 0)}
                              className="pl-6 h-8 text-xs bg-input border-border"
                            />
                          </div>
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹</span>
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
                </div>

                {/* Add Trade Button */}
                <div className="flex justify-end mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addEntry}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Trade
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="notes" className="flex-1 mt-0">
                <Textarea
                  placeholder="Add notes about this trade..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[300px] bg-input border-border resize-none"
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
        </div>
      </DialogContent>
    </Dialog>
  );
};
