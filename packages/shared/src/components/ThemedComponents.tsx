import { ReactNode } from "react";
import { View } from "react-native";
import { useTheme } from "./ThemeProvider";

interface ThemedContainerProps {
  children: ReactNode;
  className?: string;
}

export function ThemedContainer({ children, className = "" }: ThemedContainerProps) {
  const { isDark } = useTheme();
  
  return (
    <View 
      className={`
        ${isDark 
          ? 'bg-background text-textPrimary' 
          : 'bg-lightBackground text-lightTextPrimary'
        } 
        ${className}
      `}
    >
      {children}
    </View>
  );
}

interface ThemedSurfaceProps {
  children: ReactNode;
  className?: string;
}

export function ThemedSurface({ children, className = "" }: ThemedSurfaceProps) {
  const { isDark } = useTheme();
  
  return (
    <View 
      className={`
        ${isDark 
          ? 'bg-surface border-accentGray/50' 
          : 'bg-lightSurface border-lightBorderGray'
        } 
        ${className}
      `}
    >
      {children}
    </View>
  );
}
