import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTradesContext } from '@/contexts/TradesContext';
import { useSymbolTickSize } from '@/contexts/SymbolTickSizeContext';
import { toast } from 'sonner';
import { Save, Ruler } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const SymbolTickSizeManagement = () => {
  const { trades } = useTradesContext();
  const { tickSizes, setAllTickSizes } = useSymbolTickSize();
  
  // Local state for editing
  const [localTickSizes, setLocalTickSizes] = useState<Record<string, string>>({});

  // Get unique symbols from all trades
  const tradedSymbols = useMemo(() => {
    const symbols = new Set<string>();
    trades.forEach(trade => {
      if (trade.symbol) {
        symbols.add(trade.symbol);
      }
    });
    return Array.from(symbols).sort();
  }, [trades]);

  // Initialize local state with saved values
  useEffect(() => {
    const initial: Record<string, string> = {};
    tradedSymbols.forEach(symbol => {
      initial[symbol] = tickSizes[symbol]?.toString() || '';
    });
    setLocalTickSizes(initial);
  }, [tradedSymbols, tickSizes]);

  const handleInputChange = (symbol: string, value: string) => {
    setLocalTickSizes(prev => ({ ...prev, [symbol]: value }));
  };

  const handleSave = () => {
    const newTickSizes: Record<string, number> = {};
    let hasErrors = false;

    Object.entries(localTickSizes).forEach(([symbol, value]) => {
      if (value.trim() === '') return; // Skip empty values
      
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue <= 0) {
        hasErrors = true;
        return;
      }
      newTickSizes[symbol] = numValue;
    });

    if (hasErrors) {
      toast.error('Invalid values detected. Please enter positive decimal numbers only.');
      return;
    }

    setAllTickSizes(newTickSizes);
    toast.success('Tick/Pip sizes saved successfully');
  };

  if (tradedSymbols.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Ruler className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p>No traded symbols found</p>
        <p className="text-sm">Add some trades to configure tick/pip sizes</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="font-semibold">Symbol</TableHead>
              <TableHead className="font-semibold">Tick / Pip Size</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tradedSymbols.map(symbol => (
              <TableRow key={symbol}>
                <TableCell className="font-medium">{symbol}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="e.g. 0.01"
                    value={localTickSizes[symbol] || ''}
                    onChange={(e) => handleInputChange(symbol, e.target.value)}
                    className="w-40 bg-background"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="p-3 bg-muted/30 rounded-lg">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Examples:</span>{' '}
          OIL moves 60.00 → 60.05 = tick size 0.01 | 
          NATGAS moves 3.000 → 3.002 = tick size 0.001 | 
          EURUSD moves 1.0800 → 1.0801 = pip size 0.0001
        </p>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
      </div>
    </div>
  );
};
