import { NavigationService } from '@shared/services/navigationService';
import { Router } from 'expo-router';

/**
 * Creates a NavigationService from an expo-router instance.
 * This bridges expo-router to the shared navigation interface.
 */
export const createNavigationService = (router: Router): NavigationService => {
  return {
    push: (route: string) => {
      router.push(route as any);
    },
    replace: (route: string) => {
      router.replace(route as any);
    },
    back: () => {
      router.back();
    },
    canGoBack: () => {
      return router.canGoBack();
    },
  };
};
