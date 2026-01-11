import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Check, X, Target, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useStrategiesContext } from '@/contexts/StrategiesContext';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const Strategies = () => {
  const { strategies, addStrategy, removeStrategy, updateStrategy } = useStrategiesContext();
  const navigate = useNavigate();
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

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

      {/* Strategies List */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
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
          <div className="space-y-2">
            <AnimatePresence>
              {strategies.map((strategy) => (
                <motion.div
                  key={strategy.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center justify-between p-4 bg-input rounded-lg border border-border group hover:border-primary/50 transition-colors"
                >
                  {editingId === strategy.id ? (
                    <div className="flex-1 space-y-3">
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
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => navigate(`/strategies/${strategy.id}`)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <span className="font-medium">{strategy.name}</span>
                        </div>
                        {strategy.description && (
                          <p className="text-sm text-muted-foreground mt-1 ml-5">{strategy.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1 ml-5">
                          Created {format(new Date(strategy.createdAt), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditing(strategy.id, strategy.name, strategy.description);
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeStrategy(strategy.id);
                            }}
                            className="text-loss hover:text-loss"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
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
