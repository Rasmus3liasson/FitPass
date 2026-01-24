import { StatusBar } from 'expo-status-bar';
import { createContext, ReactNode, useContext, useEffect } from 'react';
import { useColorScheme } from './useColorScheme';

type ThemeContextType = {
  isDark: boolean;
  colorScheme: 'light' | 'dark';
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const colorScheme = systemColorScheme ?? 'dark';
  const isDark = colorScheme === 'dark';

  const toggleTheme = () => {
    // For now, we'll follow system preference
    // You can implement manual toggle later if needed
  };

  // Add/remove dark class from document element for NativeWind
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, colorScheme, toggleTheme }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {children}
    </ThemeContext.Provider>
  );
}
