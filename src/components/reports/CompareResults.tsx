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
  const { trades } = useFilteredTrades();

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
      {/* Statistics Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <CompareStatisticsTable groupNumber={1} stats={group1Stats} />
        <CompareStatisticsTable groupNumber={2} stats={group2Stats} />
      </div>

      {/* Overall Evaluation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <CompareOverallEvaluation groupNumber={1} stats={group1Stats} />
        <CompareOverallEvaluation groupNumber={2} stats={group2Stats} />
      </div>

      {/* Daily Cumulative P&L Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <CompareCumulativePnLChart 
          groupNumber={1} 
          data={group1PnLData} 
          dateRangeLabel={group1Stats.dateRangeLabel}
        />
        <CompareCumulativePnLChart 
          groupNumber={2} 
          data={group2PnLData} 
          dateRangeLabel={group2Stats.dateRangeLabel}
        />
      </div>
    </div>
  );
};
