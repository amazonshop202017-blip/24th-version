import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GripVertical, Trash2, ExternalLink } from 'lucide-react';
import { ExternalLinkItem } from './ExternalLinksWidget';

interface ExternalLinksSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  links: ExternalLinkItem[];
  onSave: (links: ExternalLinkItem[]) => void;
}

export const ExternalLinksSettingsModal = ({
  open,
  onOpenChange,
  links,
  onSave,
}: ExternalLinksSettingsModalProps) => {
  const [localLinks, setLocalLinks] = useState<ExternalLinkItem[]>(links);
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setLocalLinks(links);
      setNewUrl('');
      setNewTitle('');
    }
    onOpenChange(isOpen);
  };

  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return null;
    }
  };

  const normalizeUrl = (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return trimmed;
    if (!/^https?:\/\//i.test(trimmed)) {
      return `https://${trimmed}`;
    }
    return trimmed;
  };

  const handleAdd = () => {
    if (!newUrl.trim()) return;

    const newLink: ExternalLinkItem = {
      id: crypto.randomUUID(),
      url: normalizeUrl(newUrl),
      title: newTitle.trim(),
    };

    setLocalLinks([...localLinks, newLink]);
    setNewUrl('');
    setNewTitle('');
  };

  const handleRemove = (id: string) => {
    setLocalLinks(localLinks.filter((link) => link.id !== id));
  };

  const handleSave = () => {
    onSave(localLinks);
  };

  const canAdd = newUrl.trim() && isValidUrl(newUrl);

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            External Links
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add new link inputs */}
          <div className="flex gap-2">
            <Input
              placeholder="Enter URL..."
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="flex-1 h-9 text-sm"
            />
            <Input
              placeholder="Title (optional)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="flex-1 h-9 text-sm"
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={handleAdd}
              disabled={!canAdd}
              className="h-9"
            >
              Add
            </Button>
          </div>

          {/* Links list */}
          <div className="space-y-1 max-h-[250px] overflow-y-auto">
            {localLinks.map((link) => (
              <div
                key={link.id}
                className="flex items-center gap-2 px-2 py-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab" />
                <div className="h-8 w-8 rounded border border-border bg-background flex items-center justify-center shrink-0">
                  {getFaviconUrl(link.url) ? (
                    <img
                      src={getFaviconUrl(link.url)!}
                      alt=""
                      className="h-5 w-5"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline truncate max-w-[120px]"
                >
                  {link.url}
                </a>
                <span className="text-xs text-muted-foreground truncate flex-1">
                  {link.title || '-'}
                </span>
                <button
                  onClick={() => handleRemove(link.id)}
                  className="p-1.5 rounded hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </button>
              </div>
            ))}
            {localLinks.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                No links added yet
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
