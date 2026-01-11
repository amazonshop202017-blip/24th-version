import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Check, X, Target, ChevronRight, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useStrategiesContext } from '@/contexts/StrategiesContext';
import { useTradesContext } from '@/contexts/TradesContext';
import { useNavigate } from 'react-router-dom';
import { calculateStrategyStats } from '@/lib/strategyStats';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const formatCurrency = (value: number) => {
  const prefix = value >= 0 ? '$' : '-$';
  return `${prefix}${Math.abs(value).toFixed(2)}`;
};

const formatPercent = (value: number) => {
  return `${Math.round(value)}%`;
};

const Strategies = () => {
  const { strategies, addStrategy, removeStrategy, updateStrategy } = useStrategiesContext();
  const { trades } = useTradesContext();
  const navigate = useNavigate();
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Calculate stats for all strategies
  const strategiesWithStats = useMemo(() => {
    return strategies.map(strategy => ({
      ...strategy,
      stats: calculateStrategyStats(strategy.id, trades),
    }));
  }, [strategies, trades]);

  const handleAddStrategy = () => {
    if (newName.trim()) {
      addStrategy(newName.trim(), newDescription.trim());
      setNewName('');
      setNewDescription('');
      setShowAddForm(false);
    }
  };

  const startEditing = (id: string, name: string, description: string) => {
    setEditingId(id);
    setEditName(name);
    setEditDescription(description);
  };

  const saveEdit = () => {
    if (editingId && editName.trim()) {
      updateStrategy(editingId, editName.trim(), editDescription.trim());
    }
    setEditingId(null);
    setEditName('');
    setEditDescription('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditDescription('');
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Strategies</h1>
          <p className="text-muted-foreground">Define and track your trading strategies</p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Strategy
        </Button>
      </div>

      {/* Add Strategy Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-card rounded-2xl p-6"
          >
            <h3 className="text-lg font-semibold mb-4">New Strategy</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Strategy Name</label>
                <Input
                  placeholder="Enter strategy name..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="bg-input border-border"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Description (optional)</label>
                <Textarea
                  placeholder="Describe your strategy..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="bg-input border-border resize-none"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddStrategy} disabled={!newName.trim()}>
                  Create Strategy
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Strategies Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="flex items-center gap-3 p-6 border-b border-border">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Your Strategies</h2>
            <p className="text-sm text-muted-foreground">Click a strategy to view its performance</p>
          </div>
        </div>

        {strategies.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Target className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No strategies created yet</p>
            <p className="text-sm">Add your first strategy to start organizing trades</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Table Header */}
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3 bg-muted/30 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <div>Title</div>
              <div className="text-right">Missed Trades</div>
              <div className="text-center">Shared Strategies</div>
              <div className="text-right">Average Loser</div>
              <div className="text-right">Average Winner</div>
              <div className="text-right">Total Net P&L</div>
              <div className="text-right">Profit Factor</div>
              <div className="text-right">Trades</div>
              <div className="text-right">Expectancy</div>
              <div className="text-right">Win Rate</div>
              <div className="w-8"></div>
            </div>

            {/* Table Body */}
            <AnimatePresence>
              {strategiesWithStats.map((strategy) => (
                <motion.div
                  key={strategy.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 border-b border-border hover:bg-muted/20 transition-colors group"
                >
                  {editingId === strategy.id ? (
                    <div className="col-span-11 space-y-3">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit();
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        className="bg-background border-border h-8"
                        autoFocus
                      />
                      <Textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="bg-background border-border resize-none"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" variant="default" onClick={saveEdit}>
                          <Check className="w-4 h-4 mr-1" /> Save
                        </Button>
                        <Button size="sm" variant="ghost" onClick={cancelEdit}>
                          <X className="w-4 h-4 mr-1" /> Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Title */}
                      <div 
                        className="flex items-center gap-3 cursor-pointer"
                        onClick={() => navigate(`/strategies/${strategy.id}`)}
                      >
                        <span className="font-medium text-foreground hover:text-primary transition-colors">
                          {strategy.name.toUpperCase()}
                        </span>
                      </div>

                      {/* Missed Trades */}
                      <div className="text-right text-sm text-muted-foreground flex items-center justify-end">
                        {strategy.stats.missedTrades}
                      </div>

                      {/* Shared Strategies */}
                      <div className="text-center text-sm text-muted-foreground flex items-center justify-center">
                        {strategy.stats.sharedStrategies}
                      </div>

                      {/* Average Loser */}
                      <div className="text-right text-sm flex items-center justify-end">
                        <span className={strategy.stats.avgLoser < 0 ? 'text-loss' : 'text-muted-foreground'}>
                          {formatCurrency(strategy.stats.avgLoser)}
                        </span>
                      </div>

                      {/* Average Winner */}
                      <div className="text-right text-sm flex items-center justify-end">
                        <span className={strategy.stats.avgWinner > 0 ? 'text-profit' : 'text-muted-foreground'}>
                          {formatCurrency(strategy.stats.avgWinner)}
                        </span>
                      </div>

                      {/* Total Net P&L */}
                      <div className="text-right text-sm flex items-center justify-end">
                        <span className={strategy.stats.totalNetPnL >= 0 ? 'text-profit' : 'text-loss'}>
                          {formatCurrency(strategy.stats.totalNetPnL)}
                        </span>
                      </div>

                      {/* Profit Factor */}
                      <div className="text-right text-sm text-muted-foreground flex items-center justify-end">
                        {strategy.stats.profitFactor.toFixed(2)}
                      </div>

                      {/* Trades */}
                      <div className="text-right text-sm text-muted-foreground flex items-center justify-end">
                        {strategy.stats.totalTrades}
                      </div>

                      {/* Expectancy */}
                      <div className="text-right text-sm flex items-center justify-end">
                        <span className={strategy.stats.expectancy >= 0 ? 'text-profit' : 'text-loss'}>
                          {formatCurrency(strategy.stats.expectancy)}
                        </span>
                      </div>

                      {/* Win Rate */}
                      <div className="text-right text-sm text-muted-foreground flex items-center justify-end">
                        {formatPercent(strategy.stats.winRate)}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/strategies/${strategy.id}`);
                              }}
                            >
                              <ChevronRight className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditing(strategy.id, strategy.name, strategy.description);
                              }}
                            >
                              <Edit2 className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                removeStrategy(strategy.id);
                              }}
                              className="text-loss focus:text-loss"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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

export default Strategies;
