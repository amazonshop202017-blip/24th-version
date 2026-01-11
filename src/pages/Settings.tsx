import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Check, X, Tag, Wallet, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTagsContext } from '@/contexts/TagsContext';
import { useAccountsContext } from '@/contexts/AccountsContext';
import { cn } from '@/lib/utils';

const Settings = () => {
  const { tags, addTag, removeTag, updateTag } = useTagsContext();
  const { accounts, addAccount, removeAccount, updateAccount, getAllAccountsWithStats } = useAccountsContext();
  
  const [newTag, setNewTag] = useState('');
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Account state
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountBalance, setNewAccountBalance] = useState('');
  const [editingAccount, setEditingAccount] = useState<string | null>(null);
  const [editAccountName, setEditAccountName] = useState('');
  const [editAccountBalance, setEditAccountBalance] = useState('');

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

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your trading journal configuration</p>
      </div>

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
    </div>
  );
};

export default Settings;
