import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, TrendingUp, LayoutGrid, GitCompare } from 'lucide-react';
import OverviewStats from '@/components/reports/OverviewStats';
import YearlyCalendar from '@/components/reports/YearlyCalendar';
import { CompareView } from '@/components/reports/CompareView';
import WinsVsLosses from '@/components/reports/WinsVsLosses';
import { YearlyMonthlyOverview } from '@/components/reports/YearlyMonthlyOverview';
import { cn } from '@/lib/utils';

const mainTabs = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'reports', label: 'Wins vs Losses', icon: TrendingUp },
  { id: 'compare', label: 'Compare', icon: GitCompare },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
];

const Reports = () => {
  // Default to 'reports' which now shows Wins vs Losses directly
  const [activeMainTab, setActiveMainTab] = useState('reports');

  const activeMain = mainTabs.find(tab => tab.id === activeMainTab);

  const handleMainTabClick = (tab: typeof mainTabs[0]) => {
    setActiveMainTab(tab.id);
  };

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
            </button>

            {/* Active indicator */}
            {activeMainTab === tab.id && (
              <motion.div
                layoutId="activeTab"
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
      >
        {activeMainTab === 'overview' ? (
          <OverviewStats />
        ) : activeMainTab === 'calendar' ? (
          <div className="space-y-6">
            <YearlyMonthlyOverview />
            <YearlyCalendar />
          </div>
        ) : activeMainTab === 'compare' ? (
          <CompareView />
        ) : activeMainTab === 'reports' ? (
          <WinsVsLosses />
        ) : (
          <div className="glass-card rounded-2xl p-12 flex flex-col items-center justify-center min-h-[400px]">
            {activeMain && (
              <>
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                  <activeMain.icon className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-semibold mb-3">{activeMain.label}</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  {activeMain.label} content will be displayed here.
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
