import { useState } from 'react';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChartDisplayType, getDisplayLabel } from '@/hooks/useChartDisplayMode';

interface DisplayOption {
  value: ChartDisplayType;
  label: string;
}

interface DisplayGroup {
  name: string;
  options: DisplayOption[];
}

interface ChartDisplayDropdownProps {
  value: ChartDisplayType;
  onValueChange: (value: ChartDisplayType) => void;
  className?: string;
}

// Display options grouped under "Others" for now
const displayGroups: DisplayGroup[] = [
  {
    name: 'Others',
    options: [
      { value: 'dollar', label: 'Return ($)' },
      { value: 'percent', label: 'Return (%)' },
      { value: 'winrate', label: 'Winrate (%)' },
      { value: 'tradecount', label: 'Trade Count' },
      { value: 'tickpip', label: 'Tick / Pip' },
    ],
  },
];

export const ChartDisplayDropdown = ({
  value,
  onValueChange,
  className,
}: ChartDisplayDropdownProps) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Others']));
  const [isOpen, setIsOpen] = useState(false);

  const toggleGroup = (groupName: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupName)) {
        next.delete(groupName);
      } else {
        next.add(groupName);
      }
      return next;
    });
  };

  const handleSelectOption = (optionValue: ChartDisplayType) => {
    onValueChange(optionValue);
    setIsOpen(false);
  };

  const currentLabel = getDisplayLabel(value);

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-8 w-[140px] justify-between bg-background border-border text-xs font-normal',
            className
          )}
        >
          <span className="truncate">{currentLabel}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[200px] bg-popover border-border p-1 z-50"
      >
        {displayGroups.map((group) => {
          const isExpanded = expandedGroups.has(group.name);
          return (
            <div key={group.name}>
              {/* Group Header - Clickable to expand/collapse */}
              <button
                type="button"
                onClick={(e) => toggleGroup(group.name, e)}
                className="flex items-center justify-between w-full px-2 py-1.5 text-sm text-foreground hover:bg-accent hover:text-accent-foreground rounded-sm cursor-pointer"
              >
                <span>{group.name}</span>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>

              {/* Sub-options - Only visible when expanded */}
              {isExpanded && (
                <div className="pl-2">
                  {group.options.map((option) => {
                    const isSelected = value === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleSelectOption(option.value)}
                        className={cn(
                          'flex items-center w-full px-2 py-1.5 text-sm rounded-sm cursor-pointer',
                          isSelected
                            ? 'bg-primary/10 text-primary'
                            : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                      >
                        <span className="w-5 shrink-0">
                          {isSelected && <Check className="h-4 w-4" />}
                        </span>
                        <span>{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
