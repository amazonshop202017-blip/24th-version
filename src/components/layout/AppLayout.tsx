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
      <div className={cn(
        "min-h-screen transition-all duration-300 p-3 md:p-4 lg:p-5",
        "ml-0 md:ml-16 lg:ml-52",
        !isCollapsed ? "lg:ml-52" : "lg:ml-16",
        isCollapsed ? "md:ml-16" : "md:ml-52"
      )}>
        <main className="min-h-[calc(100vh-2.5rem)] bg-card rounded-2xl shadow-[0_2px_8px_0_hsl(0_0%_0%/0.07)] border border-border/40 flex flex-col overflow-hidden">
          <GlobalHeader />
          <SelectedFiltersBar />
          <div className="p-4 md:p-6 lg:p-8 flex-1">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
