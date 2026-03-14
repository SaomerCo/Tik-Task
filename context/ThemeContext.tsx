import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { AppColors, AppTheme } from '../constants/Colors';

// ─────────────────────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────────────────────
export type ThemeMode = 'light' | 'dark' | 'system' | 'dennise';

interface ThemeContextValue {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  colors: AppColors;
  isDark: boolean;
  isThemeLoading: boolean;
}

const STORAGE_KEY = '@estudyl_theme_preference';

const ThemeContext = createContext<ThemeContextValue>({
  themeMode: 'system',
  setThemeMode: async () => { },
  colors: AppTheme.light,
  isDark: false,
  isThemeLoading: true,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemScheme = useColorScheme();

  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isThemeLoading, setIsThemeLoading] = useState(true);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored === 'light' || stored === 'dark' || stored === 'system' || stored === 'dennise') {
          setThemeModeState(stored as ThemeMode);
        }
      } catch {
      } finally {
        setIsThemeLoading(false);
      }
    };
    loadTheme();
  }, []);

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, mode);
    } catch { }
  }, []);

  // Lógica para determinar qué colores inyectar
  let activeTheme: 'light' | 'dark' | 'dennise' = 'light';

  if (themeMode === 'dennise') {
    activeTheme = 'dennise';
  } else if (themeMode === 'dark' || (themeMode === 'system' && systemScheme === 'dark')) {
    activeTheme = 'dark';
  }

  const isDark = activeTheme === 'dark';
  const colors = AppTheme[activeTheme];

  return (
    <ThemeContext.Provider value={{ themeMode, setThemeMode, colors, isDark, isThemeLoading }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);