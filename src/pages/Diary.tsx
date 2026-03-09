import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Image } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { DiaryFolderSidebar } from '@/components/diary/DiaryFolderSidebar';
import { DiaryNotesList } from '@/components/diary/DiaryNotesList';
import { DiaryNoteEditor } from '@/components/diary/DiaryNoteEditor';
import { cn } from '@/lib/utils';

const mainTabs = [
  { id: 'diary', label: 'Diary', icon: BookOpen },
  { id: 'screenshots', label: 'Screenshots', icon: Image },
];

const Diary = () => {
  const [activeMainTab, setActiveMainTab] = useState('diary');

  const activeMain = mainTabs.find(tab => tab.id === activeMainTab);

  return (
    <div className="h-[calc(100vh-8rem)]">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <PageHeader title="Diary" tooltip="Record your thoughts, emotions, and lessons to build self-awareness over time." />
      </motion.div>

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
          <div className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <Image className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold mb-3">Screenshots</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Screenshot gallery coming soon.
            </p>
          </div>
        ) : null}
      </motion.div>
    </div>
  );
};

export default Diary;
