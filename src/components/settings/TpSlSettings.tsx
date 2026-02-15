import { useState, useEffect } from 'react';
import { Plus, MoreVertical, ExternalLink, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAccountsContext } from '@/contexts/AccountsContext';
import { useGlobalFilters } from '@/contexts/GlobalFiltersContext';
import { useTradedSymbols } from '@/hooks/useTradedSymbols';
import { useSymbolTickSize } from '@/contexts/SymbolTickSizeContext';
import { TypeableCombobox } from '@/components/trades/TypeableCombobox';
import { cn } from '@/lib/utils';

export interface TpSlRule {
  id: string;
  accountId: string;
  accountName: string;
  instrument: string;
  symbol: string;
  type: string;
  profitTargetUnit: 'tick' | 'dollar';
  profitTargetValue: number;
  stopLossUnit: 'tick' | 'dollar';
  stopLossValue: number;
  createdAt: string;
}

const STORAGE_KEY = 'trading-journal-tpsl-rules';

const loadRules = (): TpSlRule[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveRules = (rules: TpSlRule[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
};

export const TpSlSettings = () => {
  const [rules, setRules] = useState<TpSlRule[]>(loadRules);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [formAccountId, setFormAccountId] = useState('');
  const [formSymbol, setFormSymbol] = useState('');
  const [formPtUnit, setFormPtUnit] = useState<'tick' | 'dollar'>('tick');
  const [formPtValue, setFormPtValue] = useState('');
  const [formSlUnit, setFormSlUnit] = useState<'tick' | 'dollar'>('tick');
  const [formSlValue, setFormSlValue] = useState('');

  const { accounts } = useAccountsContext();
  const { selectedAccounts, isAllAccountsSelected, currencyConfig } = useGlobalFilters();
  const tradedSymbols = useTradedSymbols();
  const { setTickSize } = useSymbolTickSize();

  const activeAccounts = accounts.filter(a => !a.isArchived);

  // Auto-select account if global filter has a specific one
  useEffect(() => {
    if (showAddModal) {
      if (!isAllAccountsSelected && selectedAccounts.length === 1) {
        setFormAccountId(selectedAccounts[0]);
      }
    }
  }, [showAddModal, isAllAccountsSelected, selectedAccounts]);

  const resetForm = () => {
    setFormAccountId('');
    setFormSymbol('');
    setFormPtUnit('tick');
    setFormPtValue('');
    setFormSlUnit('tick');
    setFormSlValue('');
  };

  const handleSave = () => {
    if (!formAccountId || !formSymbol) return;
    const account = accounts.find(a => a.id === formAccountId);
    if (!account) return;

    const newRule: TpSlRule = {
      id: crypto.randomUUID(),
      accountId: formAccountId,
      accountName: account.name,
      instrument: '—',
      symbol: formSymbol,
      type: 'Standard',
      profitTargetUnit: formPtUnit,
      profitTargetValue: parseFloat(formPtValue) || 0,
      stopLossUnit: formSlUnit,
      stopLossValue: parseFloat(formSlValue) || 0,
      createdAt: new Date().toISOString(),
    };

    // Register new symbol in tick-size registry with default value
    if (!tradedSymbols.includes(formSymbol)) {
      setTickSize(formSymbol, 0.01);
    }

    const updated = [...rules, newRule];
    setRules(updated);
    saveRules(updated);
    resetForm();
    setShowAddModal(false);
  };

  const handleAddNewSymbol = (symbol: string) => {
    setFormSymbol(symbol);
  };

  const formatValue = (unit: 'tick' | 'dollar', value: number) => {
    if (unit === 'dollar') return `${currencyConfig.symbol}${value}`;
    return `${value} tick${value !== 1 ? 's' : ''}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">TP / SL Settings</h2>
                <a href="#" className="text-xs text-primary hover:underline flex items-center gap-1">
                  Learn more <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-sm text-muted-foreground">Define profit target and stop loss rules per symbol</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => { resetForm(); setShowAddModal(true); }} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add rule
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover border-border">
                <DropdownMenuItem disabled className="opacity-50 cursor-not-allowed">Options coming soon</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Table */}
        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead>Account</TableHead>
                <TableHead>Instrument</TableHead>
                <TableHead>Symbols</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Profit Targets</TableHead>
                <TableHead>Stop Losses</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    <Target className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No TP / SL rules defined yet</p>
                    <p className="text-xs mt-1">Click "Add rule" to create your first rule</p>
                  </TableCell>
                </TableRow>
              ) : (
                rules.map((rule) => (
                  <TableRow key={rule.id} className="border-border">
                    <TableCell className="font-medium">{rule.accountName}</TableCell>
                    <TableCell className="text-muted-foreground">{rule.instrument}</TableCell>
                    <TableCell>{rule.symbol}</TableCell>
                    <TableCell>{rule.type}</TableCell>
                    <TableCell className="text-profit">{formatValue(rule.profitTargetUnit, rule.profitTargetValue)}</TableCell>
                    <TableCell className="text-loss">{formatValue(rule.stopLossUnit, rule.stopLossValue)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border-border">
                          <DropdownMenuItem disabled className="opacity-50 cursor-not-allowed">Edit</DropdownMenuItem>
                          <DropdownMenuItem disabled className="opacity-50 cursor-not-allowed">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add Rule Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add TP / SL Rule</DialogTitle>
            <DialogDescription>Define profit target and stop loss for a symbol</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Account */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Account</label>
              <Select value={formAccountId} onValueChange={setFormAccountId}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {activeAccounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Instrument (disabled) */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Instrument</label>
              <Input disabled placeholder="Coming soon" className="bg-muted/30 border-border opacity-50 cursor-not-allowed" />
            </div>

            {/* Symbol */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Symbol</label>
              <TypeableCombobox
                value={formSymbol}
                onChange={setFormSymbol}
                options={tradedSymbols}
                onAddNew={handleAddNewSymbol}
                placeholder="Select or type symbol..."
              />
            </div>

            {/* Profit Target / Stop Loss side by side */}
            <div className="grid grid-cols-2 gap-4">
              {/* Profit Target */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-profit">Profit Target</label>
                <Select value={formPtUnit} onValueChange={(v) => setFormPtUnit(v as 'tick' | 'dollar')}>
                  <SelectTrigger className="bg-input border-border h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tick">Tick / Pip</SelectItem>
                    <SelectItem value="dollar">{currencyConfig.symbol}</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Value"
                  value={formPtValue}
                  onChange={e => setFormPtValue(e.target.value)}
                  className="bg-input border-border"
                />
              </div>

              {/* Stop Loss */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-loss">Stop Loss</label>
                <Select value={formSlUnit} onValueChange={(v) => setFormSlUnit(v as 'tick' | 'dollar')}>
                  <SelectTrigger className="bg-input border-border h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tick">Tick / Pip</SelectItem>
                    <SelectItem value="dollar">{currencyConfig.symbol}</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Value"
                  value={formSlValue}
                  onChange={e => setFormSlValue(e.target.value)}
                  className="bg-input border-border"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={resetForm}>Reset</Button>
            <Button onClick={handleSave} disabled={!formAccountId || !formSymbol}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
