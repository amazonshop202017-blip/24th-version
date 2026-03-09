import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Plus } from 'lucide-react';

export const METRIC_LIST = [
  { id: 'netPnl', name: 'Net P&L', description: 'Total net profit/loss with trade count' },
  { id: 'tradeWinRate', name: 'Trade Win %', description: 'Win rate based on individual trades' },
  { id: 'profitFactor', name: 'Profit Factor', description: 'Ratio of total profits to total losses' },
  { id: 'dayWinRate', name: 'Day Win %', description: 'Win rate based on trading days' },
  { id: 'avgWinLoss', name: 'Avg Win/Loss Ratio', description: 'Average winning trade vs average losing trade' },
];

interface MetricsLibraryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeMetrics: string[];
  onAddMetric: (metricId: string) => void;
}

export const MetricsLibraryModal = ({ open, onOpenChange, activeMetrics, onAddMetric }: MetricsLibraryModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Metrics Library</DialogTitle>
        </DialogHeader>
        <div className="space-y-1 max-h-[400px] overflow-y-auto">
          {METRIC_LIST.map((metric) => {
            const isActive = activeMetrics.includes(metric.id);
            return (
              <div
                key={metric.id}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{metric.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{metric.description}</p>
                </div>
                <Button
                  size="sm"
                  variant={isActive ? "secondary" : "outline"}
                  className="ml-3 shrink-0 text-xs h-8"
                  disabled={isActive}
                  onClick={() => onAddMetric(metric.id)}
                >
                  {isActive ? (
                    <>
                      <Check className="h-3.5 w-3.5 mr-1" />
                      Added
                    </>
                  ) : (
                    <>
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Insert
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};
