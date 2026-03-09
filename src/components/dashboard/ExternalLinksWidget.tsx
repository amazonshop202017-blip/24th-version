import { useState, useEffect } from 'react';
import { Settings, ExternalLink } from 'lucide-react';
import { ExternalLinksSettingsModal } from './ExternalLinksSettingsModal';

export interface ExternalLinkItem {
  id: string;
  url: string;
  title: string;
}

const STORAGE_KEY = 'dashboard-external-links';

export const ExternalLinksWidget = () => {
  const [links, setLinks] = useState<ExternalLinkItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
  }, [links]);

  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return null;
    }
  };

  const handleSave = (newLinks: ExternalLinkItem[]) => {
    setLinks(newLinks);
    setIsSettingsOpen(false);
  };

  return (
    <div className="glass-card rounded-xl p-4 h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium">External Links</span>
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-1.5 rounded-md hover:bg-muted transition-colors"
        >
          <Settings className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        {links.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No links added. Click the gear icon to add external links.
          </p>
        ) : (
          links.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 p-2 rounded-lg border border-border hover:bg-muted/50 transition-colors min-w-[60px]"
            >
              <div className="h-10 w-10 rounded-md border border-border bg-background flex items-center justify-center overflow-hidden">
                {getFaviconUrl(link.url) ? (
                  <img
                    src={getFaviconUrl(link.url)!}
                    alt=""
                    className="h-6 w-6"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                {link.title || new URL(link.url).hostname.replace('www.', '')}
              </span>
            </a>
          ))
        )}
      </div>

      <ExternalLinksSettingsModal
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        links={links}
        onSave={handleSave}
      />
    </div>
  );
};
