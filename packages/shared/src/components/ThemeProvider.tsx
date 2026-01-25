import { StatusBar } from 'expo-status-bar';
import { createContext, ReactNode, useContext } from 'react';
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
    // optional later
  };

  return (
    <ThemeContext.Provider value={{ isDark, colorScheme, toggleTheme }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {children}
    </ThemeContext.Provider>
  );
}
