import React, { createContext, useContext, useState, useCallback } from 'react';

interface TabContextType {
  tabIndex: number;
  setTabIndex: (index: number) => void;
}

const TabContext = createContext<TabContextType>({
  tabIndex: 3,
  setTabIndex: () => {},
});

export function TabProvider({ children }: { children: React.ReactNode }) {
  const [tabIndex, setTabIndex] = useState(3); // Inicio por defecto

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
  '/ramos':       0,
  'ramos':        0,
  '/apuntes':     1,
  'apuntes':      1,
  '/horario':     2,
  'horario':      2,
  '/index':       3,
  'index':        3,
  '/':            3,
  '/eventos':     4,
  'eventos':      4,
  '/enfoque':     5,
  'enfoque':      5,
  '/rendimiento': 6,
  'rendimiento':  6,
};
