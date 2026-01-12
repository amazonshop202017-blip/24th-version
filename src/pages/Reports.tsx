import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, BarChart2, AlertTriangle, Target, Tags, Calendar, TrendingUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const reportTabs = [
  { id: 'day-time', label: 'Day & Time', icon: Clock },
  { id: 'symbols', label: 'Symbols', icon: BarChart2 },
  { id: 'risk', label: 'Risk', icon: AlertTriangle },
  { id: 'strategies', label: 'Strategies', icon: Target },
  { id: 'tags', label: 'Tags', icon: Tags },
  { id: 'options-dte', label: 'Options: Days till expiration', icon: Calendar },
  { id: 'wins-vs-losses', label: 'Wins vs Losses', icon: TrendingUp },
];

const Reports = () => {
  const [activeTab, setActiveTab] = useState('day-time');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const activeReport = reportTabs.find(tab => tab.id === activeTab);

  const handleSelectReport = (tabId: string) => {
    setActiveTab(tabId);
    setIsDropdownOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Reports Sub-Navigation Menu */}
      <div className="relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
            "bg-primary/10 text-primary hover:bg-primary/20",
            isDropdownOpen && "bg-primary/20"
          )}
        >
          {activeReport && <activeReport.icon className="w-4 h-4" />}
          <span>Reports: {activeReport?.label}</span>
          <ChevronDown className={cn(
            "w-4 h-4 transition-transform duration-200",
            isDropdownOpen && "rotate-180"
          )} />
        </button>

        <AnimatePresence>
          {isDropdownOpen && (
            <>
              {/* Backdrop to close dropdown */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsDropdownOpen(false)} 
              />
              
              {/* Dropdown Menu */}
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 top-full mt-2 z-50 min-w-[220px] py-2 rounded-lg border border-border bg-card shadow-xl"
              >
                {reportTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleSelectReport(tab.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors",
                      activeTab === tab.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                  >
                    <tab.icon className="w-4 h-4 flex-shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Report Content Placeholder */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center min-h-[400px]"
      >
        {activeReport && (
          <>
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <activeReport.icon className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold mb-3">{activeReport.label}</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Detailed {activeReport.label.toLowerCase()} analysis and insights will be displayed here.
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default Reports;