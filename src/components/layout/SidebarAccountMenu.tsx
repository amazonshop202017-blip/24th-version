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
        {/* Theme Toggle */}
        <div className="flex items-center justify-between px-2 py-2 rounded-lg">
          <span className={cn("text-xs font-medium transition-colors", !isDark ? "text-foreground" : "text-muted-foreground")}>Light</span>
          <button
            onClick={toggleTheme}
            className={cn(
              "relative inline-flex h-7 w-[52px] items-center rounded-full transition-all duration-300 mx-1.5",
              isDark
                ? "bg-[hsl(222_47%_18%)] border border-[hsl(215_20%_30%)]"
                : "bg-primary border border-primary"
            )}
          >
            {/* Sun icon - visible on knob in light mode */}
            {!isDark && (
              <span className="absolute left-[3px] z-10 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-background shadow-md">
                <Sun className="w-3.5 h-3.5 text-yellow-500" />
              </span>
            )}
            {/* Moon icon - visible on knob in dark mode */}
            {isDark && (
              <span className="absolute right-[3px] z-10 flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[hsl(215_20%_30%)] shadow-md">
                <Moon className="w-3.5 h-3.5 text-white" />
              </span>
            )}
            {/* Decorative dots/stars in dark mode */}
            {isDark && (
              <>
                <span className="absolute left-2.5 top-1.5 h-1 w-1 rounded-full bg-white/60" />
                <span className="absolute left-4 top-3 h-0.5 w-0.5 rounded-full bg-white/40" />
                <span className="absolute left-2 bottom-1.5 h-0.5 w-0.5 rounded-full bg-white/50" />
              </>
            )}
            {/* Decorative dots in light mode */}
            {!isDark && (
              <>
                <span className="absolute right-3 top-1.5 h-1 w-1 rounded-full bg-primary-foreground/60" />
                <span className="absolute right-2 bottom-2 h-0.5 w-0.5 rounded-full bg-primary-foreground/40" />
              </>
            )}
          </button>
          <span className={cn("text-xs font-medium transition-colors", isDark ? "text-foreground" : "text-muted-foreground")}>Dark</span>
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
