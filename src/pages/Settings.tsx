import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Check, X, Tag, Wallet, TrendingUp, TrendingDown, Settings as SettingsIcon, Download, DollarSign, FolderOpen, Archive, ArchiveRestore, ChevronDown, ChevronUp, Target, MessageSquare, Ruler, MoreVertical, ArrowRightLeft, Eraser, LogOut, Image } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAccountsContext } from '@/contexts/AccountsContext';
import { useTradesContext } from '@/contexts/TradesContext';
import { useGlobalFilters, CurrencyCode, CURRENCIES, BreakevenToleranceType } from '@/contexts/GlobalFiltersContext';
import { cn } from '@/lib/utils';
import DepositWithdrawModal from '@/components/settings/DepositWithdrawModal';
import { CategoriesManagement } from '@/components/settings/CategoriesManagement';
import { TagsManagement } from '@/components/settings/TagsManagement';
import { ScreenshotTagsManagement } from '@/components/settings/ScreenshotTagsManagement';
import { TradeCommentsManagement } from '@/components/settings/TradeCommentsManagement';
import { AccountImportModal } from '@/components/settings/AccountImportModal';
import { SymbolTickSizeManagement } from '@/components/settings/SymbolTickSizeManagement';
import { TpSlSettings } from '@/components/settings/TpSlSettings';
import { FeesSettings } from '@/components/settings/FeesSettings';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const Settings = () => {
  const { accounts, addAccount, updateAccount, getActiveAccountsWithStats, getArchivedAccountsWithStats, archiveAccount, unarchiveAccount, deleteAccountPermanently, addTransaction, getTransactionsForAccount } = useAccountsContext();
  const { trades, deleteTradesByAccountId, deleteTradesByAccountName } = useTradesContext();
  const { logout } = useAuth();
  const { currency, setCurrency, currencyConfig, breakevenTolerance, setBreakevenTolerance } = useGlobalFilters();

  const handleCurrencyChange = (newCurrency: CurrencyCode) => {
    setCurrency(newCurrency);
  };

  // Breakeven tolerance local state for input
  const [toleranceValue, setToleranceValue] = useState(breakevenTolerance.value.toString());
  
  const handleToleranceTypeChange = (type: BreakevenToleranceType) => {
    setBreakevenTolerance({
      ...breakevenTolerance,
      type,
    });
  };
  
  const handleToleranceValueChange = (value: string) => {
    setToleranceValue(value);
    const numValue = parseFloat(value) || 0;
    setBreakevenTolerance({
      ...breakevenTolerance,
      value: Math.max(0, numValue), // Ensure non-negative
    });
  };
  
  const handleBreakevenModeChange = (mode: 'automatic' | 'manual') => {
    setBreakevenTolerance({
      ...breakevenTolerance,
      mode,
    });
  };

  // Settings tab state - now with 4 tabs
  const [activeSettingsTab, setActiveSettingsTab] = useState<'main' | 'accounts' | 'custom-tags' | 'trade-comments' | 'symbol-tick' | 'tpsl' | 'fees'>('main');
  
  // Custom Tags sub-tab state
  const [activeTagsSubTab, setActiveTagsSubTab] = useState<'categories' | 'tags' | 'screenshot-tags'>('categories');

  // Account state
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountBalance, setNewAccountBalance] = useState('');
  const [editingAccount, setEditingAccount] = useState<string | null>(null);
  const [editAccountName, setEditAccountName] = useState('');
  const [editAccountBalance, setEditAccountBalance] = useState('');
  
  // Deposit/Withdraw modal state
  const [depositWithdrawAccountId, setDepositWithdrawAccountId] = useState<string | null>(null);

  // Import modal state
  const [showImportModal, setShowImportModal] = useState(false);

  // Archived accounts toggle
  const [showArchivedAccounts, setShowArchivedAccounts] = useState(false);


  const activeAccountsWithStats = getActiveAccountsWithStats();
  const archivedAccountsWithStats = getArchivedAccountsWithStats();

  // Account handlers
  const handleAddAccount = () => {
    if (newAccountName.trim() && newAccountBalance) {
      addAccount(newAccountName.trim(), parseFloat(newAccountBalance) || 0);
      setNewAccountName('');
      setNewAccountBalance('');
    }
  };

  const handleAccountKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddAccount();
    }
  };

  const startEditingAccount = (account: { id: string; name: string; startingBalance: number }) => {
    setEditingAccount(account.id);
    setEditAccountName(account.name);
    setEditAccountBalance(account.startingBalance.toString());
  };

  const saveAccountEdit = () => {
    if (editingAccount && editAccountName.trim()) {
      updateAccount(editingAccount, editAccountName.trim(), parseFloat(editAccountBalance) || 0);
    }
    setEditingAccount(null);
    setEditAccountName('');
    setEditAccountBalance('');
  };

  const cancelAccountEdit = () => {
    setEditingAccount(null);
    setEditAccountName('');
    setEditAccountBalance('');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your trading journal configuration</p>
      </div>

      {/* Settings Navigation Menu */}
      <div className="flex gap-2 p-1 bg-muted/30 rounded-lg w-fit">
        <button
          onClick={() => setActiveSettingsTab('main')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
            activeSettingsTab === 'main'
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
          )}
        >
          <SettingsIcon className="w-4 h-4" />
          Main
        </button>
        <button
          onClick={() => setActiveSettingsTab('accounts')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
            activeSettingsTab === 'accounts'
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
          )}
        >
          <Wallet className="w-4 h-4" />
          Accounts
        </button>
        <button
          onClick={() => setActiveSettingsTab('custom-tags')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
            activeSettingsTab === 'custom-tags'
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
          )}
        >
          <Tag className="w-4 h-4" />
          Custom Tags
        </button>
        <button
          onClick={() => setActiveSettingsTab('trade-comments')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
            activeSettingsTab === 'trade-comments'
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
          )}
        >
          <MessageSquare className="w-4 h-4" />
          Trade Comments
        </button>
        <button
          onClick={() => setActiveSettingsTab('symbol-tick')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
            activeSettingsTab === 'symbol-tick'
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
          )}
        >
          <Ruler className="w-4 h-4" />
          Symbol Tick / Pip
        </button>
        <button
          onClick={() => setActiveSettingsTab('tpsl')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
            activeSettingsTab === 'tpsl'
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
          )}
        >
          <Target className="w-4 h-4" />
          TP / SL Settings
        </button>
        <button
          onClick={() => setActiveSettingsTab('fees')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
            activeSettingsTab === 'fees'
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
          )}
        >
          <DollarSign className="w-4 h-4" />
          Fees Settings
        </button>
      </div>

      {/* Main Tab Content */}
      {activeSettingsTab === 'main' && (
        <>
          {/* Currency Section */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Currency Settings</h2>
                <p className="text-sm text-muted-foreground">Set your preferred display currency for the journal</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Display Currency:</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 bg-background border-border min-w-[120px]">
                    <span className="text-lg font-semibold">{currencyConfig.symbol}</span>
                    <span>{currency}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="bg-popover border-border z-50">
                  {Object.entries(CURRENCIES).map(([code, config]) => (
                    <DropdownMenuItem
                      key={code}
                      onClick={() => handleCurrencyChange(code as CurrencyCode)}
                      className={cn(
                        "flex items-center gap-2 cursor-pointer",
                        currency === code && "bg-accent"
                      )}
                    >
                      <span className="w-6 text-center font-semibold">{config.symbol}</span>
                      <span>{code}</span>
                      {currency === code && <Check className="w-4 h-4 ml-auto" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Breakeven Tolerance Section */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Breakeven Tolerance</h2>
                <p className="text-sm text-muted-foreground">Define how breakeven trades are classified</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {/* Classification Mode */}
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground min-w-[120px]">Classification Mode:</span>
                <Select
                  value={breakevenTolerance.mode}
                  onValueChange={(value) => handleBreakevenModeChange(value as 'automatic' | 'manual')}
                >
                  <SelectTrigger className="w-[200px] bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="automatic">Automatic (Tolerance)</SelectItem>
                    <SelectItem value="manual">Manual (Trade-Level)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Only show tolerance settings in Automatic mode */}
              {breakevenTolerance.mode === 'automatic' && (
                <>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground min-w-[120px]">Tolerance Type:</span>
                    <Select
                      value={breakevenTolerance.type}
                      onValueChange={(value) => handleToleranceTypeChange(value as BreakevenToleranceType)}
                    >
                      <SelectTrigger className="w-[180px] bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="amount">Amount ({currencyConfig.symbol})</SelectItem>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground min-w-[120px]">Tolerance Value:</span>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        {breakevenTolerance.type === 'amount' ? `±${currencyConfig.symbol}` : '±'}
                      </span>
                      <Input
                        type="number"
                        min="0"
                        step={breakevenTolerance.type === 'amount' ? '1' : '0.01'}
                        placeholder="0"
                        value={toleranceValue}
                        onChange={(e) => handleToleranceValueChange(e.target.value)}
                        className="bg-input border-border w-40 pl-10"
                      />
                      {breakevenTolerance.type === 'percentage' && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                      )}
                    </div>
                  </div>
                </>
              )}
              
              <div className="mt-2 p-3 bg-muted/30 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  {breakevenTolerance.mode === 'manual' ? (
                    <>
                      Trades are classified as <span className="text-primary font-medium">breakeven</span> based on the "Breakeven" toggle in the Add/Edit Trade popup. Tolerance settings are ignored.
                    </>
                  ) : breakevenTolerance.type === 'amount' ? (
                    <>
                      Trades with P/L between <span className="font-mono text-foreground">-{currencyConfig.symbol}{breakevenTolerance.value}</span> and <span className="font-mono text-foreground">+{currencyConfig.symbol}{breakevenTolerance.value}</span> will be classified as <span className="text-primary font-medium">breakeven</span>.
                    </>
                  ) : (
                    <>
                      Trades with Return between <span className="font-mono text-foreground">-{breakevenTolerance.value}%</span> and <span className="font-mono text-foreground">+{breakevenTolerance.value}%</span> will be classified as <span className="text-primary font-medium">breakeven</span>.
                    </>
                  )}
                </p>
              </div>
              
              <div className="p-3 bg-muted/30 rounded-lg border-l-2 border-primary">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Win Rate Formula:</span> Wins ÷ (Wins + Losses) × 100%. Breakeven trades are excluded from win rate calculations.
                </p>
              </div>
            </div>
          </div>

        </>
      )}

      {/* Accounts Tab Content */}
      {activeSettingsTab === 'accounts' && (
        <>
          {/* Account Import Modal */}
          <AccountImportModal open={showImportModal} onOpenChange={setShowImportModal} />
          
          {/* Accounts Section */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Accounts Management</h2>
                <p className="text-sm text-muted-foreground">Create and manage trading accounts with balance tracking</p>
              </div>
            </div>

            <div className="flex gap-3 mb-6">
              <Input
                placeholder="Account name..."
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                onKeyDown={handleAccountKeyDown}
                className="bg-input border-border flex-1"
              />
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{currencyConfig.symbol}</span>
                <Input
                  type="number"
                  placeholder="Starting balance"
                  value={newAccountBalance}
                  onChange={(e) => setNewAccountBalance(e.target.value)}
                  onKeyDown={handleAccountKeyDown}
                  className="bg-input border-border w-40 pl-7"
                />
              </div>
              <Button onClick={handleAddAccount} disabled={!newAccountName.trim() || !newAccountBalance}>
                <Plus className="w-4 h-4 mr-2" />
                Add Account
              </Button>
            </div>

            {activeAccountsWithStats.length === 0 && archivedAccountsWithStats.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Wallet className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No accounts created yet</p>
                <p className="text-sm">Add your first account above to start tracking balances</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Active Accounts */}
                <div className="space-y-2">
                  <AnimatePresence>
                    {activeAccountsWithStats.map((account) => (
                      <motion.div
                        key={account.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex items-center justify-between p-4 bg-input rounded-lg border border-border"
                      >
                        {editingAccount === account.id ? (
                          <div className="flex items-center gap-2 flex-1">
                            <Input
                              value={editAccountName}
                              onChange={(e) => setEditAccountName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveAccountEdit();
                                if (e.key === 'Escape') cancelAccountEdit();
                              }}
                              className="bg-background border-border h-8 flex-1"
                              autoFocus
                            />
                            <div className="relative">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{currencyConfig.symbol}</span>
                              <Input
                                type="number"
                                value={editAccountBalance}
                                onChange={(e) => setEditAccountBalance(e.target.value)}
                                className="bg-background border-border h-8 w-32 pl-6"
                              />
                            </div>
                            <Button size="sm" variant="ghost" onClick={saveAccountEdit}>
                              <Check className="w-4 h-4 text-profit" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={cancelAccountEdit}>
                              <X className="w-4 h-4 text-loss" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-4 flex-1">
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-primary" />
                                <span className="font-medium">{account.name}</span>
                              </div>
                              <div className="flex items-center gap-6 text-sm">
                                <div className="text-muted-foreground">
                                  <span className="text-xs">Starting:</span>{' '}
                                  <span className="font-mono text-foreground">{currencyConfig.symbol}{account.startingBalance.toLocaleString()}</span>
                                </div>
                                <div className="text-muted-foreground">
                                  <span className="text-xs">Current:</span>{' '}
                                  <span className="font-mono text-foreground">{currencyConfig.symbol}{account.currentBalance.toLocaleString()}</span>
                                </div>
                                <div className={cn(
                                  "flex items-center gap-1",
                                  account.pnl >= 0 ? "text-profit" : "text-loss"
                                )}>
                                  {account.pnl >= 0 ? (
                                    <TrendingUp className="w-3 h-3" />
                                  ) : (
                                    <TrendingDown className="w-3 h-3" />
                                  )}
                                  <span className="font-mono text-sm">
                                    {account.roi >= 0 ? '+' : ''}{account.roi.toFixed(2)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-popover border-border z-50 w-48">
                                <DropdownMenuItem onClick={() => setShowImportModal(true)} className="cursor-pointer">
                                  <Download className="w-4 h-4 mr-2" />
                                  Import
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setDepositWithdrawAccountId(account.id)} className="cursor-pointer">
                                  <DollarSign className="w-4 h-4 mr-2" />
                                  Deposit / Withdraw
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => startEditingAccount(account)} className="cursor-pointer">
                                  <Edit2 className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => archiveAccount(account.id)} className="cursor-pointer">
                                  <Archive className="w-4 h-4 mr-2" />
                                  Archive
                                </DropdownMenuItem>
                                <DropdownMenuItem disabled className="cursor-not-allowed opacity-50">
                                  <ArrowRightLeft className="w-4 h-4 mr-2" />
                                  Transfer All Data
                                </DropdownMenuItem>
                                <DropdownMenuItem disabled className="cursor-not-allowed opacity-50">
                                  <Eraser className="w-4 h-4 mr-2" />
                                  Clear Trades
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Archived Accounts Section */}
                {archivedAccountsWithStats.length > 0 && (
                  <div className="mt-6">
                    <Button
                      variant="outline"
                      onClick={() => setShowArchivedAccounts(!showArchivedAccounts)}
                      className="w-full justify-between h-10 mb-2"
                    >
                      <div className="flex items-center gap-2">
                        <Archive className="w-4 h-4" />
                        <span>Archived Accounts ({archivedAccountsWithStats.length})</span>
                      </div>
                      {showArchivedAccounts ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </Button>
                    
                    {showArchivedAccounts && (
                      <div className="space-y-2 mt-2">
                        <AnimatePresence>
                          {archivedAccountsWithStats.map((account) => {
                            const tradeCount = trades.filter(t => t.accountName === account.name).length;
                            
                            return (
                              <motion.div
                                key={account.id}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50"
                              >
                                <div className="flex items-center gap-4 flex-1">
                                  <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                                    <span className="font-medium text-muted-foreground">{account.name}</span>
                                  </div>
                                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                    <div>
                                      <span className="text-xs">Total P/L:</span>{' '}
                                      <span className={cn(
                                        "font-mono",
                                        account.pnl >= 0 ? "text-profit" : "text-loss"
                                      )}>
                                        {account.pnl >= 0 ? '+' : ''}{currencyConfig.symbol}{account.pnl.toLocaleString()}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="text-xs">Trades:</span>{' '}
                                      <span className="font-mono">{tradeCount}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => unarchiveAccount(account.id)}
                                    className="h-7 text-xs gap-1"
                                    title="Unarchive account"
                                  >
                                    <ArchiveRestore className="w-3 h-3" />
                                    Unarchive
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      if (window.confirm(`Are you sure you want to permanently delete "${account.name}"? This will also delete ALL trades and data associated with this account. This action cannot be undone.`)) {
                                        deleteTradesByAccountId(account.id);
                                        deleteTradesByAccountName(account.name);
                                        deleteAccountPermanently(account.id);
                                      }
                                    }}
                                    className="text-loss hover:text-loss h-7 text-xs gap-1"
                                    title="Permanently delete"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    Delete
                                  </Button>
                                </div>
                              </motion.div>
                            );
                          })}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Custom Tags Tab Content */}
      {activeSettingsTab === 'custom-tags' && (
        <div className="space-y-6">
          {/* Sub-tab Navigation */}
          <div className="flex gap-2 p-1 bg-muted/30 rounded-lg w-fit">
            <button
              onClick={() => setActiveTagsSubTab('categories')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                activeTagsSubTab === 'categories'
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              <FolderOpen className="w-4 h-4" />
              Categories
            </button>
            <button
              onClick={() => setActiveTagsSubTab('tags')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                activeTagsSubTab === 'tags'
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              <Tag className="w-4 h-4" />
              Tags
            </button>
            <button
              onClick={() => setActiveTagsSubTab('screenshot-tags')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                activeTagsSubTab === 'screenshot-tags'
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              )}
            >
              <Image className="w-4 h-4" />
              Screenshot Tags
            </button>
          </div>

          {/* Categories Sub-tab */}
          {activeTagsSubTab === 'categories' && (
            <div className="glass-card rounded-2xl p-6">
              <CategoriesManagement />
            </div>
          )}

          {/* Tags Sub-tab */}
          {activeTagsSubTab === 'tags' && (
            <div className="glass-card rounded-2xl p-6">
              <TagsManagement />
            </div>
          )}

          {/* Screenshot Tags Sub-tab */}
          {activeTagsSubTab === 'screenshot-tags' && (
            <div className="glass-card rounded-2xl p-6">
              <ScreenshotTagsManagement />
            </div>
          )}
        </div>
      )}

      {/* Trade Comments Tab Content */}
      {activeSettingsTab === 'trade-comments' && (
        <TradeCommentsManagement />
      )}

      {/* Symbol Tick / Pip Tab Content */}
      {activeSettingsTab === 'symbol-tick' && (
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Ruler className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Symbol Tick / Pip Size</h2>
              <p className="text-sm text-muted-foreground">Define custom tick/pip sizes per traded symbol</p>
            </div>
          </div>
          <SymbolTickSizeManagement />
        </div>
      )}

      {/* TP / SL Settings Tab Content */}
      {activeSettingsTab === 'tpsl' && (
        <TpSlSettings />
      )}

      {/* Fees Settings Tab Content */}
      {activeSettingsTab === 'fees' && (
        <FeesSettings />
      )}

      {/* Deposit/Withdraw Modal */}
      {depositWithdrawAccountId && (() => {
        const account = accounts.find(a => a.id === depositWithdrawAccountId);
        if (!account) return null;
        return (
          <DepositWithdrawModal
            isOpen={!!depositWithdrawAccountId}
            onClose={() => setDepositWithdrawAccountId(null)}
            accountId={depositWithdrawAccountId}
            accountName={account.name}
            transactions={getTransactionsForAccount(depositWithdrawAccountId)}
            onAddTransaction={(type, amount, note) => 
              addTransaction(depositWithdrawAccountId, type, amount, note)
            }
          />
        );
      })()}
    </div>
  );
};

export default Settings;
