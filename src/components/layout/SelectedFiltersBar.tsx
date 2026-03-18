import { useMemo } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGlobalFilters, DayFilter, OutcomeFilter, DirectionFilter, ReturnPercentRange, RMultipleRange } from '@/contexts/GlobalFiltersContext';
import { useStrategiesContext } from '@/contexts/StrategiesContext';
import { useCategoriesContext } from '@/contexts/CategoriesContext';
import { useTagsContext } from '@/contexts/TagsContext';

interface FilterChip {
  id: string;
  label: string;
  value: string;
  onRemove: () => void;
}

const DAY_LABELS: Record<DayFilter, string> = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
};

const OUTCOME_LABELS: Record<OutcomeFilter, string> = {
  win: 'Win', loss: 'Loss', breakeven: 'Breakeven',
};

const DIRECTION_LABELS: Record<DirectionFilter, string> = {
  long: 'Long', short: 'Short',
};

const RETURN_LABELS: Record<ReturnPercentRange, string> = {
  '<0': '< 0%', '0-1': '0–1%', '1-2': '1–2%', '3-5': '3–5%', '5-10': '5–10%', '>10': '> 10%',
};

const R_MULTIPLE_LABELS: Record<RMultipleRange, string> = {
  '<-2': '< -2R', '-2-0': '-2R to 0R', '0-1': '0R to 1R', '1-2': '1R to 2R', '2-4': '2R to 4R', '>4': '> 4R',
};

export const SelectedFiltersBar = () => {
  const {
    selectedSymbols, setSelectedSymbols,
    selectedOutcomes, setSelectedOutcomes,
    selectedHours, setSelectedHours,
    selectedSetups, setSelectedSetups,
    selectedDays, setSelectedDays,
    lastTradesFilter, setLastTradesFilter,
    selectedDirections, setSelectedDirections,
    selectedReturnRanges, setSelectedReturnRanges,
    selectedRMultipleRanges, setSelectedRMultipleRanges,
    selectedYear, setSelectedYear,
    selectedChecklistItems, setSelectedChecklistItems,
    selectedTagsByCategory, setSelectedTagsByCategory,
    selectedTradeComments, setSelectedTradeComments,
    selectedAccounts, setSelectedAccounts,
    datePreset, applyDatePreset,
  } = useGlobalFilters();

  const { strategies } = useStrategiesContext();
  const { categories } = useCategoriesContext();
  const { tags } = useTagsContext();

  const chips = useMemo<FilterChip[]>(() => {
    const result: FilterChip[] = [];

    if (datePreset !== 'all') {
      const presetLabels: Record<string, string> = {
        today: 'Today', this_week: 'This Week', this_month: 'This Month',
        last_30_days: 'Last 30 Days', last_month: 'Last Month',
        this_quarter: 'This Quarter', ytd: 'YTD', custom: 'Custom Range',
      };
      result.push({
        id: 'date', label: 'Date', value: presetLabels[datePreset] || datePreset,
        onRemove: () => applyDatePreset('all'),
      });
    }

    selectedAccounts.forEach(acc => {
      result.push({
        id: `account-${acc}`, label: 'Account', value: acc,
        onRemove: () => setSelectedAccounts(selectedAccounts.filter(a => a !== acc)),
      });
    });

    selectedSymbols.forEach(sym => {
      result.push({
        id: `symbol-${sym}`, label: 'Symbol', value: sym,
        onRemove: () => setSelectedSymbols(selectedSymbols.filter(s => s !== sym)),
      });
    });

    selectedSetups.forEach(setupId => {
      const name = strategies.find(s => s.id === setupId)?.name || setupId;
      result.push({
        id: `setup-${setupId}`, label: 'Setup', value: name,
        onRemove: () => setSelectedSetups(selectedSetups.filter(s => s !== setupId)),
      });
    });

    selectedChecklistItems.forEach(item => {
      result.push({
        id: `checklist-${item}`, label: 'Checklist', value: item,
        onRemove: () => setSelectedChecklistItems(selectedChecklistItems.filter(i => i !== item)),
      });
    });

    selectedOutcomes.forEach(o => {
      result.push({
        id: `outcome-${o}`, label: 'Outcome', value: OUTCOME_LABELS[o],
        onRemove: () => setSelectedOutcomes(selectedOutcomes.filter(x => x !== o)),
      });
    });

    selectedDirections.forEach(d => {
      result.push({
        id: `direction-${d}`, label: 'Direction', value: DIRECTION_LABELS[d],
        onRemove: () => setSelectedDirections(selectedDirections.filter(x => x !== d)),
      });
    });

    if (selectedYear !== null) {
      result.push({
        id: 'year', label: 'Year', value: selectedYear.toString(),
        onRemove: () => setSelectedYear(null),
      });
    }

    selectedDays.forEach(d => {
      result.push({
        id: `day-${d}`, label: 'Day', value: DAY_LABELS[d],
        onRemove: () => setSelectedDays(selectedDays.filter(x => x !== d)),
      });
    });

    selectedHours.forEach(h => {
      result.push({
        id: `hour-${h}`, label: 'Hour', value: `${h.toString().padStart(2, '0')}:00`,
        onRemove: () => setSelectedHours(selectedHours.filter(x => x !== h)),
      });
    });

    if (lastTradesFilter !== null) {
      result.push({
        id: 'last-trades', label: 'Last Trades', value: lastTradesFilter.toString(),
        onRemove: () => setLastTradesFilter(null),
      });
    }

    selectedReturnRanges.forEach(r => {
      result.push({
        id: `return-${r}`, label: 'Return %', value: RETURN_LABELS[r],
        onRemove: () => setSelectedReturnRanges(selectedReturnRanges.filter(x => x !== r)),
      });
    });

    selectedRMultipleRanges.forEach(r => {
      result.push({
        id: `rmultiple-${r}`, label: 'R-Multiple', value: R_MULTIPLE_LABELS[r],
        onRemove: () => setSelectedRMultipleRanges(selectedRMultipleRanges.filter(x => x !== r)),
      });
    });

    Object.entries(selectedTagsByCategory).forEach(([categoryId, tagIds]) => {
      const categoryName = categories.find(c => c.id === categoryId)?.name || 'Tag';
      tagIds.forEach(tagId => {
        const tagName = tags.find(t => t.id === tagId)?.name || tagId;
        result.push({
          id: `tag-${categoryId}-${tagId}`, label: categoryName, value: tagName,
          onRemove: () => {
            const remaining = tagIds.filter(id => id !== tagId);
            if (remaining.length === 0) {
              const { [categoryId]: _, ...rest } = selectedTagsByCategory;
              setSelectedTagsByCategory(rest);
            } else {
              setSelectedTagsByCategory({ ...selectedTagsByCategory, [categoryId]: remaining });
            }
          },
        });
      });
    });

    (['entryComments', 'tradeManagements', 'exitComments'] as const).forEach(category => {
      const labelMap = { entryComments: 'Entry Comment', tradeManagements: 'Trade Mgmt', exitComments: 'Exit Comment' };
      selectedTradeComments[category].forEach(comment => {
        result.push({
          id: `comment-${category}-${comment}`, label: labelMap[category], value: comment,
          onRemove: () => {
            setSelectedTradeComments({
              ...selectedTradeComments,
              [category]: selectedTradeComments[category].filter(c => c !== comment),
            });
          },
        });
      });
    });

    return result;
  }, [
    datePreset, selectedAccounts, selectedSymbols, selectedSetups, selectedChecklistItems,
    selectedOutcomes, selectedDirections, selectedYear, selectedDays, selectedHours,
    lastTradesFilter, selectedReturnRanges, selectedRMultipleRanges,
    selectedTagsByCategory, selectedTradeComments, strategies, categories, tags,
  ]);

  const clearAll = () => {
    applyDatePreset('all');
    setSelectedAccounts([]);
    setSelectedSymbols([]);
    setSelectedOutcomes([]);
    setSelectedHours([]);
    setSelectedSetups([]);
    setSelectedDays([]);
    setLastTradesFilter(null);
    setSelectedDirections([]);
    setSelectedReturnRanges([]);
    setSelectedRMultipleRanges([]);
    setSelectedYear(null);
    setSelectedChecklistItems([]);
    setSelectedTagsByCategory({});
    setSelectedTradeComments({ entryComments: [], tradeManagements: [], exitComments: [] });
  };

  if (chips.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-6 py-1.5 border-b border-border/50 bg-muted/20 flex-wrap">
      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider shrink-0">Filters</span>
      {chips.map((chip) => (
        <div
          key={chip.id}
          className="inline-flex items-center gap-1.5 bg-muted/70 text-foreground rounded-md px-2.5 py-1 text-xs"
        >
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{chip.label}</span>
          <span className="font-medium">{chip.value}</span>
          <button
            onClick={chip.onRemove}
            className="ml-0.5 rounded-full p-0.5 hover:bg-foreground/10 transition-colors"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground gap-1 shrink-0"
        onClick={clearAll}
      >
        <X className="w-3 h-3" />
        Clear
      </Button>
    </div>
  );
};
