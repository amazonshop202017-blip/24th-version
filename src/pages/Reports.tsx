import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, BarChart2, AlertTriangle, Target, Tags, Calendar, TrendingUp } from 'lucide-react';
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

  const activeReport = reportTabs.find(tab => tab.id === activeTab);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground mt-1">Deep dive into your trading performance</p>
      </motion.div>

      {/* Sub-Navigation Menu */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-xl p-1.5 flex flex-wrap gap-1"
      >
        {reportTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </motion.div>

      {/* Report Content Placeholder */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
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