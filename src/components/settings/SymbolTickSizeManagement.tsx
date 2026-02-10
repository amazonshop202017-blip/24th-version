import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTradedSymbols } from '@/hooks/useTradedSymbols';
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
  const tradedSymbols = useTradedSymbols();
  const { tickSizes, setAllTickSizes, contractSizes, setAllContractSizes } = useSymbolTickSize();
  
  // Local state for editing
  const [localTickSizes, setLocalTickSizes] = useState<Record<string, string>>({});
  const [localContractSizes, setLocalContractSizes] = useState<Record<string, string>>({});

  // Initialize local state with saved values
  useEffect(() => {
    const initialTick: Record<string, string> = {};
    const initialContract: Record<string, string> = {};
    tradedSymbols.forEach(symbol => {
      initialTick[symbol] = tickSizes[symbol]?.toString() || '';
      // Default contract size to 1 if not set
      initialContract[symbol] = contractSizes[symbol]?.toString() || '1';
    });
    setLocalTickSizes(initialTick);
    setLocalContractSizes(initialContract);
  }, [tradedSymbols, tickSizes, contractSizes]);

  const handleTickChange = (symbol: string, value: string) => {
    setLocalTickSizes(prev => ({ ...prev, [symbol]: value }));
  };

  const handleContractChange = (symbol: string, value: string) => {
    setLocalContractSizes(prev => ({ ...prev, [symbol]: value }));
  };

  const handleSave = () => {
    const newTickSizes: Record<string, number> = {};
    const newContractSizes: Record<string, number> = {};
    let hasErrors = false;

    Object.entries(localTickSizes).forEach(([symbol, value]) => {
      if (value.trim() === '') return;
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue <= 0) {
        hasErrors = true;
        return;
      }
      newTickSizes[symbol] = numValue;
    });

    Object.entries(localContractSizes).forEach(([symbol, value]) => {
      if (value.trim() === '') return;
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue <= 0) {
        hasErrors = true;
        return;
      }
      newContractSizes[symbol] = numValue;
    });

    if (hasErrors) {
      toast.error('Invalid values detected. Please enter positive numbers only.');
      return;
    }

    setAllTickSizes(newTickSizes);
    setAllContractSizes(newContractSizes);
    toast.success('Symbol settings saved successfully');
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
              <TableHead className="font-semibold">Contract Size</TableHead>
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
                    onChange={(e) => handleTickChange(symbol, e.target.value)}
                    className="w-40 bg-background"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="e.g. 100"
                    value={localContractSizes[symbol] || ''}
                    onChange={(e) => handleContractChange(symbol, e.target.value)}
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
