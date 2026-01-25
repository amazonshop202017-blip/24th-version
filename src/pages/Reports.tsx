import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, BarChart2, AlertTriangle, Target, Tags, Calendar, TrendingUp, ChevronDown, Zap, LayoutGrid, GitCompare } from 'lucide-react';
import OverviewStats from '@/components/reports/OverviewStats';
import YearlyCalendar from '@/components/reports/YearlyCalendar';
import { CompareView } from '@/components/reports/CompareView';
import { cn } from '@/lib/utils';

const mainTabs = [
  { id: 'performance', label: 'Performance', icon: Zap, isNew: true },
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'reports', label: 'Reports', icon: BarChart2, hasDropdown: true },
  { id: 'compare', label: 'Compare', icon: GitCompare },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
];

const reportSubTabs = [
  { id: 'day-time', label: 'Day & Time', icon: Clock },
  { id: 'symbols', label: 'Symbols', icon: BarChart2 },
  { id: 'risk', label: 'Risk', icon: AlertTriangle },
  { id: 'strategies', label: 'Strategies', icon: Target },
  { id: 'tags', label: 'Tags', icon: Tags },
  { id: 'options-dte', label: 'Options: Days till expiration', icon: Calendar },
  { id: 'wins-vs-losses', label: 'Wins vs Losses', icon: TrendingUp },
];

const Reports = () => {
  const [activeMainTab, setActiveMainTab] = useState('reports');
  const [activeReportTab, setActiveReportTab] = useState('day-time');
  const [isReportsDropdownOpen, setIsReportsDropdownOpen] = useState(false);

  const activeReport = reportSubTabs.find(tab => tab.id === activeReportTab);
  const activeMain = mainTabs.find(tab => tab.id === activeMainTab);

  const handleSelectReport = (tabId: string) => {
    setActiveReportTab(tabId);
    setIsReportsDropdownOpen(false);
  };

  const handleMainTabClick = (tab: typeof mainTabs[0]) => {
    if (tab.hasDropdown) {
      setIsReportsDropdownOpen(!isReportsDropdownOpen);
      setActiveMainTab('reports');
    } else {
      setActiveMainTab(tab.id);
      setIsReportsDropdownOpen(false);
    }
  };

  const getContentInfo = () => {
    if (activeMainTab === 'reports' && activeReport) {
      return { icon: activeReport.icon, label: activeReport.label };
    }
    if (activeMain) {
      return { icon: activeMain.icon, label: activeMain.label };
    }
    return null;
  };

  const contentInfo = getContentInfo();

  return (
    <div className="space-y-6">
      {/* Sub-Navigation Menu */}
      <div className="flex items-center gap-1 border-b border-border pb-2">
        {mainTabs.map((tab) => (
          <div key={tab.id} className="relative">
            <button
              onClick={() => handleMainTabClick(tab)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                activeMainTab === tab.id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.isNew && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-primary text-primary-foreground rounded">
                  NEW
                </span>
              )}
              {tab.hasDropdown && (
                <ChevronDown className={cn(
                  "w-3.5 h-3.5 transition-transform duration-200",
                  isReportsDropdownOpen && activeMainTab === 'reports' && "rotate-180"
                )} />
              )}
            </button>

            {/* Active indicator */}
            {activeMainTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-[-9px] left-0 right-0 h-0.5 bg-primary"
              />
            )}

            {/* Reports Dropdown */}
            <AnimatePresence>
              {tab.hasDropdown && isReportsDropdownOpen && activeMainTab === 'reports' && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsReportsDropdownOpen(false)} 
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 top-full mt-3 z-50 min-w-[220px] py-2 rounded-lg border border-border bg-card shadow-xl"
                  >
                    {reportSubTabs.map((subTab) => (
                      <button
                        key={subTab.id}
                        onClick={() => handleSelectReport(subTab.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors",
                          activeReportTab === subTab.id
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                      >
                        <subTab.icon className="w-4 h-4 flex-shrink-0" />
                        <span>{subTab.label}</span>
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Content */}
      <motion.div
        key={activeMainTab === 'reports' ? activeReportTab : activeMainTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {activeMainTab === 'overview' ? (
          <OverviewStats />
        ) : activeMainTab === 'calendar' ? (
          <YearlyCalendar />
        ) : activeMainTab === 'compare' ? (
          <CompareView />
        ) : (
          <div className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center min-h-[400px]">
            {contentInfo && (
              <>
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                  <contentInfo.icon className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold mb-3">{contentInfo.label}</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  {activeMainTab === 'reports' 
                    ? `Detailed ${contentInfo.label.toLowerCase()} analysis and insights will be displayed here.`
                    : `${contentInfo.label} content will be displayed here.`
                  }
                </p>
              </>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Reports;