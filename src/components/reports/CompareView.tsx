import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CompareGroupCard, CompareGroupFilters, getDefaultCompareGroupFilters } from './CompareGroupCard';
import { CompareResults } from './CompareResults';

interface CompareViewProps {
  onGenerateReport?: (group1: CompareGroupFilters, group2: CompareGroupFilters) => void;
}

export const CompareView = ({ onGenerateReport }: CompareViewProps) => {
  const [showResults, setShowResults] = useState(false);
  const [reportFilters, setReportFilters] = useState<{
    group1: CompareGroupFilters;
    group2: CompareGroupFilters;
  } | null>(null);
  const [group1Filters, setGroup1Filters] = useState<CompareGroupFilters>(getDefaultCompareGroupFilters());
  const [group2Filters, setGroup2Filters] = useState<CompareGroupFilters>(getDefaultCompareGroupFilters());

  const handleReset = () => {
    setGroup1Filters(getDefaultCompareGroupFilters());
    setGroup2Filters(getDefaultCompareGroupFilters());
    setShowResults(false);
    setReportFilters(null);
  };

  const handleGenerateReport = () => {
    // Store current filter state for the report
    setReportFilters({
      group1: { ...group1Filters },
      group2: { ...group2Filters },
    });
    setShowResults(true);
    
    if (onGenerateReport) {
      onGenerateReport(group1Filters, group2Filters);
    }
  };

  return (
    <div className="space-y-6">
      {/* Two Group Cards Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <CompareGroupCard
          groupNumber={1}
          filters={group1Filters}
          onFiltersChange={setGroup1Filters}
        />
        <CompareGroupCard
          groupNumber={2}
          filters={group2Filters}
          onFiltersChange={setGroup2Filters}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button
          variant="default"
          onClick={handleReset}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-6"
        >
          RESET
        </Button>
        <Button
          variant="default"
          onClick={handleGenerateReport}
          className="bg-primary hover:bg-primary/90 text-primary-foreground px-6"
        >
          GENERATE REPORT
        </Button>
      </div>

      {/* Comparison Results */}
      {showResults && reportFilters && (
        <CompareResults
          group1Filters={reportFilters.group1}
          group2Filters={reportFilters.group2}
        />
      )}
    </div>
  );
};
