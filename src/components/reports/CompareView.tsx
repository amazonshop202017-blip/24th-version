import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CompareGroupCard, CompareGroupFilters, getDefaultCompareGroupFilters } from './CompareGroupCard';

interface CompareViewProps {
  onGenerateReport?: (group1: CompareGroupFilters, group2: CompareGroupFilters) => void;
}

export const CompareView = ({ onGenerateReport }: CompareViewProps) => {
  const [group1Filters, setGroup1Filters] = useState<CompareGroupFilters>(getDefaultCompareGroupFilters());
  const [group2Filters, setGroup2Filters] = useState<CompareGroupFilters>(getDefaultCompareGroupFilters());

  const handleReset = () => {
    setGroup1Filters(getDefaultCompareGroupFilters());
    setGroup2Filters(getDefaultCompareGroupFilters());
  };

  const handleGenerateReport = () => {
    // Placeholder - just stores current selections
    // Actual comparison logic will be implemented later
    console.log('Generate Report clicked');
    console.log('Group 1 Filters:', group1Filters);
    console.log('Group 2 Filters:', group2Filters);
    
    if (onGenerateReport) {
      onGenerateReport(group1Filters, group2Filters);
    }
  };

  return (
    <div className="space-y-6">
      {/* Two Group Cards Side by Side */}
      <div className="flex gap-6">
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
    </div>
  );
};
