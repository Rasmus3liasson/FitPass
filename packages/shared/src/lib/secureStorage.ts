import { Platform } from 'react-native';

// Type declarations for optional dependency
type SecureStoreModule = {
  getItemAsync: (key: string) => Promise<string | null>;
  setItemAsync: (key: string, value: string, options?: any) => Promise<void>;
  deleteItemAsync: (key: string) => Promise<void>;
  WHEN_UNLOCKED_THIS_DEVICE_ONLY?: number;
};

// Dynamically import expo-secure-store (optional peer dependency)
let SecureStore: SecureStoreModule | null = null;
try {
  SecureStore = require('expo-secure-store');
} catch {
  // expo-secure-store not available (web platform or not installed)
}

const SECURE_STORAGE_PREFIX = 'fitpass_secure_';

/**
 * Secure storage wrapper using Expo SecureStore
 * Provides encrypted storage for sensitive data like tokens
 * Falls back to sessionStorage on web (temporary, in-memory)
 */
export class SecureStorage {
  /**
   * Get item from secure storage
   */
  async getItem(key: string): Promise<string | null> {
    try {
      // SecureStore only works on native (iOS/Android)
      if (Platform.OS === 'web') {
        // For web, use sessionStorage (temporary, cleared on tab close)
        if (typeof window !== 'undefined' && window.sessionStorage) {
          return window.sessionStorage.getItem(`${SECURE_STORAGE_PREFIX}${key}`);
        }
        return null;
      }
      
      if (SecureStore) {
        return await SecureStore.getItemAsync(`${SECURE_STORAGE_PREFIX}${key}`);
      }
      
      console.warn('SecureStore not available');
      return null;
    } catch (error) {
      console.error('SecureStorage getItem error:', error);
      return null;
    }
  }

  /**
   * Set item in secure storage
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.sessionStorage) {
          window.sessionStorage.setItem(`${SECURE_STORAGE_PREFIX}${key}`, value);
        }
        return;
      }
      
      if (SecureStore) {
        // Use highest security option available
        const options = SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY 
          ? { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY }
          : undefined;
        
        await SecureStore.setItemAsync(`${SECURE_STORAGE_PREFIX}${key}`, value, options);
      } else {
        console.warn('SecureStore not available, cannot store securely');
      }
    } catch (error) {
      console.error('SecureStorage setItem error:', error);
      throw error;
    }
  }

  /**
   * Remove item from secure storage
   */
  async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && window.sessionStorage) {
          window.sessionStorage.removeItem(`${SECURE_STORAGE_PREFIX}${key}`);
        }
        return;
      }
      
      if (SecureStore) {
        await SecureStore.deleteItemAsync(`${SECURE_STORAGE_PREFIX}${key}`);
      }
    } catch (error) {
      console.error('SecureStorage removeItem error:', error);
    }
  }
}

export const secureStorage = new SecureStorage();
