import { createContext, useContext, useState, type ReactNode } from 'react';

interface DashboardEditContextType {
  isEditMode: boolean;
  setIsEditMode: (v: boolean) => void;
  toggleEditMode: () => void;
}

const DashboardEditContext = createContext<DashboardEditContextType>({
  isEditMode: false,
  setIsEditMode: () => {},
  toggleEditMode: () => {},
});

export const useDashboardEdit = () => useContext(DashboardEditContext);

export const DashboardEditProvider = ({ children }: { children: ReactNode }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const toggleEditMode = () => setIsEditMode(v => !v);
  return (
    <DashboardEditContext.Provider value={{ isEditMode, setIsEditMode, toggleEditMode }}>
      {children}
    </DashboardEditContext.Provider>
  );
};
