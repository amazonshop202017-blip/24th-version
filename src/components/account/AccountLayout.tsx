import { ReactNode } from 'react';
import { AccountSidebar } from './AccountSidebar';

interface AccountLayoutProps {
  children: ReactNode;
}

export const AccountLayout = ({ children }: AccountLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <AccountSidebar />
      <main className="ml-52 min-h-screen flex flex-col">
        <div className="p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
};
