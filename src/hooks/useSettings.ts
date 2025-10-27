import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { useUserProfile } from './useUserProfile';

export type AppSettings = {
  // User profile settings (synced with backend)
  dark_mode: boolean;
  pushnotifications: boolean;
  emailupdates: boolean;
  classreminders: boolean;
  marketingnotifications: boolean;
  appupdates: boolean;
  
  // Local app settings (stored locally)
  biometric_auth: boolean;
  auto_backup: boolean;
  crash_reporting: boolean;
  analytics: boolean;
  offline_mode: boolean;
  language: string;
};

const DEFAULT_SETTINGS: AppSettings = {
  dark_mode: true,
  pushnotifications: false,
  emailupdates: false,
  classreminders: true,
  marketingnotifications: false,
  appupdates: true,
  biometric_auth: false,
  auto_backup: true,
  crash_reporting: true,
  analytics: true,
  offline_mode: false,
  language: 'sv',
};

const LOCAL_SETTINGS_KEY = 'app_local_settings';

// Settings that are stored locally vs in user profile
const LOCAL_SETTINGS = [
  'biometric_auth', // Only biometric auth stays local for security reasons
];

export const useSettings = () => {
  const auth = useAuth();
  const { data: userProfile, refetch } = useUserProfile(auth.user?.id || "");
  
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  // Check if biometric authentication is available
  useEffect(() => {
    const checkBiometricAvailability = async () => {
      const available = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(available && enrolled);
    };
    
    checkBiometricAvailability();
  }, []);

  // Load settings from both user profile and local storage
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      
      try {
        // Load local settings from AsyncStorage
        const localSettingsString = await AsyncStorage.getItem(LOCAL_SETTINGS_KEY);
        const localSettings = localSettingsString 
          ? JSON.parse(localSettingsString) 
          : {};

        // Combine user profile settings with local settings
        const combinedSettings: AppSettings = {
          ...DEFAULT_SETTINGS,
          // User profile settings (stored in database)
          dark_mode: userProfile?.dark_mode ?? DEFAULT_SETTINGS.dark_mode,
          pushnotifications: userProfile?.pushnotifications ?? DEFAULT_SETTINGS.pushnotifications,
          emailupdates: userProfile?.emailupdates ?? DEFAULT_SETTINGS.emailupdates,
          classreminders: userProfile?.classreminders ?? DEFAULT_SETTINGS.classreminders,
          marketingnotifications: userProfile?.marketingnotifications ?? DEFAULT_SETTINGS.marketingnotifications,
          appupdates: userProfile?.appupdates ?? DEFAULT_SETTINGS.appupdates,
          auto_backup: (userProfile as any)?.auto_backup ?? DEFAULT_SETTINGS.auto_backup,
          crash_reporting: (userProfile as any)?.crash_reporting ?? DEFAULT_SETTINGS.crash_reporting,
          analytics: (userProfile as any)?.analytics ?? DEFAULT_SETTINGS.analytics,
          offline_mode: (userProfile as any)?.offline_mode ?? DEFAULT_SETTINGS.offline_mode,
          language: (userProfile as any)?.language ?? DEFAULT_SETTINGS.language,
          // Local settings (only biometric_auth now)
          ...localSettings,
        };

        setSettings(combinedSettings);
      } catch (error) {
        console.error('Error loading settings:', error);
        setSettings(DEFAULT_SETTINGS);
      } finally {
        setIsLoading(false);
      }
    };

    if (userProfile !== undefined) {
      loadSettings();
    }
  }, [userProfile]);

  // Save local settings to AsyncStorage
  const saveLocalSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    try {
      const localSettingsToSave: any = {};
      
      Object.entries(newSettings).forEach(([key, value]) => {
        if (LOCAL_SETTINGS.includes(key)) {
          localSettingsToSave[key] = value;
        }
      });

      if (Object.keys(localSettingsToSave).length > 0) {
        const existingLocalSettings = await AsyncStorage.getItem(LOCAL_SETTINGS_KEY);
        const parsedExisting = existingLocalSettings ? JSON.parse(existingLocalSettings) : {};
        
        const updatedLocalSettings = { ...parsedExisting, ...localSettingsToSave };
        await AsyncStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(updatedLocalSettings));
      }
    } catch (error) {
      console.error('Error saving local settings:', error);
      throw error;
    }
  }, []);

  // Update a single setting
  const updateSetting = useCallback(async (
    key: keyof AppSettings,
    value: boolean | string
  ) => {
    if (!auth.user?.id) {
      throw new Error('User not authenticated');
    }

    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);

      // Save to appropriate storage
      if (LOCAL_SETTINGS.includes(key)) {
        // Save to local storage
        await saveLocalSettings({ [key]: value });
      } else {
        // Save to user profile (cast to any to bypass type checking since auth expects UserPreferences but actually updates UserProfile)
        await auth.updateUserPreferences(auth.user.id, { [key]: value } as any);
        await refetch(); // Refresh user profile data
      }
    } catch (error) {
      console.error(`Error updating setting ${key}:`, error);
      // Revert the optimistic update
      setSettings(settings);
      throw error;
    }
  }, [settings, auth, saveLocalSettings, refetch]);

  // Enable biometric authentication
  const enableBiometricAuth = useCallback(async () => {
    try {
      if (!biometricAvailable) {
        throw new Error('Biometric authentication not available');
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Aktivera biometrisk autentisering',
        fallbackLabel: 'Använd lösenord',
      });

      if (result.success) {
        await updateSetting('biometric_auth', true);
        return true;
      } else {
        throw new Error('Biometric authentication failed');
      }
    } catch (error) {
      console.error('Error enabling biometric auth:', error);
      throw error;
    }
  }, [biometricAvailable, updateSetting]);

  // Clear app cache
  const clearCache = useCallback(async () => {
    try {
      // Clear AsyncStorage except for essential settings
      const keys = await AsyncStorage.getAllKeys();
      const keysToRemove = keys.filter(key => 
        !key.includes('auth') && 
        !key.includes('user') && 
        key !== LOCAL_SETTINGS_KEY
      );
      
      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
      }

      return true;
    } catch (error) {
      console.error('Error clearing cache:', error);
      throw error;
    }
  }, []);

  // Export user data
  const exportData = useCallback(async () => {
    try {
      if (!userProfile) {
        throw new Error('No user profile data available');
      }

      const dataToExport = {
        profile: userProfile,
        settings: settings,
        exportDate: new Date().toISOString(),
      };

      // In a real app, you might want to:
      // 1. Create a downloadable file
      // 2. Send via email
      // 3. Upload to user's cloud storage
      
      console.log('Data export:', dataToExport);
      return dataToExport;
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }, [userProfile, settings]);

  // Reset all settings to defaults
  const resetSettings = useCallback(async () => {
    try {
      if (!auth.user?.id) {
        throw new Error('User not authenticated');
      }

      // Reset profile settings (these are the actual UserProfile fields)
      const profileDefaults: any = {
        dark_mode: DEFAULT_SETTINGS.dark_mode,
        pushnotifications: DEFAULT_SETTINGS.pushnotifications,
        emailupdates: DEFAULT_SETTINGS.emailupdates,
        classreminders: DEFAULT_SETTINGS.classreminders,
        marketingnotifications: DEFAULT_SETTINGS.marketingnotifications,
        appupdates: DEFAULT_SETTINGS.appupdates,
        auto_backup: DEFAULT_SETTINGS.auto_backup,
        crash_reporting: DEFAULT_SETTINGS.crash_reporting,
        analytics: DEFAULT_SETTINGS.analytics,
        offline_mode: DEFAULT_SETTINGS.offline_mode,
        language: DEFAULT_SETTINGS.language,
      };

      await auth.updateUserPreferences(auth.user.id, profileDefaults as any);

      // Reset local settings
      const localDefaults: any = {};
      LOCAL_SETTINGS.forEach(key => {
        localDefaults[key] = DEFAULT_SETTINGS[key as keyof AppSettings];
      });

      await AsyncStorage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(localDefaults));

      // Update state
      setSettings(DEFAULT_SETTINGS);
      await refetch();
    } catch (error) {
      console.error('Error resetting settings:', error);
      throw error;
    }
  }, [auth, refetch]);

  return {
    settings,
    isLoading,
    biometricAvailable,
    updateSetting,
    enableBiometricAuth,
    clearCache,
    exportData,
    resetSettings,
  };
};