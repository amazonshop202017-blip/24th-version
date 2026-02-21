import { useState, useMemo, useRef, useEffect } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { Account } from '@/contexts/AccountsContext';

interface MultiAccountSelectProps {
  accounts: Account[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
}

export const MultiAccountSelect = ({
  accounts,
  selectedIds,
  onChange,
  placeholder = 'Select accounts...',
}: MultiAccountSelectProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearch('');
    }
  }, [open]);

  const filtered = useMemo(
    () => accounts.filter(a => a.name.toLowerCase().includes(search.toLowerCase())),
    [accounts, search]
  );

  const allSelected = accounts.length > 0 && selectedIds.length === accounts.length;

  const toggleAccount = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter(i => i !== id)
        : [...selectedIds, id]
    );
  };

  const toggleAll = () => {
    onChange(allSelected ? [] : accounts.map(a => a.id));
  };

  const removeAccount = (id: string) => {
    onChange(selectedIds.filter(i => i !== id));
  };

  const selectedAccounts = accounts.filter(a => selectedIds.includes(a.id));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-input border-border min-h-[40px] h-auto"
        >
          <div className="flex flex-wrap gap-1 flex-1 text-left">
            {selectedAccounts.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              selectedAccounts.map(acc => (
                <Badge
                  key={acc.id}
                  variant="secondary"
                  className="text-xs gap-1 pr-1"
                >
                  {acc.name}
                  <span
                    role="button"
                    tabIndex={0}
                    className="ml-0.5 hover:text-foreground cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); removeAccount(acc.id); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); removeAccount(acc.id); } }}
                  >
                    <X className="w-3 h-3" />
                  </span>
                </Badge>
              ))
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <div className="p-2 border-b border-border">
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search accounts..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="max-h-60 overflow-y-auto p-1">
          {/* Select All */}
          <button
            type="button"
            onClick={toggleAll}
            className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <div className={cn(
              "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
              allSelected ? "bg-primary text-primary-foreground" : "opacity-50"
            )}>
              {allSelected && <Check className="h-3 w-3" />}
            </div>
            <span className="font-medium">Select All</span>
          </button>

          {filtered.map(acc => {
            const isSelected = selectedIds.includes(acc.id);
            return (
              <button
                key={acc.id}
                type="button"
                onClick={() => toggleAccount(acc.id)}
                className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <div className={cn(
                  "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                  isSelected ? "bg-primary text-primary-foreground" : "opacity-50"
                )}>
                  {isSelected && <Check className="h-3 w-3" />}
                </div>
                {acc.name}
              </button>
            );
          })}

          {filtered.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">No accounts found</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
