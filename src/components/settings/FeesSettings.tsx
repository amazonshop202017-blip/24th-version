import { useState, useEffect } from 'react';
import { Plus, MoreVertical, ExternalLink, DollarSign, Edit2, Trash2 } from 'lucide-react';
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

export interface FeeRule {
  id: string;
  accountId: string;
  accountName: string;
  instrument: string;
  symbol: string;
  mode: 'per-contract' | 'per-execution';
  apply: 'all' | 'entry-only' | 'exit-only';
  feeValue: number;
  createdAt: string;
}

const STORAGE_KEY = 'trading-journal-fee-rules';

const loadRules = (): FeeRule[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveRules = (rules: FeeRule[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
};

const MODE_LABELS: Record<FeeRule['mode'], string> = {
  'per-contract': 'Per Contract / Lot',
  'per-execution': 'Per Execution',
};

const APPLY_LABELS: Record<FeeRule['apply'], string> = {
  'all': 'On All Executions',
  'entry-only': 'On Entry Only',
  'exit-only': 'On Exits Only',
};

export const FeesSettings = () => {
  const [rules, setRules] = useState<FeeRule[]>(loadRules);
  const [showModal, setShowModal] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  // Form state
  const [formAccountId, setFormAccountId] = useState('');
  const [formSymbol, setFormSymbol] = useState('');
  const [formMode, setFormMode] = useState<FeeRule['mode']>('per-contract');
  const [formApply, setFormApply] = useState<FeeRule['apply']>('all');
  const [formFeeValue, setFormFeeValue] = useState('');

  const { accounts } = useAccountsContext();
  const { selectedAccounts, isAllAccountsSelected, currencyConfig } = useGlobalFilters();
  const tradedSymbols = useTradedSymbols();
  const { setTickSize } = useSymbolTickSize();

  const activeAccounts = accounts.filter(a => !a.isArchived);

  useEffect(() => {
    if (showModal && !editingRuleId) {
      if (!isAllAccountsSelected && selectedAccounts.length === 1) {
        setFormAccountId(selectedAccounts[0]);
      }
    }
  }, [showModal, isAllAccountsSelected, selectedAccounts, editingRuleId]);

  const resetForm = () => {
    setFormAccountId('');
    setFormSymbol('');
    setFormMode('per-contract');
    setFormApply('all');
    setFormFeeValue('');
  };

  const handleSave = () => {
    if (!formAccountId || !formSymbol) return;
    const account = accounts.find(a => a.id === formAccountId);
    if (!account) return;

    if (!tradedSymbols.includes(formSymbol)) {
      setTickSize(formSymbol, 0.01);
    }

    if (editingRuleId) {
      const updated = rules.map(r =>
        r.id === editingRuleId
          ? {
              ...r,
              accountId: formAccountId,
              accountName: account.name,
              symbol: formSymbol,
              mode: formMode,
              apply: formApply,
              feeValue: parseFloat(formFeeValue) || 0,
            }
          : r
      );
      setRules(updated);
      saveRules(updated);
    } else {
      const newRule: FeeRule = {
        id: crypto.randomUUID(),
        accountId: formAccountId,
        accountName: account.name,
        instrument: '—',
        symbol: formSymbol,
        mode: formMode,
        apply: formApply,
        feeValue: parseFloat(formFeeValue) || 0,
        createdAt: new Date().toISOString(),
      };
      const updated = [...rules, newRule];
      setRules(updated);
      saveRules(updated);
    }

    resetForm();
    setEditingRuleId(null);
    setShowModal(false);
  };

  const handleEdit = (rule: FeeRule) => {
    setEditingRuleId(rule.id);
    setFormAccountId(rule.accountId);
    setFormSymbol(rule.symbol);
    setFormMode(rule.mode);
    setFormApply(rule.apply);
    setFormFeeValue(rule.feeValue.toString());
    setShowModal(true);
  };

  const handleDelete = (ruleId: string) => {
    if (!window.confirm('Are you sure you want to delete this fee rule?')) return;
    const updated = rules.filter(r => r.id !== ruleId);
    setRules(updated);
    saveRules(updated);
  };

  const handleAddNewSymbol = (symbol: string) => {
    setFormSymbol(symbol);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">Default commission and fees</h2>
                <a href="#" className="text-xs text-primary hover:underline flex items-center gap-1">
                  Learn more <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-sm text-muted-foreground">Define default fee rules per symbol</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => { resetForm(); setEditingRuleId(null); setShowModal(true); }} size="sm">
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
                <TableHead>Symbol</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Apply</TableHead>
                <TableHead>Fee, {currencyConfig.symbol}</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No fee rules defined yet</p>
                    <p className="text-xs mt-1">Click "Add rule" to create your first fee rule</p>
                  </TableCell>
                </TableRow>
              ) : (
                rules.map((rule) => (
                  <TableRow key={rule.id} className="border-border">
                    <TableCell className="font-medium">{rule.accountName}</TableCell>
                    <TableCell className="text-muted-foreground">{rule.instrument}</TableCell>
                    <TableCell>{rule.symbol}</TableCell>
                    <TableCell>{MODE_LABELS[rule.mode]}</TableCell>
                    <TableCell>{APPLY_LABELS[rule.apply]}</TableCell>
                    <TableCell>{currencyConfig.symbol}{rule.feeValue}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border-border">
                          <DropdownMenuItem onClick={() => handleEdit(rule)} className="cursor-pointer">
                            <Edit2 className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(rule.id)} className="cursor-pointer text-loss">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
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

      {/* Add/Edit Rule Modal */}
      <Dialog open={showModal} onOpenChange={(open) => { setShowModal(open); if (!open) setEditingRuleId(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingRuleId ? 'Edit Fee Rule' : 'Add Fee Rule'}</DialogTitle>
            <DialogDescription>{editingRuleId ? 'Update fee rule values' : 'Define a default fee rule for a symbol'}</DialogDescription>
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

            {/* Mode */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Mode</label>
              <Select value={formMode} onValueChange={(v) => setFormMode(v as FeeRule['mode'])}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="per-contract">Per Contract / Lot</SelectItem>
                  <SelectItem value="per-execution">Per Execution</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Apply */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Apply</label>
              <Select value={formApply} onValueChange={(v) => setFormApply(v as FeeRule['apply'])}>
                <SelectTrigger className="bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">On All Executions</SelectItem>
                  <SelectItem value="entry-only">On Entry Only</SelectItem>
                  <SelectItem value="exit-only">On Exits Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fee Value */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Fee, {currencyConfig.symbol}</label>
              <Input
                type="number"
                min="0"
                step="any"
                placeholder={`${currencyConfig.symbol} value`}
                value={formFeeValue}
                onChange={e => setFormFeeValue(e.target.value)}
                className="bg-input border-border"
              />
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
