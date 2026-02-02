import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { GlobalHeader } from './GlobalHeader';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-16 lg:ml-52 min-h-screen flex flex-col transition-all duration-300">
        <GlobalHeader />
        <div className="p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
};
