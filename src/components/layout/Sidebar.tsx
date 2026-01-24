import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, LineChart, ListOrdered, FileText, Settings, Target, Plus, ChevronLeft, ChevronRight, BarChart3, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useTradeModal } from '@/contexts/TradeModalContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Target, label: 'Setups', path: '/strategies' },
  { icon: FileText, label: 'Reports', path: '/reports' },
];

const tradesItems = [
  { label: 'All Trades', path: '/trades' },
  { label: 'Days View', path: '/trades/days-view' },
];

const chartRoomItems = [
  { label: 'Drawdown', path: '/chart-room/drawdown' },
  { label: 'Exit Analysis', path: '/chart-room/exit-analysis' },
  { label: 'Holding Time', path: '/chart-room/holding-time' },
  { label: 'Performance by Instrument', path: '/chart-room/performance-by-instrument' },
  { label: 'Performance by Setup', path: '/chart-room/performance-by-setup' },
  { label: 'Performance by Time', path: '/chart-room/performance-by-time' },
  { label: 'Performance Ratio', path: '/chart-room/performance-ratio' },
  { label: 'Risk Distribution', path: '/chart-room/risk-distribution' },
  { label: 'Trade Management', path: '/chart-room/trade-management' },
];

export const Sidebar = () => {
  const location = useLocation();
  const { openModal } = useTradeModal();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [chartRoomOpen, setChartRoomOpen] = useState(
    location.pathname.startsWith('/chart-room')
  );
  const [tradesOpen, setTradesOpen] = useState(
    location.pathname.startsWith('/trades')
  );
  
  const isChartRoomActive = location.pathname.startsWith('/chart-room');
  const isTradesActive = location.pathname.startsWith('/trades');

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col z-40 transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo Section */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0">
            <LineChart className="w-5 h-5 text-primary-foreground" />
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="overflow-hidden"
              >
                <h1 className="text-lg font-bold text-foreground whitespace-nowrap">TradeJournal</h1>
                <p className="text-xs text-muted-foreground whitespace-nowrap">Track. Analyze. Improve.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Add Trade Button */}
      <div className="p-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              onClick={() => openModal()}
              className={cn(
                "w-full bg-primary text-primary-foreground rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-200 hover:bg-primary/90",
                isCollapsed ? "h-10 px-0" : "h-11 px-4"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-5 h-5" />
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    Add Trade
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </TooltipTrigger>
          {isCollapsed && (
            <TooltipContent side="right">
              <p>Add Trade</p>
            </TooltipContent>
          )}
        </Tooltip>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {/* Dashboard */}
        <Tooltip>
          <TooltipTrigger asChild>
            <NavLink to="/" className="block">
              <motion.div
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200",
                  isCollapsed ? "justify-center" : "",
                  location.pathname === '/'
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
                whileHover={{ x: location.pathname === '/' || isCollapsed ? 0 : 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="font-medium overflow-hidden whitespace-nowrap"
                    >
                      Dashboard
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </NavLink>
          </TooltipTrigger>
          {isCollapsed && (
            <TooltipContent side="right">
              <p>Dashboard</p>
            </TooltipContent>
          )}
        </Tooltip>

        {/* Trades Dropdown */}
        {isCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <NavLink to="/trades" className="block">
                <motion.div
                  className={cn(
                    "flex items-center justify-center px-3 py-3 rounded-xl transition-all duration-200",
                    isTradesActive
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                  whileTap={{ scale: 0.98 }}
                >
                  <ListOrdered className="w-5 h-5 flex-shrink-0" />
                </motion.div>
              </NavLink>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Trades</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <Collapsible open={tradesOpen} onOpenChange={setTradesOpen}>
            <CollapsibleTrigger asChild>
              <motion.button
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200",
                  isTradesActive
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
                whileHover={{ x: isTradesActive ? 0 : 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <ListOrdered className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium flex-1 text-left">Trades</span>
                <ChevronDown 
                  className={cn(
                    "w-4 h-4 transition-transform duration-200",
                    tradesOpen ? "rotate-180" : ""
                  )} 
                />
              </motion.button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="ml-4 mt-1 space-y-1 border-l border-sidebar-border pl-4">
                {tradesItems.map((item) => {
                  const isSubActive = location.pathname === item.path;
                  return (
                    <NavLink key={item.path} to={item.path} className="block">
                      <motion.div
                        className={cn(
                          "flex items-center px-3 py-2 rounded-lg text-sm transition-all duration-200",
                          isSubActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                        whileHover={{ x: isSubActive ? 0 : 4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {item.label}
                      </motion.div>
                    </NavLink>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Other Nav Items */}
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path === '/reports' && location.pathname.startsWith('/reports'));
          return (
            <Tooltip key={item.path}>
              <TooltipTrigger asChild>
                <NavLink to={item.path} className="block">
                  <motion.div
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200",
                      isCollapsed ? "justify-center" : "",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-lg"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                    whileHover={{ x: isActive || isCollapsed ? 0 : 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <AnimatePresence>
                      {!isCollapsed && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          className="font-medium overflow-hidden whitespace-nowrap"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </NavLink>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right">
                  <p>{item.label}</p>
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}
        
        {/* Chart Room Dropdown */}
        {isCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <NavLink to="/chart-room/drawdown" className="block">
                <motion.div
                  className={cn(
                    "flex items-center justify-center px-3 py-3 rounded-xl transition-all duration-200",
                    isChartRoomActive
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                  whileTap={{ scale: 0.98 }}
                >
                  <BarChart3 className="w-5 h-5 flex-shrink-0" />
                </motion.div>
              </NavLink>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Chart Room</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <Collapsible open={chartRoomOpen} onOpenChange={setChartRoomOpen}>
            <CollapsibleTrigger asChild>
              <motion.button
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200",
                  isChartRoomActive
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
                whileHover={{ x: isChartRoomActive ? 0 : 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <BarChart3 className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium flex-1 text-left">Chart Room</span>
                <ChevronDown 
                  className={cn(
                    "w-4 h-4 transition-transform duration-200",
                    chartRoomOpen ? "rotate-180" : ""
                  )} 
                />
              </motion.button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="ml-4 mt-1 space-y-1 border-l border-sidebar-border pl-4">
                {chartRoomItems.map((item) => {
                  const isSubActive = location.pathname === item.path;
                  return (
                    <NavLink key={item.path} to={item.path} className="block">
                      <motion.div
                        className={cn(
                          "flex items-center px-3 py-2 rounded-lg text-sm transition-all duration-200",
                          isSubActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                        whileHover={{ x: isSubActive ? 0 : 4 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {item.label}
                      </motion.div>
                    </NavLink>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
        
        {/* Settings */}
        <Tooltip>
          <TooltipTrigger asChild>
            <NavLink to="/settings" className="block">
              <motion.div
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200",
                  isCollapsed ? "justify-center" : "",
                  location.pathname === '/settings'
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
                whileHover={{ x: location.pathname === '/settings' || isCollapsed ? 0 : 4 }}
                whileTap={{ scale: 0.98 }}
              >
                <Settings className="w-5 h-5 flex-shrink-0" />
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="font-medium overflow-hidden whitespace-nowrap"
                    >
                      Settings
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </NavLink>
          </TooltipTrigger>
          {isCollapsed && (
            <TooltipContent side="right">
              <p>Settings</p>
            </TooltipContent>
          )}
        </Tooltip>
      </nav>

      {/* Collapse Button */}
      <div className="p-4 border-t border-sidebar-border">
        <motion.button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200",
            isCollapsed ? "justify-center" : ""
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Collapse</span>
            </>
          )}
        </motion.button>
      </div>
    </aside>
  );
};
