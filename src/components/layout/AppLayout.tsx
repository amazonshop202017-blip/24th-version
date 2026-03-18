import { type ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import { GlobalHeader } from './GlobalHeader';
import { SelectedFiltersBar } from './SelectedFiltersBar';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className={cn(
        "min-h-screen flex flex-col transition-all duration-300",
        isCollapsed ? "ml-16" : "ml-52"
      )}>
        <GlobalHeader />
        <SelectedFiltersBar />
        <div className="p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
};
