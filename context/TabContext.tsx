import React, { createContext, useCallback, useContext, useState } from 'react';

interface TabContextType {
  tabIndex: number;
  setTabIndex: (index: number) => void;
}

const TabContext = createContext<TabContextType>({
  tabIndex: 0,
  setTabIndex: () => { },
});

export function TabProvider({ children }: { children: React.ReactNode }) {
  const [tabIndex, setTabIndex] = useState(0); // Apuntes por defecto

  const handleSetTabIndex = useCallback((index: number) => {
    setTabIndex(index);
  }, []);

  return (
    <TabContext.Provider value={{ tabIndex, setTabIndex: handleSetTabIndex }}>
      {children}
    </TabContext.Provider>
  );
}

export function useTabContext() {
  return useContext(TabContext);
}

// Mapa de rutas a índices para navegación desde cualquier screen
export const ROUTE_TO_INDEX: Record<string, number> = {
  '/apuntes': 0,
  'apuntes': 0,
  '/': 0,
};
