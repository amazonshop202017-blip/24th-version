import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Check, X, Tag, Wallet, TrendingUp, TrendingDown, ArrowLeftRight, BarChart3, MessageSquareText, Settings as SettingsIcon, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTagsContext } from '@/contexts/TagsContext';
import { useAccountsContext } from '@/contexts/AccountsContext';
import { useCustomStats } from '@/contexts/CustomStatsContext';
import { cn } from '@/lib/utils';
import DepositWithdrawModal from '@/components/settings/DepositWithdrawModal';

const Settings = () => {
  const { tags, addTag, removeTag, updateTag } = useTagsContext();
  const { accounts, addAccount, removeAccount, updateAccount, getAllAccountsWithStats, addTransaction, getTransactionsForAccount } = useAccountsContext();
  const { 
    options: customStatsOptions,
    addTimeframe, removeTimeframe,
    addConfluence, removeConfluence,
    addPattern, removePattern,
    addPreparation, removePreparation,
    addEntryComment, removeEntryComment,
    addTradeManagement, removeTradeManagement,
    addExitComment, removeExitComment,
    addMental, removeMental,
    addIndicator, removeIndicator,
    addMarketGeneral, removeMarketGeneral,
    addBias, removeBias,
  } = useCustomStats();

  // Settings tab state
  const [activeSettingsTab, setActiveSettingsTab] = useState<'main' | 'tags-comments'>('main');
  
  const [newTag, setNewTag] = useState('');
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Account state
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountBalance, setNewAccountBalance] = useState('');
  const [editingAccount, setEditingAccount] = useState<string | null>(null);
  const [editAccountName, setEditAccountName] = useState('');
  const [editAccountBalance, setEditAccountBalance] = useState('');
  
  // Deposit/Withdraw modal state
  const [depositWithdrawAccountId, setDepositWithdrawAccountId] = useState<string | null>(null);

  // Import file state
  const [importAccountId, setImportAccountId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = (accountId: string) => {
    setImportAccountId(accountId);
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && importAccountId) {
      console.log('Selected file:', file.name, 'for account:', importAccountId);
      // TODO: Process the imported file
    }
    // Reset
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setImportAccountId(null);
  };

  // Custom Stats input state
  const [newTimeframe, setNewTimeframe] = useState('');
  const [newConfluence, setNewConfluence] = useState('');
  const [newPattern, setNewPattern] = useState('');
  const [newPreparation, setNewPreparation] = useState('');
  const [newEntryComment, setNewEntryComment] = useState('');
  const [newTradeManagement, setNewTradeManagement] = useState('');
  const [newExitComment, setNewExitComment] = useState('');
  const [newMental, setNewMental] = useState('');
  const [newIndicator, setNewIndicator] = useState('');
  const [newMarketGeneral, setNewMarketGeneral] = useState('');
  const [newBias, setNewBias] = useState('');

  const accountsWithStats = getAllAccountsWithStats();
  const handleAddTag = () => {
    if (newTag.trim()) {
      addTag(newTag.trim());
      setNewTag('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTag();
    }
  };

  const startEditing = (tag: string) => {
    setEditingTag(tag);
    setEditValue(tag);
  };

  const saveEdit = () => {
    if (editingTag && editValue.trim()) {
      updateTag(editingTag, editValue.trim());
    }
    setEditingTag(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingTag(null);
    setEditValue('');
  };

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

  // Custom Stats handlers
  const handleAddTimeframe = () => {
    if (newTimeframe.trim()) {
      addTimeframe(newTimeframe.trim());
      setNewTimeframe('');
    }
  };

  const handleAddConfluence = () => {
    if (newConfluence.trim()) {
      addConfluence(newConfluence.trim());
      setNewConfluence('');
    }
  };

  const handleAddPattern = () => {
    if (newPattern.trim()) {
      addPattern(newPattern.trim());
      setNewPattern('');
    }
  };

  const handleAddPreparation = () => {
    if (newPreparation.trim()) {
      addPreparation(newPreparation.trim());
      setNewPreparation('');
    }
  };

  const handleAddEntryComment = () => {
    if (newEntryComment.trim()) {
      addEntryComment(newEntryComment.trim());
      setNewEntryComment('');
    }
  };

  const handleAddTradeManagement = () => {
    if (newTradeManagement.trim()) {
      addTradeManagement(newTradeManagement.trim());
      setNewTradeManagement('');
    }
  };

  const handleAddExitComment = () => {
    if (newExitComment.trim()) {
      addExitComment(newExitComment.trim());
      setNewExitComment('');
    }
  };

  const handleAddMental = () => {
    if (newMental.trim()) {
      addMental(newMental.trim());
      setNewMental('');
    }
  };

  const handleAddIndicator = () => {
    if (newIndicator.trim()) {
      addIndicator(newIndicator.trim());
      setNewIndicator('');
    }
  };

  const handleAddMarketGeneral = () => {
    if (newMarketGeneral.trim()) {
      addMarketGeneral(newMarketGeneral.trim());
      setNewMarketGeneral('');
    }
  };

  const handleAddBias = () => {
    if (newBias.trim()) {
      addBias(newBias.trim());
      setNewBias('');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hidden file input for import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".csv,.htm,.html"
        className="hidden"
      />
      
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
          onClick={() => setActiveSettingsTab('tags-comments')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
            activeSettingsTab === 'tags-comments'
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-background/50"
          )}
        >
          <Tag className="w-4 h-4" />
          Tags / Comments
        </button>
      </div>

      {/* Main Tab Content */}
      {activeSettingsTab === 'main' && (
        <>
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
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
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

            {accountsWithStats.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Wallet className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No accounts created yet</p>
                <p className="text-sm">Add your first account above to start tracking balances</p>
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {accountsWithStats.map((account) => (
                    <motion.div
                      key={account.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex items-center justify-between p-4 bg-input rounded-lg border border-border group"
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
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹</span>
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
                                <span className="font-mono text-foreground">₹{account.startingBalance.toLocaleString()}</span>
                              </div>
                              <div className="text-muted-foreground">
                                <span className="text-xs">Current:</span>{' '}
                                <span className="font-mono text-foreground">₹{account.currentBalance.toLocaleString()}</span>
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
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="relative group/import">
                              <Button
                                size="sm"
                                variant="ghost"
                                title="Import Trades"
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                              <div className="absolute right-0 top-full mt-1 w-40 bg-popover border border-border rounded-lg shadow-lg opacity-0 invisible group-hover/import:opacity-100 group-hover/import:visible transition-all z-50">
                                <div className="p-2">
                                  <p className="text-xs text-muted-foreground px-2 py-1 font-medium">Select Broker</p>
                                  <button
                                    className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors flex items-center gap-2"
                                    onClick={() => handleImportClick(account.id)}
                                  >
                                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                                    MT5
                                  </button>
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDepositWithdrawAccountId(account.id)}
                              title="Deposit & Withdraw"
                            >
                              <ArrowLeftRight className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEditingAccount(account)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeAccount(account.id)}
                              className="text-loss hover:text-loss"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </>
      )}

      {/* Tags / Comments Tab Content */}
      {activeSettingsTab === 'tags-comments' && (
        <>
          {/* Tags Section */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Tag className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Tags Management</h2>
                <p className="text-sm text-muted-foreground">Create and manage tags for organizing your trades</p>
              </div>
            </div>

            <div className="flex gap-3 mb-6">
              <Input
                placeholder="Enter new tag name..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleKeyDown}
                className="bg-input border-border flex-1"
              />
              <Button onClick={handleAddTag} disabled={!newTag.trim()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Tag
              </Button>
            </div>

            {tags.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Tag className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No tags created yet</p>
                <p className="text-sm">Add your first tag above to start organizing trades</p>
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {tags.map((tag) => (
                    <motion.div
                      key={tag}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex items-center justify-between p-3 bg-input rounded-lg border border-border group"
                    >
                      {editingTag === tag ? (
                        <div className="flex items-center gap-2 flex-1">
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit();
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            className="bg-background border-border h-8"
                            autoFocus
                          />
                          <Button size="sm" variant="ghost" onClick={saveEdit}>
                            <Check className="w-4 h-4 text-profit" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={cancelEdit}>
                            <X className="w-4 h-4 text-loss" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-primary" />
                            <span className="font-medium">{tag}</span>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEditing(tag)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeTag(tag)}
                              className="text-loss hover:text-loss"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Custom Stats Section */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Custom Stats</h2>
                <p className="text-sm text-muted-foreground">Manage dropdown options for trade Advanced Data</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Timeframe */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground">Timeframe</h3>
                <div className="flex gap-3">
                  <Input
                    placeholder="Add new timeframe (e.g., 3M)..."
                    value={newTimeframe}
                    onChange={(e) => setNewTimeframe(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTimeframe()}
                    className="bg-input border-border flex-1"
                  />
                  <Button onClick={handleAddTimeframe} disabled={!newTimeframe.trim()} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {customStatsOptions.timeframes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No timeframe options added yet</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {customStatsOptions.timeframes.map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-lg border border-border group"
                      >
                        <span className="text-sm">{item}</span>
                        <button
                          onClick={() => removeTimeframe(item)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Confluence */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground">Confluence</h3>
                <div className="flex gap-3">
                  <Input
                    placeholder="Add new confluence..."
                    value={newConfluence}
                    onChange={(e) => setNewConfluence(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddConfluence()}
                    className="bg-input border-border flex-1"
                  />
                  <Button onClick={handleAddConfluence} disabled={!newConfluence.trim()} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {customStatsOptions.confluences.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No confluence options added yet</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {customStatsOptions.confluences.map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-lg border border-border group"
                      >
                        <span className="text-sm">{item}</span>
                        <button
                          onClick={() => removeConfluence(item)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pattern */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground">Pattern</h3>
                <div className="flex gap-3">
                  <Input
                    placeholder="Add new pattern..."
                    value={newPattern}
                    onChange={(e) => setNewPattern(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddPattern()}
                    className="bg-input border-border flex-1"
                  />
                  <Button onClick={handleAddPattern} disabled={!newPattern.trim()} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {customStatsOptions.patterns.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No pattern options added yet</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {customStatsOptions.patterns.map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-lg border border-border group"
                      >
                        <span className="text-sm">{item}</span>
                        <button
                          onClick={() => removePattern(item)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Preparation */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground">Preparation</h3>
                <div className="flex gap-3">
                  <Input
                    placeholder="Add new preparation..."
                    value={newPreparation}
                    onChange={(e) => setNewPreparation(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddPreparation()}
                    className="bg-input border-border flex-1"
                  />
                  <Button onClick={handleAddPreparation} disabled={!newPreparation.trim()} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {customStatsOptions.preparations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No preparation options added yet</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {customStatsOptions.preparations.map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-lg border border-border group"
                      >
                        <span className="text-sm">{item}</span>
                        <button
                          onClick={() => removePreparation(item)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Mental */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground">Mental</h3>
                <div className="flex gap-3">
                  <Input
                    placeholder="Add new mental state..."
                    value={newMental}
                    onChange={(e) => setNewMental(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddMental()}
                    className="bg-input border-border flex-1"
                  />
                  <Button onClick={handleAddMental} disabled={!newMental.trim()} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {customStatsOptions.mentals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No mental options added yet</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {customStatsOptions.mentals.map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-lg border border-border group"
                      >
                        <span className="text-sm">{item}</span>
                        <button
                          onClick={() => removeMental(item)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Indicator */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground">Indicator</h3>
                <div className="flex gap-3">
                  <Input
                    placeholder="Add new indicator..."
                    value={newIndicator}
                    onChange={(e) => setNewIndicator(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddIndicator()}
                    className="bg-input border-border flex-1"
                  />
                  <Button onClick={handleAddIndicator} disabled={!newIndicator.trim()} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {customStatsOptions.indicators.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No indicator options added yet</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {customStatsOptions.indicators.map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-lg border border-border group"
                      >
                        <span className="text-sm">{item}</span>
                        <button
                          onClick={() => removeIndicator(item)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Market General */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground">Market General</h3>
                <div className="flex gap-3">
                  <Input
                    placeholder="Add new market general..."
                    value={newMarketGeneral}
                    onChange={(e) => setNewMarketGeneral(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddMarketGeneral()}
                    className="bg-input border-border flex-1"
                  />
                  <Button onClick={handleAddMarketGeneral} disabled={!newMarketGeneral.trim()} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {customStatsOptions.marketGenerals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No market general options added yet</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {customStatsOptions.marketGenerals.map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-lg border border-border group"
                      >
                        <span className="text-sm">{item}</span>
                        <button
                          onClick={() => removeMarketGeneral(item)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bias */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground">Bias</h3>
                <div className="flex gap-3">
                  <Input
                    placeholder="Add new bias..."
                    value={newBias}
                    onChange={(e) => setNewBias(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddBias()}
                    className="bg-input border-border flex-1"
                  />
                  <Button onClick={handleAddBias} disabled={!newBias.trim()} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {customStatsOptions.biases.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No bias options added yet</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {customStatsOptions.biases.map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-lg border border-border group"
                      >
                        <span className="text-sm">{item}</span>
                        <button
                          onClick={() => removeBias(item)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Trade Advance Comments Section */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <MessageSquareText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Trade Advance Comments</h2>
                <p className="text-sm text-muted-foreground">Manage dropdown options for trade comments</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Entry Comments */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground">Entry Comments</h3>
                <div className="flex gap-3">
                  <Input
                    placeholder="Add new entry comment..."
                    value={newEntryComment}
                    onChange={(e) => setNewEntryComment(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddEntryComment()}
                    className="bg-input border-border flex-1"
                  />
                  <Button onClick={handleAddEntryComment} disabled={!newEntryComment.trim()} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {customStatsOptions.entryComments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No entry comment options added yet</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {customStatsOptions.entryComments.map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-lg border border-border group"
                      >
                        <span className="text-sm">{item}</span>
                        <button
                          onClick={() => removeEntryComment(item)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Trade Management */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground">Trade Management</h3>
                <div className="flex gap-3">
                  <Input
                    placeholder="Add new trade management..."
                    value={newTradeManagement}
                    onChange={(e) => setNewTradeManagement(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTradeManagement()}
                    className="bg-input border-border flex-1"
                  />
                  <Button onClick={handleAddTradeManagement} disabled={!newTradeManagement.trim()} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {customStatsOptions.tradeManagements.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No trade management options added yet</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {customStatsOptions.tradeManagements.map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-lg border border-border group"
                      >
                        <span className="text-sm">{item}</span>
                        <button
                          onClick={() => removeTradeManagement(item)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Exit Comments */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground">Exit Comments</h3>
                <div className="flex gap-3">
                  <Input
                    placeholder="Add new exit comment..."
                    value={newExitComment}
                    onChange={(e) => setNewExitComment(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddExitComment()}
                    className="bg-input border-border flex-1"
                  />
                  <Button onClick={handleAddExitComment} disabled={!newExitComment.trim()} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {customStatsOptions.exitComments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No exit comment options added yet</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {customStatsOptions.exitComments.map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 rounded-lg border border-border group"
                      >
                        <span className="text-sm">{item}</span>
                        <button
                          onClick={() => removeExitComment(item)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Deposit/Withdraw Modal */}
      {depositWithdrawAccountId && (() => {
        const account = accounts.find(a => a.id === depositWithdrawAccountId);
        if (!account) return null;
        return (
          <DepositWithdrawModal
            isOpen={true}
            onClose={() => setDepositWithdrawAccountId(null)}
            accountId={account.id}
            accountName={account.name}
            transactions={getTransactionsForAccount(account.id)}
            onAddTransaction={(type, amount, note) => {
              addTransaction(account.id, type, amount, note);
            }}
          />
        );
      })()}
    </div>
  );
};

export default Settings;
