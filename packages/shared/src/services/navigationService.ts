import { createContext, useContext } from 'react';

export interface NavigationService {
  push: (route: string) => void;
  replace: (route: string) => void;
  back: () => void;
  canGoBack: () => boolean;
}

const NavigationContext = createContext<NavigationService | null>(null);

export const NavigationProvider = NavigationContext.Provider;

/**
 * Hook to access navigation from shared components.
 * This abstracts expo-router so shared components don't directly depend on it.
 */
export const useNavigation = (): NavigationService => {
  const navigation = useContext(NavigationContext);

  if (!navigation) {
    throw new Error(
      'useNavigation must be used within a NavigationProvider. ' +
        'Make sure to wrap your app with NavigationProvider in _layout.tsx'
    );
  }

  return navigation;
};

/**
 * Optional: Check if navigation is available without throwing an error
 */
export const useNavigationOptional = (): NavigationService | null => {
  return useContext(NavigationContext);
};
