import { type ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import { GlobalHeader } from './GlobalHeader';
import { SelectedFiltersBar } from './SelectedFiltersBar';
import { cn } from '@/lib/utils';
import { Menu, X } from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile hamburger / close toggle */}
      <button
        className="fixed top-3 left-3 z-50 md:hidden p-2 rounded-lg bg-card border border-border shadow-sm"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? (
          <X className="w-5 h-5 text-foreground" />
        ) : (
          <Menu className="w-5 h-5 text-foreground" />
        )}
      </button>

      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />
      <main className={cn(
        "min-h-screen flex flex-col transition-all duration-300 p-2 md:p-3 lg:p-4",
        "ml-0 md:ml-16 lg:ml-52",
        !isCollapsed ? "lg:ml-52" : "lg:ml-16",
        isCollapsed ? "md:ml-16" : "md:ml-52"
      )}>
        <div className="flex-1 bg-card rounded-2xl shadow-[0_1px_3px_0_hsl(0_0%_0%/0.06)] border border-border/50 flex flex-col overflow-hidden">
          <GlobalHeader />
          <SelectedFiltersBar />
          <div className="p-4 md:p-6 lg:p-8 flex-1">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
