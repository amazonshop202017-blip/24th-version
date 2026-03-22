import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Image, Check, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { format } from 'date-fns';
import { DiaryFolderSidebar } from '@/components/diary/DiaryFolderSidebar';
import { DiaryNotesList } from '@/components/diary/DiaryNotesList';
import { DiaryNoteEditor } from '@/components/diary/DiaryNoteEditor';
import { useScreenshotTagsContext } from '@/contexts/ScreenshotTagsContext';
import { useFilteredTrades } from '@/hooks/useFilteredTrades';
import { useTradeModal } from '@/contexts/TradeModalContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trade, TradeScreenshot, calculateTradeMetrics } from '@/types/trade';
import { cn } from '@/lib/utils';

const mainTabs = [
  { id: 'diary', label: 'Diary', icon: BookOpen },
  { id: 'screenshots', label: 'Screenshots', icon: Image },
];

const Diary = () => {
  const [activeMainTab, setActiveMainTab] = useState('diary');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [viewingScreenshot, setViewingScreenshot] = useState<string | null>(null);
  const { screenshotTags } = useScreenshotTagsContext();
  const { filteredTrades: trades } = useFilteredTrades();
  const { openModal } = useTradeModal();

  const activeMain = mainTabs.find(tab => tab.id === activeMainTab);

  const toggleTag = (tagId: string) => {
    setSelectedTagIds(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  // Get trades with screenshots (for the table)
  const tradesWithScreenshots = useMemo(() => {
    return trades.filter(trade => trade.screenshots && trade.screenshots.length > 0);
  }, [trades]);

  // Get screenshot for a trade and tag
  const getScreenshotForTag = (trade: Trade, tagId: string): TradeScreenshot | undefined => {
    return trade.screenshots?.find(s => s.tagId === tagId);
  };

  // Get selected tags info
  const selectedTags = useMemo(() => {
    return screenshotTags.filter(tag => selectedTagIds.includes(tag.id));
  }, [screenshotTags, selectedTagIds]);

  // Format currency
  const formatCurrency = (value: number) => {
    const formatted = Math.abs(value).toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
    return value >= 0 ? `$${formatted}` : `-$${formatted}`;
  };

  return (
    <div className="h-[calc(100vh-8rem)]">
      {/* Sub-Navigation Menu */}
      <div className="flex items-center gap-1 border-b border-border pb-2 mb-4">
        {mainTabs.map((tab) => (
          <div key={tab.id} className="relative">
            <button
              onClick={() => setActiveMainTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                activeMainTab === tab.id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>

            {/* Active indicator */}
            {activeMainTab === tab.id && (
              <motion.div
                layoutId="diaryActiveTab"
                className="absolute bottom-[-9px] left-0 right-0 h-0.5 bg-primary"
              />
            )}
          </div>
        ))}
      </div>

      {/* Content */}
      <motion.div
        key={activeMainTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={activeMainTab === 'diary' ? "h-[calc(100%-8rem)]" : ""}
      >
        {activeMainTab === 'diary' ? (
          <div className="glass-card rounded-2xl overflow-hidden h-full">
            <div className="grid grid-cols-[220px_280px_1fr] h-full">
              {/* Left Column - Folder Navigation */}
              <DiaryFolderSidebar />
              
              {/* Middle Column - Notes List */}
              <DiaryNotesList />
              
              {/* Right Column - Note Editor */}
              <DiaryNoteEditor />
            </div>
          </div>
        ) : activeMainTab === 'screenshots' ? (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-9">
                    <Image className="w-4 h-4 mr-2" />
                    {selectedTagIds.length > 0 
                      ? `${selectedTagIds.length} tag${selectedTagIds.length > 1 ? 's' : ''} selected`
                      : 'Select Tags'
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="start">
                  <div className="space-y-1">
                    {screenshotTags.length === 0 ? (
                      <p className="text-sm text-muted-foreground px-2 py-1.5">
                        No tags available
                      </p>
                    ) : (
                      screenshotTags.map((tag) => (
                        <button
                          key={tag.id}
                          onClick={() => toggleTag(tag.id)}
                          className={cn(
                            "flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm transition-colors",
                            selectedTagIds.includes(tag.id)
                              ? "bg-primary/10 text-primary"
                              : "hover:bg-muted"
                          )}
                        >
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: tag.color }}
                          />
                          <span className="flex-1 text-left">{tag.name}</span>
                          {selectedTagIds.includes(tag.id) && (
                            <Check className="w-4 h-4" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Table */}
            <div className="glass-card rounded-2xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground font-medium">Date</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Symbol</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Direction</TableHead>
                    <TableHead className="text-muted-foreground font-medium text-right">Gross P&L</TableHead>
                    {selectedTags.map((tag) => (
                      <TableHead 
                        key={tag.id} 
                        className="text-muted-foreground font-medium text-center min-w-[100px]"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <div 
                            className="w-2.5 h-2.5 rounded-full" 
                            style={{ backgroundColor: tag.color }}
                          />
                          {tag.name}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tradesWithScreenshots.length === 0 ? (
                    <TableRow>
                      <TableCell 
                        colSpan={4 + selectedTags.length} 
                        className="text-center py-12 text-muted-foreground"
                      >
                        No trades with screenshots found
                      </TableCell>
                    </TableRow>
                  ) : (
                    tradesWithScreenshots.map((trade) => {
                      const metrics = calculateTradeMetrics(trade);
                      const tradeDate = metrics.openDate 
                        ? format(new Date(metrics.openDate), 'MMM dd, yyyy')
                        : '-';
                      
                      return (
                        <TableRow 
                          key={trade.id} 
                          className="border-border hover:bg-muted/50"
                        >
                          <TableCell 
                            className="cursor-pointer hover:text-primary transition-colors"
                            onClick={() => openModal(trade)}
                          >
                            {tradeDate}
                          </TableCell>
                          <TableCell 
                            className="font-medium cursor-pointer hover:text-primary transition-colors"
                            onClick={() => openModal(trade)}
                          >
                            {trade.symbol}
                          </TableCell>
                          <TableCell 
                            className="cursor-pointer"
                            onClick={() => openModal(trade)}
                          >
                            <div className={cn(
                              "flex items-center gap-1.5",
                              trade.side === 'LONG' ? "text-emerald-500" : "text-rose-500"
                            )}>
                              {trade.side === 'LONG' ? (
                                <ArrowUpRight className="w-4 h-4" />
                              ) : (
                                <ArrowDownRight className="w-4 h-4" />
                              )}
                              {trade.side}
                            </div>
                          </TableCell>
                          <TableCell 
                            className={cn(
                              "text-right font-medium cursor-pointer hover:opacity-80 transition-opacity",
                              metrics.grossPnl >= 0 ? "text-emerald-500" : "text-rose-500"
                            )}
                            onClick={() => openModal(trade)}
                          >
                            {formatCurrency(metrics.grossPnl)}
                          </TableCell>
                          {selectedTags.map((tag) => {
                            const screenshot = getScreenshotForTag(trade, tag.id);
                            return (
                              <TableCell key={tag.id} className="text-center">
                                {screenshot ? (
                                  <div 
                                    className="inline-block cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => setViewingScreenshot(screenshot.imageData)}
                                  >
                                    <img 
                                      src={screenshot.imageData} 
                                      alt={`${tag.name} screenshot`}
                                      className="w-16 h-12 object-cover rounded border border-border hover:border-primary transition-colors"
                                    />
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground text-xs">-</span>
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : null}
      </motion.div>

      {/* Fullscreen Screenshot Dialog */}
      <Dialog open={!!viewingScreenshot} onOpenChange={(open) => !open && setViewingScreenshot(null)}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden bg-background/95 backdrop-blur">
          {viewingScreenshot && (
            <img
              src={viewingScreenshot}
              alt="Screenshot fullscreen"
              className="w-full h-full object-contain max-h-[85vh]"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Diary;
