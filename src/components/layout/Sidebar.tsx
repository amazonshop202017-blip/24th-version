import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, ListOrdered, FileText, Target, Plus, ChevronLeft, ChevronRight, BarChart3, ChevronDown, Crosshair } from 'lucide-react';
import logo from '@/assets/logo.svg';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { useTradeModal } from '@/contexts/TradeModalContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

import { Calendar, BookOpen } from 'lucide-react';
import { SidebarAccountMenu } from './SidebarAccountMenu';

// Section 1: Dashboard (standalone)
const dashboardItem = { icon: LayoutDashboard, label: 'Dashboard', path: '/' };

// Section 2: Trading Views
const tradingViewItems = [
  { icon: ListOrdered, label: 'Trades', path: '/trades' },
  { icon: Calendar, label: 'Day View', path: '/day-view' },
  { icon: BookOpen, label: 'Diary', path: '/diary' },
];

// Section 3: Analysis & Planning
const analysisItems = [
  { icon: Target, label: 'Setups', path: '/strategies' },
  { icon: FileText, label: 'Reports', path: '/reports' },
  { icon: Crosshair, label: 'Exit Analyzer', path: '/exit-analyzer' },
];

const chartRoomItems = [
  { label: 'Drawdown', path: '/chart-room/drawdown' },
  { label: 'Consecutive Winners/Losers', path: '/chart-room/consecutive' },
  { label: 'Exit Analysis', path: '/chart-room/exit-analysis' },
  { label: 'Holding Time', path: '/chart-room/holding-time' },
  { label: 'Performance by Symbol', path: '/chart-room/performance-by-symbol' },
  { label: 'Performance by Setup', path: '/chart-room/performance-by-setup' },
  { label: 'Performance by Time', path: '/chart-room/performance-by-time' },
  { label: 'Tags/Comments Analysis', path: '/chart-room/tags-analytics' },
  { label: 'Risk Distribution', path: '/chart-room/risk-distribution' },
  { label: 'Trade Management', path: '/chart-room/trade-management' },
];

const NavItem = ({ icon: Icon, label, path, isCollapsed }: { icon: any; label: string; path: string; isCollapsed: boolean }) => {
  const location = useLocation();
  const isActive = path === '/' 
    ? location.pathname === path 
    : location.pathname === path || (path === '/reports' && location.pathname.startsWith('/reports'));

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <NavLink to={path} className="block">
          <div
            className={cn(
              "relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
              isCollapsed ? "justify-center" : "",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            {isActive && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
            )}
            <Icon className="w-[18px] h-[18px] flex-shrink-0" />
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className={cn(
                    "text-sm overflow-hidden whitespace-nowrap",
                    isActive ? "font-semibold" : "font-medium"
                  )}
                >
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </NavLink>
      </TooltipTrigger>
      {isCollapsed && (
        <TooltipContent side="right">
          <p>{label}</p>
        </TooltipContent>
      )}
    </Tooltip>
  );
};

export const Sidebar = () => {
  const location = useLocation();
  const { openModal } = useTradeModal();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [chartRoomOpen, setChartRoomOpen] = useState(
    location.pathname.startsWith('/chart-room')
  );
  
  const isChartRoomActive = location.pathname.startsWith('/chart-room');

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col z-40 transition-all duration-300",
        isCollapsed ? "w-16" : "w-52"
      )}
    >
      {/* Collapse/Expand toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-8 z-50 w-6 h-6 rounded-full bg-sidebar border border-sidebar-border shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors duration-200"
      >
        {isCollapsed ? (
          <ChevronRight className="w-3.5 h-3.5" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Logo Section */}
      <div className="px-4 py-4 border-b border-sidebar-border/50">
        <div className="flex flex-col items-center justify-center">
          <AnimatePresence>
            {!isCollapsed ? (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden flex flex-col items-center"
              >
                <span className="text-2xl tracking-tight whitespace-nowrap" style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
                  <span className="font-normal text-foreground">Trade</span>
                  <span className="font-bold text-foreground">Valley</span>
                </span>
                <span className="text-[9px] tracking-widest uppercase text-muted-foreground mt-0.5 whitespace-nowrap" style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}>
                  Look inward<span className="text-[13px] font-bold text-muted-foreground/70 mx-0.5">/</span>Trade forward
                </span>
              </motion.div>
            ) : (
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-primary-foreground" style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}>TV</span>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Add Trade Button */}
      <div className="px-3 pt-4 pb-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => openModal()}
              className={cn(
                "w-full text-primary-foreground rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-200 hover:opacity-90 active:scale-[0.98]",
                isCollapsed ? "h-9 px-0" : "h-10 px-4"
              )}
              style={{ backgroundColor: 'hsl(var(--primary-active))' }}
            >
              <Plus className="w-[18px] h-[18px]" />
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="overflow-hidden whitespace-nowrap text-sm"
                  >
                    Add Trade
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </TooltipTrigger>
          {isCollapsed && (
            <TooltipContent side="right">
              <p>Add Trade</p>
            </TooltipContent>
          )}
        </Tooltip>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto pt-1">
        {/* Dashboard */}
        <NavItem {...dashboardItem} isCollapsed={isCollapsed} />

        {/* Divider */}
        <div className="py-1.5">
          <div className="h-px bg-sidebar-border/40" />
        </div>

        {/* Trading Views */}
        {tradingViewItems.map((item) => (
          <NavItem key={item.path} {...item} isCollapsed={isCollapsed} />
        ))}

        {/* Divider */}
        <div className="py-1.5">
          <div className="h-px bg-sidebar-border/40" />
        </div>

        {/* Analysis & Planning */}
        {analysisItems.map((item) => (
          <NavItem key={item.path} {...item} isCollapsed={isCollapsed} />
        ))}
        
        {/* Chart Room */}
        {isCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <NavLink to="/chart-room/drawdown" className="block">
                <div
                  className={cn(
                    "relative flex items-center justify-center px-3 py-2.5 rounded-lg transition-all duration-200",
                    isChartRoomActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  {isChartRoomActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
                  )}
                  <BarChart3 className="w-[18px] h-[18px] flex-shrink-0" />
                </div>
              </NavLink>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Chart Room</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <Collapsible open={chartRoomOpen} onOpenChange={setChartRoomOpen}>
            <CollapsibleTrigger asChild>
              <button
                className={cn(
                  "relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  isChartRoomActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                {isChartRoomActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
                )}
                <BarChart3 className="w-[18px] h-[18px] flex-shrink-0" />
                <span className={cn("text-sm flex-1 text-left", isChartRoomActive ? "font-semibold" : "font-medium")}>Chart Room</span>
                <ChevronDown 
                  className={cn(
                    "w-3.5 h-3.5 transition-transform duration-200",
                    chartRoomOpen ? "rotate-180" : ""
                  )} 
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="ml-5 mt-0.5 space-y-0.5 border-l border-sidebar-border/40 pl-3">
                {chartRoomItems.map((item) => {
                  const isSubActive = location.pathname === item.path;
                  return (
                    <NavLink key={item.path} to={item.path} className="block">
                      <div
                        className={cn(
                          "relative flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[13px] transition-all duration-200",
                          isSubActive
                            ? "text-primary font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                        )}
                      >
                        {isSubActive && (
                          <div className="w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                        )}
                        <span>{item.label}</span>
                      </div>
                    </NavLink>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </nav>

      {/* Bottom Section - Account Menu */}
      <div className="px-3 mt-auto">
        <div className="py-1.5">
          <div className="h-px bg-sidebar-border/40" />
        </div>
        <SidebarAccountMenu isCollapsed={isCollapsed} />
      </div>
    </aside>
  );
};
