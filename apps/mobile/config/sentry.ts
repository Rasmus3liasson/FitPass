import * as Sentry from '@sentry/react-native';
import { SENTRY_CONFIG } from '@shared/config/sentry';
import Constants from 'expo-constants';

const SENTRY_DSN =
  Constants.expoConfig?.extra?.EXPO_PUBLIC_SENTRY_DSN || process.env.EXPO_PUBLIC_SENTRY_DSN;

export function initSentry() {
  if (!SENTRY_DSN) {
    console.warn('Sentry DSN not found. Sentry will not be initialized.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,

    // Use shared config values
    tracesSampleRate: SENTRY_CONFIG.tracesSampleRate,
    enableAutoSessionTracking: SENTRY_CONFIG.enableAutoSessionTracking,
    sessionTrackingIntervalMillis: SENTRY_CONFIG.sessionTrackingIntervalMillis,
    enableNative: SENTRY_CONFIG.enableNative,
    debug: SENTRY_CONFIG.debug && __DEV__,

    // Environment and release info
    environment:
      Constants.expoConfig?.extra?.EXPO_PUBLIC_ENVIRONMENT ||
      process.env.EXPO_PUBLIC_ENVIRONMENT ||
      'development',
    release: `${Constants.expoConfig?.name}@${Constants.expoConfig?.version}`,
    dist:
      Constants.expoConfig?.ios?.buildNumber ||
      Constants.expoConfig?.android?.versionCode?.toString(),

    // Note: profilesSampleRate and advanced tracing features require @sentry/react-native >= 8.0.0
    // For version 7.10.0, we use basic configuration

    // Filter events in development
    beforeSend(event, hint) {
      if (__DEV__ && !SENTRY_CONFIG.shouldSendInDevelopment) {
        console.log('Sentry Event (dev mode, not sent):', event);
        return null;
      }
      return event;
    },
  });
}

// Export Sentry for use in other parts of the app
export { Sentry };
