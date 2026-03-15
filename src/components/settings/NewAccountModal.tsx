import { useState, useRef, useEffect } from 'react';
import { Plus, Wallet, Save } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { Account, AccountMode, PropFirmStep, DrawdownType } from '@/contexts/AccountsContext';

interface PhaseData {
  targetPercent: string;
  totalDrawdown: string;
  dailyDrawdown: string;
  drawdownType: DrawdownType;
}

const emptyPhase = (): PhaseData => ({
  targetPercent: '',
  totalDrawdown: '',
  dailyDrawdown: '',
  drawdownType: 'static',
});

const isPhaseFilled = (p: PhaseData) =>
  p.targetPercent !== '' || p.totalDrawdown !== '' || p.dailyDrawdown !== '';

const isInstantFilled = (p: PhaseData) =>
  p.totalDrawdown !== '' || p.dailyDrawdown !== '';

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

type PhaseTab = 'step1' | 'step2' | 'instant';

const tabs: { value: PhaseTab; label: string }[] = [
  { value: 'step1', label: 'Step 1' },
  { value: 'step2', label: 'Step 2' },
  { value: 'instant', label: 'Instant' },
];

const drawdownOptions: { value: DrawdownType; label: string }[] = [
  { value: 'static', label: 'Static' },
  { value: 'live', label: 'Live' },
  { value: 'eod', label: 'EOD' },
];

export const NewAccountModal = ({ open, onOpenChange, onCreateAccount, currencySymbol }: NewAccountModalProps) => {
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [mode, setMode] = useState<AccountMode>('normal');
  const [activeTab, setActiveTab] = useState<PhaseTab>('step1');

  const [step1Data, setStep1Data] = useState<PhaseData>(emptyPhase());
  const [step2Data, setStep2Data] = useState<PhaseData>(emptyPhase());
  const [instantData, setInstantData] = useState<PhaseData>(emptyPhase());

  // Sliding indicator refs
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<PhaseTab, HTMLButtonElement | null>>({ step1: null, step2: null, instant: null });
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  useEffect(() => {
    const el = tabRefs.current[activeTab];
    const container = tabsContainerRef.current;
    if (el && container) {
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      setIndicatorStyle({
        left: elRect.left - containerRect.left,
        width: elRect.width,
      });
    }
  }, [activeTab, mode, open]);

  const resetForm = () => {
    setName('');
    setBalance('');
    setMode('normal');
    setActiveTab('step1');
    setStep1Data(emptyPhase());
    setStep2Data(emptyPhase());
    setInstantData(emptyPhase());
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) resetForm();
    onOpenChange(val);
  };

  // Mutual exclusion logic
  const step1Or2Filled = isPhaseFilled(step1Data) || isPhaseFilled(step2Data);
  const instantIsFilled = isInstantFilled(instantData);
  const isInstantDisabled = step1Or2Filled;
  const isStep1Disabled = instantIsFilled;
  const isStep2Disabled = instantIsFilled;

  const canCreate = name.trim() && balance && parseFloat(balance) >= 0;

  const handleCreate = () => {
    if (!canCreate) return;

    let propFirmSettings;
    if (mode === 'propfirm') {
      if (instantIsFilled && !step1Or2Filled) {
        propFirmSettings = {
          step: 'instant' as PropFirmStep,
          targetPercent: 0,
          totalDrawdownPercent: parseFloat(instantData.totalDrawdown) || 0,
          dailyDrawdownPercent: parseFloat(instantData.dailyDrawdown) || 0,
          drawdownType: instantData.drawdownType,
        };
      } else {
        // Use the highest filled phase
        const isStep2Filled = isPhaseFilled(step2Data);
        const data = isStep2Filled ? step2Data : step1Data;
        propFirmSettings = {
          step: isStep2Filled ? ('step2' as PropFirmStep) : ('step1' as PropFirmStep),
          targetPercent: parseFloat(data.targetPercent) || 0,
          totalDrawdownPercent: parseFloat(data.totalDrawdown) || 0,
          dailyDrawdownPercent: parseFloat(data.dailyDrawdown) || 0,
          drawdownType: data.drawdownType,
        };
      }
    }

    onCreateAccount({
      name: name.trim(),
      startingBalance: parseFloat(balance) || 0,
      accountMode: mode,
      ...(propFirmSettings && { propFirmSettings }),
    });
    handleOpenChange(false);
  };

  const renderPhaseFields = (
    phase: PhaseTab,
    data: PhaseData,
    setData: React.Dispatch<React.SetStateAction<PhaseData>>
  ) => {
    const showTarget = phase !== 'instant';

    return (
      <div className="space-y-4 pt-1">
        {showTarget && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Target %</Label>
            <div className="relative">
              <Input
                type="number"
                placeholder="10"
                value={data.targetPercent}
                onChange={(e) => setData((d) => ({ ...d, targetPercent: e.target.value }))}
                className="bg-input border-border pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-sm font-medium">Total Drawdown %</Label>
          <div className="relative">
            <Input
              type="number"
              placeholder="10"
              value={data.totalDrawdown}
              onChange={(e) => setData((d) => ({ ...d, totalDrawdown: e.target.value }))}
              className="bg-input border-border pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Daily Drawdown %</Label>
          <div className="relative">
            <Input
              type="number"
              placeholder="5"
              value={data.dailyDrawdown}
              onChange={(e) => setData((d) => ({ ...d, dailyDrawdown: e.target.value }))}
              className="bg-input border-border pr-8"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Drawdown Type</Label>
          <div className="grid grid-cols-3 gap-2">
            {drawdownOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setData((d) => ({ ...d, drawdownType: opt.value }))}
                className={cn(
                  "py-2 rounded-lg text-sm font-medium border transition-colors",
                  data.drawdownType === opt.value
                    ? "bg-propfirm text-propfirm-foreground border-propfirm"
                    : "bg-input border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const getDataForTab = (tab: PhaseTab) => {
    if (tab === 'step1') return { data: step1Data, setData: setStep1Data };
    if (tab === 'step2') return { data: step2Data, setData: setStep2Data };
    return { data: instantData, setData: setInstantData };
  };

  const isTabDisabled = (tab: PhaseTab) => {
    if (tab === 'instant') return isInstantDisabled;
    if (tab === 'step1') return isStep1Disabled;
    if (tab === 'step2') return isStep2Disabled;
    return false;
  };

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

        <div className="space-y-5 py-2 overflow-y-auto flex-1 min-h-0 pr-1">
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
                    ? "bg-propfirm text-propfirm-foreground"
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

          {/* Prop Firm Settings with Animated Tabs */}
          {mode === 'propfirm' && (
            <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
              {/* Phase Tab Selector with sliding indicator */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Challenge Phase</Label>
                <div
                  ref={tabsContainerRef}
                  className="relative flex rounded-lg border border-border bg-input p-1 gap-1"
                >
                  {/* Animated sliding indicator */}
                  <div
                    className="absolute top-1 bottom-1 rounded-md bg-propfirm transition-all duration-300 ease-in-out z-0"
                    style={{
                      left: `${indicatorStyle.left}px`,
                      width: `${indicatorStyle.width}px`,
                    }}
                  />

                  {tabs.map((tab) => {
                    const disabled = isTabDisabled(tab.value);
                    const isActive = activeTab === tab.value;

                    return (
                      <button
                        key={tab.value}
                        ref={(el) => { tabRefs.current[tab.value] = el; }}
                        type="button"
                        disabled={disabled}
                        onClick={() => !disabled && setActiveTab(tab.value)}
                        className={cn(
                          "relative z-10 flex-1 py-2 rounded-md text-sm font-medium transition-colors duration-200",
                          isActive
                            ? "text-propfirm-foreground"
                            : disabled
                              ? "text-muted-foreground/40 cursor-not-allowed"
                              : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Phase description */}
                <p className="text-xs text-muted-foreground">
                  {activeTab === 'step1' && 'Configure Step 1 challenge parameters.'}
                  {activeTab === 'step2' && 'Configure Step 2 parameters. Fill both Step 1 & 2 for a 2-phase challenge.'}
                  {activeTab === 'instant' && 'Instant funded account — no profit target required.'}
                </p>
              </div>

              {/* Phase Fields with crossfade animation */}
              <div className="relative overflow-hidden">
                <div
                  key={activeTab}
                  className="animate-fade-in"
                >
                  {(() => {
                    const { data, setData } = getDataForTab(activeTab);
                    return renderPhaseFields(activeTab, data, setData);
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={handleCreate}
            disabled={!canCreate}
            className={cn(
              "w-full gap-2",
              mode === 'propfirm' && "bg-propfirm text-propfirm-foreground hover:bg-propfirm/90"
            )}
          >
            <Plus className="h-4 w-4" />
            Create Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
