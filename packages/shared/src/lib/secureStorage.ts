import { Platform } from 'react-native';

interface Storage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

interface SecureStoreModule {
  getItemAsync: (key: string) => Promise<string | null>;
  setItemAsync: (key: string, value: string, options?: any) => Promise<void>;
  deleteItemAsync: (key: string) => Promise<void>;
  WHEN_UNLOCKED_THIS_DEVICE_ONLY?: number;
}

let SecureStore: SecureStoreModule | null = null;
try {
  SecureStore = require('expo-secure-store');
} catch {}

const SECURE_STORAGE_PREFIX = `${process.env.EXPO_PUBLIC_APP_NAME}_secure_`;

const getSessionStorage = (): Storage | null => {
  if (Platform.OS !== 'web') return null;
  return (globalThis as any)?.sessionStorage ?? null;
};

export class SecureStorage {
  async getItem(key: string): Promise<string | null> {
    try {
      const storage = getSessionStorage();
      if (storage) {
        return storage.getItem(`${SECURE_STORAGE_PREFIX}${key}`);
      }

      return SecureStore ? await SecureStore.getItemAsync(`${SECURE_STORAGE_PREFIX}${key}`) : null;
    } catch {
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      const storage = getSessionStorage();
      if (storage) {
        storage.setItem(`${SECURE_STORAGE_PREFIX}${key}`, value);
        return;
      }

      if (SecureStore) {
        const options = SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY
          ? { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY }
          : undefined;

        await SecureStore.setItemAsync(`${SECURE_STORAGE_PREFIX}${key}`, value, options);
      }
    } catch {
      throw new Error('SecureStorage setItem failed');
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      const storage = getSessionStorage();
      if (storage) {
        storage.removeItem(`${SECURE_STORAGE_PREFIX}${key}`);
        return;
      }

      if (SecureStore) {
        await SecureStore.deleteItemAsync(`${SECURE_STORAGE_PREFIX}${key}`);
      }
    } catch {}
  }
}

export const secureStorage = new SecureStorage();
