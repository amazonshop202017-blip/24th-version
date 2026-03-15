import { useState } from 'react';
import { Plus, Wallet } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { AccountMode, PropFirmStep, DrawdownType } from '@/contexts/AccountsContext';

interface NewAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateAccount: (data: {
    name: string;
    startingBalance: number;
    accountMode: AccountMode;
    propFirmSettings?: {
      step: PropFirmStep;
      targetPercent: number;
      totalDrawdownPercent: number;
      dailyDrawdownPercent: number;
      drawdownType: DrawdownType;
    };
  }) => void;
  currencySymbol: string;
}

export const NewAccountModal = ({ open, onOpenChange, onCreateAccount, currencySymbol }: NewAccountModalProps) => {
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [mode, setMode] = useState<AccountMode>('normal');
  const [step, setStep] = useState<PropFirmStep>('step1');
  const [targetPercent, setTargetPercent] = useState('');
  const [totalDrawdown, setTotalDrawdown] = useState('');
  const [dailyDrawdown, setDailyDrawdown] = useState('');
  const [drawdownType, setDrawdownType] = useState<DrawdownType>('static');

  const resetForm = () => {
    setName('');
    setBalance('');
    setMode('normal');
    setStep('step1');
    setTargetPercent('');
    setTotalDrawdown('');
    setDailyDrawdown('');
    setDrawdownType('static');
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) resetForm();
    onOpenChange(val);
  };

  const canCreate = name.trim() && balance && parseFloat(balance) >= 0;

  const handleCreate = () => {
    if (!canCreate) return;
    onCreateAccount({
      name: name.trim(),
      startingBalance: parseFloat(balance) || 0,
      accountMode: mode,
      ...(mode === 'propfirm' && {
        propFirmSettings: {
          step,
          targetPercent: parseFloat(targetPercent) || 0,
          totalDrawdownPercent: parseFloat(totalDrawdown) || 0,
          dailyDrawdownPercent: parseFloat(dailyDrawdown) || 0,
          drawdownType,
        },
      }),
    });
    handleOpenChange(false);
  };

  const stepOptions: { value: PropFirmStep; label: string }[] = [
    { value: 'step1', label: 'Step 1' },
    { value: 'step2', label: 'Step 2' },
    { value: 'instant', label: 'Instant' },
  ];

  const drawdownOptions: { value: DrawdownType; label: string }[] = [
    { value: 'static', label: 'Static' },
    { value: 'live', label: 'Live' },
    { value: 'eod', label: 'EOD' },
  ];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader className="gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Add New Account</DialogTitle>
              <DialogDescription>Set up your trading account</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Account Name */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
              Account Name
            </Label>
            <Input
              placeholder="My Trading Account"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-input border-border"
            />
          </div>

          {/* Starting Balance */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Starting Account Balance</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{currencySymbol}</span>
              <Input
                type="number"
                placeholder="10,000"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="bg-input border-border pl-7"
              />
            </div>
          </div>

          {/* Account Mode */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Account Mode</Label>
            <div className="grid grid-cols-2 gap-0 rounded-lg border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => setMode('normal')}
                className={cn(
                  "py-2.5 text-sm font-medium transition-colors",
                  mode === 'normal'
                    ? "bg-primary text-primary-foreground"
                    : "bg-input text-muted-foreground hover:text-foreground"
                )}
              >
                Normal Account
              </button>
              <button
                type="button"
                onClick={() => setMode('propfirm')}
                className={cn(
                  "py-2.5 text-sm font-medium transition-colors",
                  mode === 'propfirm'
                    ? "bg-primary text-primary-foreground"
                    : "bg-input text-muted-foreground hover:text-foreground"
                )}
              >
                Prop Firm
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              {mode === 'normal'
                ? 'This account will show in Live Trading mode.'
                : 'Configure prop firm challenge parameters.'}
            </p>
          </div>

          {/* Prop Firm Settings */}
          {mode === 'propfirm' && (
            <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
              {/* Step Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Challenge Phase</Label>
                <div className="grid grid-cols-3 gap-2">
                  {stepOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setStep(opt.value)}
                      className={cn(
                        "py-2 rounded-lg text-sm font-medium border transition-colors",
                        step === opt.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-input border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target % */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Target %</Label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="10"
                    value={targetPercent}
                    onChange={(e) => setTargetPercent(e.target.value)}
                    className="bg-input border-border pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                </div>
              </div>

              {/* Total Drawdown % */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Total Drawdown %</Label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="10"
                    value={totalDrawdown}
                    onChange={(e) => setTotalDrawdown(e.target.value)}
                    className="bg-input border-border pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                </div>
              </div>

              {/* Daily Drawdown % */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Daily Drawdown %</Label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="5"
                    value={dailyDrawdown}
                    onChange={(e) => setDailyDrawdown(e.target.value)}
                    className="bg-input border-border pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                </div>
              </div>

              {/* Drawdown Type */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Drawdown Type</Label>
                <div className="grid grid-cols-3 gap-2">
                  {drawdownOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDrawdownType(opt.value)}
                      className={cn(
                        "py-2 rounded-lg text-sm font-medium border transition-colors",
                        drawdownType === opt.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-input border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={handleCreate}
            disabled={!canCreate}
            className="w-full gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
