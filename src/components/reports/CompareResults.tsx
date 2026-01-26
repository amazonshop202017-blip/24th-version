import { useMemo } from 'react';
import { useFilteredTrades } from '@/hooks/useFilteredTrades';
import { CompareGroupFilters } from './CompareGroupCard';
import { CompareStatisticsTable } from './CompareStatisticsTable';
import { CompareOverallEvaluation } from './CompareOverallEvaluation';
import { CompareCumulativePnLChart } from './CompareCumulativePnLChart';
import { calculateGroupStats, calculateDailyCumulativePnL } from '@/lib/compareUtils';

interface CompareResultsProps {
  group1Filters: CompareGroupFilters;
  group2Filters: CompareGroupFilters;
}

export const CompareResults = ({ group1Filters, group2Filters }: CompareResultsProps) => {
  const { trades } = useFilteredTradesContext();

  // Calculate stats for both groups
  const group1Stats = useMemo(() => 
    calculateGroupStats(trades, group1Filters), 
    [trades, group1Filters]
  );
  
  const group2Stats = useMemo(() => 
    calculateGroupStats(trades, group2Filters), 
    [trades, group2Filters]
  );

  // Calculate cumulative P&L data for both groups
  const group1PnLData = useMemo(() => 
    calculateDailyCumulativePnL(trades, group1Filters), 
    [trades, group1Filters]
  );
  
  const group2PnLData = useMemo(() => 
    calculateDailyCumulativePnL(trades, group2Filters), 
    [trades, group2Filters]
  );

  return (
    <div className="space-y-6">
      {/* Statistics Tables - Side by Side */}
      <div className="flex gap-6">
        <div className="flex-1">
          <CompareStatisticsTable groupNumber={1} stats={group1Stats} />
        </div>
        <div className="flex-1">
          <CompareStatisticsTable groupNumber={2} stats={group2Stats} />
        </div>
      </div>

      {/* Overall Evaluation - Side by Side */}
      <div className="flex gap-6">
        <div className="flex-1">
          <CompareOverallEvaluation groupNumber={1} stats={group1Stats} />
        </div>
        <div className="flex-1">
          <CompareOverallEvaluation groupNumber={2} stats={group2Stats} />
        </div>
      </div>

      {/* Daily Cumulative P&L Charts - Side by Side */}
      <div className="flex gap-6">
        <div className="flex-1">
          <CompareCumulativePnLChart 
            groupNumber={1} 
            data={group1PnLData} 
            dateRangeLabel={group1Stats.dateRangeLabel}
          />
        </div>
        <div className="flex-1">
          <CompareCumulativePnLChart 
            groupNumber={2} 
            data={group2PnLData} 
            dateRangeLabel={group2Stats.dateRangeLabel}
          />
        </div>
      </div>
    </div>
  );
};
