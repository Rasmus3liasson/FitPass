import { Linking, Platform } from 'react-native';

export const ROUTES = {
  /**
   * Opens the app's settings page on the device
   * - iOS: Opens Settings app directly to this app's page
   * - Android: Opens app info/settings page
   */
  APP_SETTINGS: Platform.select({
    ios: 'App-Prefs:root=Privacy&path=CAMERA', // iOS: Go to Privacy > Camera
    android: 'package:com.anonymous.fitpass', // Android: App info page
    default: '',
  }),

  /**
   * Fallback to general settings if app-specific fails
   */
  GENERAL_SETTINGS: Platform.select({
    ios: 'App-Prefs:',
    android: 'android.settings.SETTINGS',
    default: '',
  }),
};

/**
 * Opens the app settings page
 */
export const openAppSettings = async (): Promise<boolean> => {
  try {
    const settingsURL = ROUTES.APP_SETTINGS;

    if (!settingsURL) {
      console.warn('Settings URL not available for this platform');
      return false;
    }

    // Check if the URL can be opened
    const canOpen = await Linking.canOpenURL(settingsURL);

    if (canOpen) {
      await Linking.openURL(settingsURL);
      return true;
    } else {
      // Try fallback to general settings
      const generalURL = ROUTES.GENERAL_SETTINGS;
      if (generalURL && (await Linking.canOpenURL(generalURL))) {
        await Linking.openURL(generalURL);
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Failed to open settings:', error);
    return false;
  }
};
