import { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accountName: string;
  onConfirm: () => void;
}

export const DeleteAccountDialog = ({ open, onOpenChange, accountName, onConfirm }: DeleteAccountDialogProps) => {
  const [confirmText, setConfirmText] = useState('');
  const isMatch = confirmText.trim() === accountName;

  const handleOpenChange = (val: boolean) => {
    if (!val) setConfirmText('');
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md border-destructive/30">
        <DialogHeader className="gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <Trash2 className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <DialogTitle>Delete Account</DialogTitle>
              <DialogDescription>This action cannot be undone</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 space-y-1">
          <div className="flex items-center gap-2 text-destructive font-semibold text-sm">
            <AlertTriangle className="h-4 w-4" />
            Warning
          </div>
          <p className="text-sm text-muted-foreground">
            You are about to permanently delete <span className="font-bold text-foreground">{accountName}</span> and all associated trade data. This action is irreversible.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm">
            Type <span className="font-bold text-destructive">{accountName}</span> to confirm
          </p>
          <Input
            placeholder="Enter account name"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className={confirmText.length > 0 && !isMatch ? 'border-destructive/50 focus-visible:ring-destructive/30' : ''}
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={!isMatch}
            onClick={() => { onConfirm(); handleOpenChange(false); }}
            className="flex-1 gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
