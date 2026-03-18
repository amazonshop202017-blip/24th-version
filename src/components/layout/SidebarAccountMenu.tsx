import { CircleUser, Settings, LogOut, Sun, Moon } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AnimatePresence, motion } from 'framer-motion';

export const SidebarAccountMenu = ({ isCollapsed }: { isCollapsed: boolean }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isDark = theme === 'dark';

  const displayName = user?.email?.split('@')[0] || 'Account';

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "w-full flex items-center gap-3 rounded-lg transition-all duration-200 mb-2",
                isCollapsed ? "justify-center p-2" : "px-3 py-2.5",
                "bg-muted/40 hover:bg-muted/70"
              )}
            >
              <div className={cn(
                "rounded-full bg-primary flex items-center justify-center flex-shrink-0",
                isCollapsed ? "w-7 h-7" : "w-8 h-8"
              )}>
                <span className="text-[10px] font-bold text-primary-foreground uppercase">
                  {displayName.slice(0, 2)}
                </span>
              </div>
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="font-medium overflow-hidden whitespace-nowrap text-sm truncate text-foreground"
                  >
                    {displayName}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
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
              "relative inline-flex h-7 w-[52px] items-center rounded-full mx-1.5 border overflow-hidden transition-colors duration-500",
              isDark
                ? "bg-muted border-border"
                : "bg-primary border-primary"
            )}
          >
            <span
              className={cn(
                "absolute z-10 flex h-[22px] w-[22px] items-center justify-center rounded-full shadow-md transition-all duration-500 ease-in-out",
                isDark
                  ? "translate-x-[27px] bg-muted-foreground/30"
                  : "translate-x-[3px] bg-background"
              )}
            >
              <Sun className={cn(
                "absolute w-3.5 h-3.5 text-yellow-500 transition-all duration-500",
                isDark ? "opacity-0 rotate-90 scale-0" : "opacity-100 rotate-0 scale-100"
              )} />
              <Moon className={cn(
                "absolute w-3.5 h-3.5 text-foreground transition-all duration-500",
                isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-0"
              )} />
            </span>
          </button>
          <span className={cn("text-xs font-medium transition-colors", isDark ? "text-foreground" : "text-muted-foreground")}>Dark</span>
        </div>

        {/* Settings */}
        <button
          onClick={() => navigate('/settings')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-muted/60 transition-colors"
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
              ? "bg-muted text-foreground font-medium"
              : "text-foreground hover:bg-muted/60"
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
