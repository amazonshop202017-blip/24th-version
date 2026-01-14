import { useEffect, useState, useMemo, useRef } from 'react';
import { X, Calendar, Star, Settings2, Clock, ChevronDown, Check } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useTradeModal } from '@/contexts/TradeModalContext';
import { useTradesContext } from '@/contexts/TradesContext';
import { useStrategiesContext } from '@/contexts/StrategiesContext';
import { useAccountsContext } from '@/contexts/AccountsContext';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { TradeFormData, TradeEntry, calculateTradeMetrics } from '@/types/trade';
import { cn } from '@/lib/utils';

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
  const { strategies, getStrategyById } = useStrategiesContext();
  const { accounts } = useAccountsContext();
  const { currencyConfig } = useGlobalFilters();

  // Form state
  const [activeTab, setActiveTab] = useState('regular');
  const [instrument, setInstrument] = useState<'Equity' | 'Futures' | 'Options' | 'Crypto'>('Equity');
  const [strategyId, setStrategyId] = useState<string>('');
  const [direction, setDirection] = useState<'LONG' | 'SHORT'>('LONG');
  
  // Trade Entry fields
  const [entryDate, setEntryDate] = useState('');
  const [entryPrice, setEntryPrice] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  
  // Trade Exit fields
  const [exitDate, setExitDate] = useState('');
  const [exitPrice, setExitPrice] = useState<string>('');
  const [fees, setFees] = useState<string>('');
  const [manualGrossPnl, setManualGrossPnl] = useState<string>('');
  
  // Additional fields
  const [symbol, setSymbol] = useState('');
  const [accountName, setAccountName] = useState('');
  const [notes, setNotes] = useState('');
  const [tradeRisk, setTradeRisk] = useState(0);
  const [tradeTarget, setTradeTarget] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedChecklistItems, setSelectedChecklistItems] = useState<string[]>([]);
  
  // Hidden fields for compatibility
  const [entries, setEntries] = useState<TradeEntry[]>([defaultEntry()]);
  const [positionMAE, setPositionMAE] = useState(0);
  const [positionMFE, setPositionMFE] = useState(0);
  const [potentialMAE, setPotentialMAE] = useState(0);
  const [potentialMFE, setPotentialMFE] = useState(0);
  const [missedTrade, setMissedTrade] = useState(false);

  // Get current strategy's checklist items
  const currentStrategyChecklist = useMemo(() => {
    if (!strategyId) return [];
    const strategy = getStrategyById(strategyId);
    return strategy?.checklistItems || [];
  }, [strategyId, getStrategyById]);

  // Sync simplified fields to entries format
  useEffect(() => {
    const newEntries: TradeEntry[] = [];
    const entryPriceNum = parseFloat(entryPrice) || 0;
    const quantityNum = parseFloat(quantity) || 0;
    const exitPriceNum = parseFloat(exitPrice) || 0;
    const feesNum = parseFloat(fees) || 0;
    
    // Entry transaction
    if (entryDate && entryPriceNum >= 0 && quantityNum > 0) {
      newEntries.push({
        id: entries[0]?.id || crypto.randomUUID(),
        type: direction === 'LONG' ? 'BUY' : 'SELL',
        datetime: entryDate,
        quantity: quantityNum,
        price: entryPriceNum,
        charges: 0,
      });
    }
    
    // Exit transaction
    if (exitDate && exitPriceNum >= 0 && quantityNum > 0) {
      newEntries.push({
        id: entries[1]?.id || crypto.randomUUID(),
        type: direction === 'LONG' ? 'SELL' : 'BUY',
        datetime: exitDate,
        quantity: quantityNum,
        price: exitPriceNum,
        charges: feesNum,
      });
    }
    
    if (newEntries.length > 0) {
      setEntries(newEntries);
    }
  }, [entryDate, entryPrice, quantity, exitDate, exitPrice, fees, direction]);

  // Reset checklist items when strategy changes
  useEffect(() => {
    if (!editingTrade) {
      setSelectedChecklistItems([]);
    }
  }, [strategyId]);

  useEffect(() => {
    if (editingTrade) {
      setSymbol(editingTrade.symbol);
      setInstrument(editingTrade.instrument);
      setAccountName(editingTrade.accountName);
      setStrategyId(editingTrade.strategyId || '');
      setSelectedTags(editingTrade.tags);
      setSelectedChecklistItems(editingTrade.selectedChecklistItems || []);
      setNotes(editingTrade.notes || '');
      setTradeRisk(editingTrade.tradeRisk);
      setTradeTarget(editingTrade.tradeTarget || 0);
      setStopLoss(editingTrade.stopLoss !== undefined ? editingTrade.stopLoss.toString() : '');
      setTakeProfit(editingTrade.takeProfit !== undefined ? editingTrade.takeProfit.toString() : '');
      setPositionMAE(editingTrade.positionMAE || 0);
      setPositionMFE(editingTrade.positionMFE || 0);
      setPotentialMAE(editingTrade.potentialMAE || 0);
      setPotentialMFE(editingTrade.potentialMFE || 0);
      setMissedTrade(editingTrade.missedTrade || false);
      
      // Parse entries to simplified format
      if (editingTrade.entries.length > 0) {
        const sortedEntries = [...editingTrade.entries].sort((a, b) => 
          new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
        );
        
        const firstEntry = sortedEntries[0];
        const lastEntry = sortedEntries.length > 1 ? sortedEntries[sortedEntries.length - 1] : null;
        
        // Determine direction from first entry
        setDirection(firstEntry.type === 'BUY' ? 'LONG' : 'SHORT');
        setEntryDate(firstEntry.datetime);
        setEntryPrice(firstEntry.price.toString());
        setQuantity(firstEntry.quantity.toString());
        
        if (lastEntry && lastEntry.id !== firstEntry.id) {
          setExitDate(lastEntry.datetime);
          setExitPrice(lastEntry.price.toString());
          setFees(lastEntry.charges.toString());
        }
        
        setEntries(editingTrade.entries);
      }

      // Set manual gross P/L if it exists
      if (editingTrade.manualGrossPnl !== undefined) {
        setManualGrossPnl(editingTrade.manualGrossPnl.toString());
      }
    } else {
      resetForm();
    }
  }, [editingTrade, isOpen]);

  const resetForm = () => {
    setActiveTab('regular');
    setSymbol('');
    setInstrument('Equity');
    setAccountName('');
    setStrategyId('');
    setSelectedTags([]);
    setSelectedChecklistItems([]);
    setNotes('');
    setDirection('LONG');
    setEntryDate(new Date().toISOString().slice(0, 16));
    setEntryPrice('');
    setQuantity('');
    setStopLoss('');
    setTakeProfit('');
    setExitDate('');
    setExitPrice('');
    setFees('');
    setManualGrossPnl('');
    setTradeRisk(0);
    setTradeTarget(0);
    setEntries([defaultEntry()]);
    setPositionMAE(0);
    setPositionMFE(0);
    setPotentialMAE(0);
    setPotentialMFE(0);
    setMissedTrade(false);
  };

  const metrics = useMemo(() => {
    const formData: TradeFormData = {
      symbol,
      side: direction,
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
  }, [symbol, direction, instrument, entries, tradeRisk, tradeTarget, accountName, strategyId, selectedTags, notes, positionMAE, positionMFE, potentialMAE, potentialMFE, missedTrade]);

  // Calculate actual gross and net P/L
  const effectiveGrossPnl = manualGrossPnl !== '' ? parseFloat(manualGrossPnl) || 0 : metrics.grossPnl;
  const effectiveNetPnl = effectiveGrossPnl - (parseFloat(fees) || 0);

  // Calculate duration
  const durationFormatted = useMemo(() => {
    if (!entryDate || !exitDate) return '—';
    const entryTime = new Date(entryDate).getTime();
    const exitTime = new Date(exitDate).getTime();
    if (isNaN(entryTime) || isNaN(exitTime) || exitTime < entryTime) return '—';
    
    const diffMs = exitTime - entryTime;
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const days = Math.floor(totalMinutes / (60 * 24));
    const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
    const mins = totalMinutes % 60;
    
    return `${days}D ${hours}H ${mins}M`;
  }, [entryDate, exitDate]);

  // Validation - minimum required fields
  const canSave = symbol.trim() && entryDate && (parseFloat(entryPrice) >= 0) && (parseFloat(quantity) > 0);

  const handleSubmit = () => {
    if (!canSave) return;

    const tradeData: TradeFormData = {
      symbol: symbol.trim(),
      side: direction,
      instrument,
      entries,
      tradeRisk,
      tradeTarget,
      accountName: accountName.trim(),
      strategyId: strategyId || undefined,
      selectedChecklistItems,
      tags: selectedTags,
      notes: notes.trim(),
      stopLoss: stopLoss !== '' ? parseFloat(stopLoss) : undefined,
      takeProfit: takeProfit !== '' ? parseFloat(takeProfit) : undefined,
      positionMAE,
      positionMFE,
      potentialMAE,
      potentialMFE,
      missedTrade,
      manualGrossPnl: manualGrossPnl !== '' ? parseFloat(manualGrossPnl) : undefined,
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

  const toggleChecklistItem = (item: string) => {
    setSelectedChecklistItems(prev => 
      prev.includes(item) 
        ? prev.filter(i => i !== item)
        : [...prev, item]
    );
  };

  // Calculated summary metrics - Fixed calculations
  const rrrCalculated = useMemo(() => {
    const entry = parseFloat(entryPrice) || 0;
    const sl = parseFloat(stopLoss) || 0;
    const tp = parseFloat(takeProfit) || 0;
    
    if (entry <= 0 || sl <= 0 || tp <= 0) return null;
    
    let risk: number;
    let reward: number;
    
    if (direction === 'LONG') {
      risk = entry - sl;
      reward = tp - entry;
    } else {
      risk = sl - entry;
      reward = entry - tp;
    }
    
    // Avoid division by zero
    if (risk <= 0) return null;
    
    return reward / risk;
  }, [entryPrice, stopLoss, takeProfit, direction]);

  const rMultipleCalculated = useMemo(() => {
    const entry = parseFloat(entryPrice) || 0;
    const sl = parseFloat(stopLoss) || 0;
    const exit = parseFloat(exitPrice) || 0;
    
    // Require exit price for R-Multiple
    if (entry <= 0 || sl <= 0 || exit <= 0) return null;
    
    let risk: number;
    let realizedPnl: number;
    
    if (direction === 'LONG') {
      risk = entry - sl;
      realizedPnl = exit - entry;
    } else {
      risk = sl - entry;
      realizedPnl = entry - exit;
    }
    
    // Avoid division by zero
    if (risk <= 0) return null;
    
    return realizedPnl / risk;
  }, [entryPrice, stopLoss, exitPrice, direction]);

  const returnPercent = metrics.returnPercent.toFixed(2) + '%';

  // Checklist dropdown state
  const [checklistOpen, setChecklistOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleDiscard()}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-[520px] p-0 flex flex-col bg-background border-l border-border overflow-hidden"
      >
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-muted-foreground" />
              <SheetTitle className="text-lg font-semibold">
                {editingTrade ? `Edit Trade #${editingTrade.id.slice(0, 7)}` : 'Add Trade'}
              </SheetTitle>
              <Settings2 className="w-4 h-4 text-muted-foreground" />
            </div>
            <button
              onClick={handleDiscard}
              className="p-1.5 rounded-md hover:bg-muted/50 transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </SheetHeader>

        {/* Tabs */}
        <div className="px-6 pt-4 flex-shrink-0">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-3 h-10 bg-muted/50">
              <TabsTrigger value="regular" className="text-sm">Regular Data</TabsTrigger>
              <TabsTrigger value="advanced" className="text-sm">Advanced Data</TabsTrigger>
              <TabsTrigger value="screenshots" className="text-sm">Screenshots</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {activeTab === 'regular' && (
            <div className="space-y-6">
              {/* General Trade Data Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-foreground">General Trade Data</h3>
                
                {/* Entry Date */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Entry Date *</Label>
                  <div className="relative">
                    <Input
                      type="datetime-local"
                      value={entryDate}
                      onChange={(e) => setEntryDate(e.target.value)}
                      className="h-10 bg-input border-border pr-10"
                    />
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                {/* Instrument - Free text input */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Instrument *</Label>
                  <Input
                    type="text"
                    placeholder="e.g., EURUSD, CL, WTI, AAPL..."
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    className="h-10 bg-input border-border"
                  />
                </div>

                {/* Setup & Checklist - Same Row 50/50 */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Setup</Label>
                    <Select value={strategyId || "none"} onValueChange={(val) => setStrategyId(val === "none" ? "" : val)}>
                      <SelectTrigger className="h-10 bg-input border-border">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {strategies.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Checklist Dropdown */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Checklist</Label>
                    <Popover open={checklistOpen} onOpenChange={setChecklistOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={checklistOpen}
                          className="h-10 w-full justify-between bg-input border-border font-normal"
                          disabled={!strategyId || currentStrategyChecklist.length === 0}
                        >
                          <span className="truncate text-sm">
                            {!strategyId ? 'Select setup first' : 
                              currentStrategyChecklist.length === 0 ? 'No items' :
                              selectedChecklistItems.length === 0 ? 'Select items...' :
                              `${selectedChecklistItems.length} of ${currentStrategyChecklist.length} selected`}
                          </span>
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0 bg-popover border-border z-50" align="start">
                        <div className="max-h-48 overflow-y-auto p-2 space-y-1">
                          {currentStrategyChecklist.map((item, index) => (
                            <div 
                              key={index} 
                              className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                              onClick={() => toggleChecklistItem(item)}
                            >
                              <Checkbox
                                id={`checklist-dropdown-${index}`}
                                checked={selectedChecklistItems.includes(item)}
                                onCheckedChange={() => toggleChecklistItem(item)}
                                className="pointer-events-none"
                              />
                              <label 
                                className="text-sm cursor-pointer flex-1 select-none"
                              >
                                {item}
                              </label>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              {/* Direction Section */}
              <div className="space-y-3">
                <Label className="text-xs text-muted-foreground">Direction *</Label>
                <div className="grid grid-cols-2 gap-0 border border-border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setDirection('LONG')}
                    className={cn(
                      "h-10 text-sm font-medium transition-colors",
                      direction === 'LONG'
                        ? "bg-foreground text-background"
                        : "bg-background text-foreground hover:bg-muted/50"
                    )}
                  >
                    Long
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirection('SHORT')}
                    className={cn(
                      "h-10 text-sm font-medium transition-colors border-l border-border",
                      direction === 'SHORT'
                        ? "bg-foreground text-background"
                        : "bg-background text-foreground hover:bg-muted/50"
                    )}
                  >
                    Short
                  </button>
                </div>
              </div>

              {/* Trade Entry & Exit Side by Side */}
              <div className="grid grid-cols-2 gap-4">
                {/* Trade Entry */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-foreground">Trade Entry</h4>
                  
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Entry Price *</Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={entryPrice}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                          setEntryPrice(val);
                        }
                      }}
                      className="h-10 bg-input border-border"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Quantity *</Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={quantity}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                          setQuantity(val);
                        }
                      }}
                      className="h-10 bg-input border-border"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Stop Loss</Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={stopLoss}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                          setStopLoss(val);
                        }
                      }}
                      className="h-10 bg-input border-border"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Take Profit</Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={takeProfit}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                          setTakeProfit(val);
                        }
                      }}
                      className="h-10 bg-input border-border"
                    />
                  </div>
                </div>

                {/* Trade Exit */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-foreground">Trade Exit</h4>
                  
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Exit Date</Label>
                    <div className="relative">
                      <Input
                        type="datetime-local"
                        value={exitDate}
                        onChange={(e) => setExitDate(e.target.value)}
                        className="h-10 bg-input border-border pr-10"
                      />
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Exit Price</Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={exitPrice}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^\d*\.?\d*$/.test(val)) {
                          setExitPrice(val);
                        }
                      }}
                      className="h-10 bg-input border-border"
                    />
                  </div>

                  {/* Gross P/L - Editable, comes before Net P/L */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Gross P/L</Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder={metrics.grossPnl.toFixed(2)}
                      value={manualGrossPnl}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
                          setManualGrossPnl(val);
                        }
                      }}
                      className="h-10 bg-input border-border"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Net P/L - Read-only, calculated */}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Net P/L</Label>
                      <Input
                        type="text"
                        value={`${currencyConfig.symbol}${effectiveNetPnl.toFixed(2)}`}
                        readOnly
                        className="h-10 bg-muted/50 border-border text-muted-foreground text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Fees</Label>
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={fees}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || /^\d*\.?\d*$/.test(val)) {
                            setFees(val);
                          }
                        }}
                        className="h-10 bg-input border-border text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Notes Section */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-foreground">Personal Notes</h4>
                <Textarea
                  placeholder="Add notes about this trade..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-[100px] bg-input border-border resize-none"
                />
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <p className="text-sm">Advanced Data - Coming Soon</p>
            </div>
          )}

          {activeTab === 'screenshots' && (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <p className="text-sm">Screenshots - Coming Soon</p>
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="flex-shrink-0 border-t border-border px-6 py-4 bg-background">
          <div className="flex items-center justify-between">
            {/* Left - Action Buttons */}
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleSubmit}
                disabled={!canSave}
                className="h-9 px-6 bg-foreground text-background hover:bg-foreground/90"
              >
                Save
              </Button>
              <Button 
                variant="outline" 
                onClick={handleDiscard}
                className="h-9 px-6"
              >
                Cancel
              </Button>
            </div>

            {/* Right - Summary Metrics */}
            <div className="flex items-center gap-4 text-sm">
              <div className="text-center">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Duration
                </p>
                <p className="font-semibold text-xs">{durationFormatted}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">RRR</p>
                <p className="font-semibold">{rrrCalculated !== null ? rrrCalculated.toFixed(1) : '—'}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">R-Multiple</p>
                <p className="font-semibold">{rMultipleCalculated !== null ? rMultipleCalculated.toFixed(2) : '—'}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Return</p>
                <p className="font-semibold">{returnPercent}</p>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
