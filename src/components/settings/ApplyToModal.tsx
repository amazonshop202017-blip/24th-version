import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';

interface ApplyToModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ApplyToModal = ({ open, onOpenChange }: ApplyToModalProps) => {
  const [emptyOnly, setEmptyOnly] = useState(false);
  const [overwrite, setOverwrite] = useState(false);

  const handleApply = () => {
    // UI only – no trade modifications
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Apply Settings</DialogTitle>
          <DialogDescription>
            Choose how this rule should be applied to your existing trades.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={emptyOnly}
              onCheckedChange={(v) => setEmptyOnly(!!v)}
              className="mt-0.5"
            />
            <div>
              <p className="text-sm font-medium">Apply to existing trades with empty fields only</p>
              <p className="text-xs text-muted-foreground">Only trades where the related field is null/empty.</p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={overwrite}
              onCheckedChange={(v) => setOverwrite(!!v)}
              className="mt-0.5"
            />
            <div>
              <p className="text-sm font-medium">Apply to existing trades and overwrite current values</p>
              <p className="text-xs text-muted-foreground">Replace existing values with this rule's values</p>
            </div>
          </label>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleApply}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
