import { CircleUser, Settings, LogOut, Sun, Moon } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';

export const SidebarAccountMenu = ({ isCollapsed }: { isCollapsed: boolean }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isDark = theme === 'dark';

  const isAccountActive = location.pathname === '/settings' || location.pathname === '/account';

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <motion.button
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200",
                isCollapsed ? "justify-center" : "",
                isAccountActive
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <CircleUser className="w-5 h-5 flex-shrink-0" />
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="font-bold overflow-hidden whitespace-nowrap text-sm truncate"
                  >
                    {user?.email || 'Account'}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </PopoverTrigger>
        </TooltipTrigger>
        {isCollapsed && (
          <TooltipContent side="right">
            <p>{user?.email || 'Account'}</p>
          </TooltipContent>
        )}
      </Tooltip>

      <PopoverContent
        side="top"
        align="start"
        sideOffset={8}
        className="w-40 p-2"
      >
        {/* Theme Toggle - Switch style */}
        <div className="flex items-center justify-between px-3 py-2 rounded-lg">
          <span className="text-sm font-medium text-foreground">Theme</span>
          <button
            onClick={toggleTheme}
            className={cn(
              "relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-200",
              isDark ? "bg-muted" : "bg-muted"
            )}
          >
            <Sun className={cn(
              "absolute left-1.5 w-3.5 h-3.5 transition-colors",
              !isDark ? "text-primary" : "text-muted-foreground/40"
            )} />
            <Moon className={cn(
              "absolute right-1.5 w-3.5 h-3.5 transition-colors",
              isDark ? "text-primary" : "text-muted-foreground/40"
            )} />
            <span
              className={cn(
                "inline-block h-5 w-5 rounded-full bg-background shadow-sm transition-transform duration-200",
                isDark ? "translate-x-8" : "translate-x-1"
              )}
            />
          </button>
        </div>


        {/* Settings */}
        <button
          onClick={() => navigate('/settings')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>

        {/* Account */}
        <button
          onClick={() => navigate('/account')}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
            location.pathname === '/account'
              ? "bg-accent text-accent-foreground font-medium"
              : "text-foreground hover:bg-accent hover:text-accent-foreground"
          )}
        >
          <CircleUser className="w-4 h-4" />
          Account
        </button>

        

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </button>
      </PopoverContent>
    </Popover>
  );
};
